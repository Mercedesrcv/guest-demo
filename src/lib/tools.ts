import {
  CATEGORIES,
  getAccessState,
  lastNameMatches,
  maskEmail,
} from "./access";
import {
  addEvent,
  addFeedback,
  addIncident,
  getReservation,
  saveReservation,
} from "./store";
import type { IncidentCategory, Reservation } from "./types";

const MAX_IDENTITY_ATTEMPTS = 3;

type Params = Record<string, unknown>;
export type ToolResult = Record<string, unknown>;

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const bool = (v: unknown) => v === true || v === "true";
const category = (v: unknown): IncidentCategory =>
  CATEGORIES.includes(v as IncidentCategory) ? (v as IncidentCategory) : "otro";
const urgency = (v: unknown): "baja" | "media" | "alta" =>
  v === "alta" || v === "media" || v === "baja" ? v : "media";

/**
 * Server-side implementation of every tool the voice agent can call.
 * The browser only forwards the call: all rules live here.
 */
export async function runTool(
  name: string,
  reservationId: string,
  p: Params,
): Promise<ToolResult> {
  const r = await getReservation(reservationId);
  if (!r) return { ok: false, error: "reserva_no_encontrada" };

  switch (name) {
    case "consultar_estado_acceso":
      return consultarEstadoAcceso(r);
    case "verificar_identidad":
      return verificarIdentidad(r, str(p.apellido));
    case "reenviar_pin":
      return reenviarPin(r);
    case "abrir_puerta_remota":
      return abrirPuertaRemota(r, str(p.apellido));
    case "registrar_incidencia":
      return registrarIncidencia(r, p, false);
    case "escalar_a_humano":
      return registrarIncidencia(r, p, true);
    case "guardar_feedback":
      return guardarFeedback(r, p);
    default:
      return { ok: false, error: "herramienta_desconocida" };
  }
}

function consultarEstadoAcceso(r: Reservation): ToolResult {
  const s = getAccessState(r);
  return {
    ok: true,
    habitacion: r.room,
    planta: r.floor,
    checkin_online_completado: s.checkinDone,
    pin_liberado: s.pinReleased,
    acceso_valido_desde: r.pinValidFrom,
    acceso_valido_hasta: r.pinValidTo,
    hora_actual: r.demoNow,
    ventana_de_acceso: s.windowStatus, // before | active | expired
    minutos_hasta_inicio: s.minutesToStart,
    minutos_desde_caducidad: s.minutesSinceExpiry,
    estado_cerradura: s.lockStatus,
    causa_mas_probable: s.probableCause,
    se_puede_abrir_en_remoto: s.canOpenRemotely,
    motivo_bloqueo_apertura: s.remoteOpenBlockedReason,
    nota: "Nunca digas el PIN en voz alta. El huésped lo ve en la sección Mi acceso.",
  };
}

async function verificarIdentidad(
  r: Reservation,
  apellido: string,
): Promise<ToolResult> {
  if (r.failedIdentityAttempts >= MAX_IDENTITY_ATTEMPTS) {
    return {
      ok: false,
      bloqueado: true,
      mensaje:
        "Demasiados intentos fallidos. No se puede verificar. Escala a una persona del hotel.",
    };
  }
  const ok = lastNameMatches(r, apellido);
  if (!ok) {
    r.failedIdentityAttempts += 1;
    await saveReservation(r);
  }
  await addEvent({
    reservationId: r.id,
    guestName: `${r.guestName} ${r.lastName}`,
    room: r.room,
    type: "identity_check",
    ok,
    detail: ok
      ? "Apellido verificado por voz"
      : `Apellido incorrecto (intento ${r.failedIdentityAttempts}/${MAX_IDENTITY_ATTEMPTS})`,
  });
  return ok
    ? { ok: true, mensaje: "Identidad verificada." }
    : {
        ok: false,
        bloqueado: r.failedIdentityAttempts >= MAX_IDENTITY_ATTEMPTS,
        intentos_restantes: Math.max(
          0,
          MAX_IDENTITY_ATTEMPTS - r.failedIdentityAttempts,
        ),
        mensaje: "El apellido no coincide con la reserva.",
      };
}

async function reenviarPin(r: Reservation): Promise<ToolResult> {
  if (!r.checkinDone) {
    return {
      ok: false,
      mensaje:
        "El PIN aún no está liberado porque el check-in online no está completo.",
    };
  }
  await addEvent({
    reservationId: r.id,
    guestName: `${r.guestName} ${r.lastName}`,
    room: r.room,
    type: "pin_resend",
    ok: true,
    detail: `PIN reenviado a ${maskEmail(r.email)}`,
  });
  return {
    ok: true,
    mensaje: `Enlace con el PIN reenviado a ${maskEmail(r.email)}. También está en la sección Mi acceso.`,
  };
}

