import type { IncidentCategory, Reservation } from "./types";

export type AccessState = {
  checkinDone: boolean;
  windowStatus: "before" | "active" | "expired";
  minutesToStart: number | null;
  minutesSinceExpiry: number | null;
  pinReleased: boolean;
  lockStatus: Reservation["lockStatus"];
  probableCause: IncidentCategory;
  canOpenRemotely: boolean;
  remoteOpenBlockedReason: string | null;
};

const minutesBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function lastNameMatches(r: Reservation, input: string): boolean {
  return normalizeName(input).length > 0 && normalizeName(input) === normalizeName(r.lastName);
}

export function getAccessState(r: Reservation): AccessState {
  const toStart = minutesBetween(r.demoNow, r.pinValidFrom);
  const sinceEnd = minutesBetween(r.pinValidTo, r.demoNow);
  const windowStatus: AccessState["windowStatus"] =
    toStart > 0 ? "before" : sinceEnd > 0 ? "expired" : "active";

  const pinReleased = r.checkinDone;

  let probableCause: IncidentCategory = "pin_mal_introducido";
  if (!r.checkinDone) probableCause = "checkin_pendiente";
  else if (windowStatus === "before") probableCause = "antes_de_hora";
  else if (windowStatus === "expired") probableCause = "pin_caducado";
  else if (r.lockStatus === "offline") probableCause = "cerradura_sin_conexion";
  else if (r.lockStatus === "low_battery") probableCause = "bateria_baja";

  let remoteOpenBlockedReason: string | null = null;
  if (!r.checkinDone) remoteOpenBlockedReason = "El check-in online no está completado.";
  else if (windowStatus === "before")
    remoteOpenBlockedReason = "Todavía no ha empezado el horario de acceso de la reserva.";
  else if (windowStatus === "expired")
    remoteOpenBlockedReason = "La estancia ha terminado y el acceso ha caducado.";
  else if (r.lockStatus === "offline")
    remoteOpenBlockedReason = "La cerradura no tiene conexión y no puede abrirse en remoto.";

  return {
    checkinDone: r.checkinDone,
    windowStatus,
    minutesToStart: windowStatus === "before" ? toStart : null,
    minutesSinceExpiry: windowStatus === "expired" ? sinceEnd : null,
    pinReleased,
    lockStatus: r.lockStatus,
    probableCause,
    canOpenRemotely: remoteOpenBlockedReason === null,
    remoteOpenBlockedReason,
  };
}

export const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  pin_mal_introducido: "PIN mal introducido",
  puerta_equivocada: "Puerta equivocada",
  antes_de_hora: "Llega antes de hora",
  checkin_pendiente: "Check-in pendiente",
  pin_caducado: "PIN caducado",
  bateria_baja: "Batería baja",
  cerradura_sin_conexion: "Cerradura sin conexión",
  late_checkout: "Late check-out",
  early_checkin: "Early check-in",
  identidad_no_verificada: "Identidad no verificada",
  otro: "Otro",
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as IncidentCategory[];

export function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}***@${d}`;
}