async function abrirPuertaRemota(
  r: Reservation,
  apellido: string,
): Promise<ToolResult> {
  if (r.failedIdentityAttempts >= MAX_IDENTITY_ATTEMPTS) {
    return { ok: false, bloqueado: true, mensaje: "Verificación bloqueada. Escala a una persona." };
  }
  if (!lastNameMatches(r, apellido)) {
    return {
      ok: false,
      mensaje: "Identidad no verificada. Usa antes verificar_identidad con el apellido.",
    };
  }
  const s = getAccessState(r);
  const guest = `${r.guestName} ${r.lastName}`;
  if (!s.canOpenRemotely) {
    await addEvent({
      reservationId: r.id,
      guestName: guest,
      room: r.room,
      type: "remote_open",
      ok: false,
      detail: s.remoteOpenBlockedReason ?? "Apertura denegada",
    });
    return { ok: false, mensaje: s.remoteOpenBlockedReason };
  }

  r.doorOpenedRemotely = true;
  await saveReservation(r);
  await addEvent({
    reservationId: r.id,
    guestName: guest,
    room: r.room,
    type: "remote_open",
    ok: true,
    detail:
      s.lockStatus === "low_battery"
        ? "Apertura remota (cerradura con batería baja)"
        : "Apertura remota tras verificar identidad",
  });
  if (s.lockStatus === "low_battery") {
    await addIncident({
      reservationId: r.id,
      guestName: guest,
      room: r.room,
      category: "bateria_baja",
      summary: `La cerradura de la habitación ${r.room} reporta batería baja. Sustituir pilas.`,
      status: "escalada",
      urgency: "media",
      source: "sistema",
    });
  }
  return {
    ok: true,
    mensaje:
      "Puerta abierta en remoto. Avisa al huésped de que empuje la puerta ahora.",
    aviso_mantenimiento_creado: s.lockStatus === "low_battery",
  };
}

async function registrarIncidencia(
  r: Reservation,
  p: Params,
  escalated: boolean,
): Promise<ToolResult> {
  const resolved = escalated ? false : p.resuelta === undefined ? true : bool(p.resuelta);
  const inc = await addIncident({
    reservationId: r.id,
    guestName: `${r.guestName} ${r.lastName}`,
    room: r.room,
    category: category(p.categoria),
    summary: str(p.resumen, "Sin resumen"),
    status: resolved ? "resuelta_por_agente" : "escalada",
    urgency: urgency(p.urgencia),
    source: "voz",
    language: str(p.idioma) || r.language,
  });
  return {
    ok: true,
    incidencia: inc.id,
    mensaje: resolved
      ? "Incidencia registrada como resuelta."
      : "Aviso enviado al equipo del hotel con el resumen. Dile al huésped que una persona le contactará.",
  };
}

async function guardarFeedback(r: Reservation, p: Params): Promise<ToolResult> {
  const raw = Number(p.puntuacion);
  const score = Number.isFinite(raw) ? Math.min(10, Math.max(1, Math.round(raw))) : 7;
  const sentiment = score >= 9 ? "positivo" : score >= 7 ? "neutro" : "negativo";
  const invite = score >= 9 && p.acepta_resena_publica !== false;
  await addFeedback({
    reservationId: r.id,
    guestName: `${r.guestName} ${r.lastName}`,
    score,
    comment: str(p.comentario),
    sentiment,
    publicReviewInvited: invite,
    language: str(p.idioma) || r.language,
  });
  if (sentiment === "negativo") {
    await addIncident({
      reservationId: r.id,
      guestName: `${r.guestName} ${r.lastName}`,
      room: r.room,
      category: "otro",
      summary: `Feedback negativo en el check-out (${score}/10): ${str(p.comentario, "sin comentario")}`,
      status: "escalada",
      urgency: "media",
      source: "voz",
      language: str(p.idioma) || r.language,
    });
  }
  return {
    ok: true,
    sentimiento: sentiment,
    siguiente_paso: invite
      ? "Agradece y dile que en pantalla tiene un botón para dejar su reseña en Google."
      : sentiment === "negativo"
        ? "Pide disculpas y dile que el equipo revisará su comentario. No pidas reseña pública."
        : "Agradece su opinión y despídete.",
  };
}
