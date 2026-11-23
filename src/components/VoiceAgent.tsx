"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type { GuestReservation } from "./GuestProvider";
import type { Lang } from "@/lib/types";

export type AgentMode = "puerta" | "checkout";

export type ToolCallLog = {
  id: number;
  name: string;
  params: Record<string, unknown>;
  result: Record<string, unknown>;
};

const FIRST_MESSAGE: Record<AgentMode, Record<Lang, (n: string) => string>> = {
  puerta: {
    es: (n) => `Hola ${n}, soy el asistente de acceso del Hotel Mirador. Cuéntame qué pasa con tu puerta y te ayudo ahora mismo.`,
    en: (n) => `Hi ${n}, I'm the Hotel Mirador access assistant. Tell me what's happening with your door and I'll help right away.`,
    fr: (n) => `Bonjour ${n}, je suis l'assistant d'accès de l'Hôtel Mirador. Dites-moi ce qui se passe avec votre porte, je vous aide tout de suite.`,
    de: (n) => `Hallo ${n}, ich bin der Zugangsassistent des Hotel Mirador. Erzählen Sie mir, was mit Ihrer Tür los ist, ich helfe sofort.`,
    it: (n) => `Ciao ${n}, sono l'assistente di accesso dell'Hotel Mirador. Dimmi cosa succede con la tua porta e ti aiuto subito.`,
  },
  checkout: {
    es: (n) => `Hola ${n}, gracias por alojarte con nosotros. ¿Me cuentas en un minuto qué tal ha ido tu estancia?`,
    en: (n) => `Hi ${n}, thanks for staying with us. Can you tell me in a minute how your stay went?`,
    fr: (n) => `Bonjour ${n}, merci de votre séjour. Pouvez-vous me dire en une minute comment il s'est passé ?`,
    de: (n) => `Hallo ${n}, danke für Ihren Aufenthalt. Erzählen Sie mir kurz, wie er Ihnen gefallen hat?`,
    it: (n) => `Ciao ${n}, grazie per il soggiorno. Mi racconti in un minuto com'è andata?`,
  },
};

export function VoiceAgent(props: {
  reservation: GuestReservation;
  mode: AgentMode;
  onToolCall?: (log: ToolCallLog) => void;
}) {
  return (
    <ConversationProvider>
      <AgentPanel {...props} />
    </ConversationProvider>
  );
}

function AgentPanel({
  reservation,
  mode,
  onToolCall,
}: {
  reservation: GuestReservation;
  mode: AgentMode;
  onToolCall?: (log: ToolCallLog) => void;
}) {
  const [transcript, setTranscript] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [toolLog, setToolLog] = useState<ToolCallLog[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const logId = useRef(0);

  const callTool = useCallback(
    (name: string) => async (params: Record<string, unknown>) => {
      const res = await fetch(`/api/tools/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation.id, params }),
      });
      const result = (await res.json()) as Record<string, unknown>;
      const log: ToolCallLog = { id: ++logId.current, name, params, result };
      setToolLog((l) => [log, ...l]);
      onToolCall?.(log);
      return JSON.stringify(result);
    },
    [reservation.id, onToolCall],
  );

  const clientTools = useMemo(() => {
    const names =
      mode === "puerta"
        ? [
            "consultar_estado_acceso",
            "verificar_identidad",
            "reenviar_pin",
            "abrir_puerta_remota",
            "registrar_incidencia",
            "escalar_a_humano",
          ]
        : ["guardar_feedback", "registrar_incidencia", "escalar_a_humano"];
    return Object.fromEntries(names.map((n) => [n, callTool(n)]));
  }, [mode, callTool]);

  const conversation = useConversation({
    onMessage: (m) => {
      if (!m.message) return;
      setTranscript((t) => [
        ...t,
        { role: m.role === "user" ? "user" : "agent", text: m.message },
      ]);
    },
    onError: (message) => setSetupError(String(message)),
  });

  const { status, isSpeaking } = conversation;
  const connected = status === "connected";

  async function start() {
    setSetupError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/agent/session", { cache: "no-store" });
      const data = (await res.json()) as { token?: string; message?: string };
      if (!res.ok || !data.token) {
        setSetupError(
          data.message ?? "No se pudo crear la sesión con ElevenLabs.",
        );
        return;
      }
      setTranscript([]);
      conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
        clientTools,
        dynamicVariables: {
          modo: mode === "puerta" ? "soporte_puerta" : "checkout",
          nombre_huesped: reservation.guestName,
          hotel: reservation.hotel,
          habitacion: reservation.room,
          planta: reservation.floor,
          idioma_reserva: reservation.language,
          fecha_entrada: reservation.checkInDate,
          fecha_salida: reservation.checkOutDate,
          primer_mensaje: FIRST_MESSAGE[mode][reservation.language](
            reservation.guestName,
          ),
        },
      });
    } finally {
      setStarting(false);
    }
  }

  const orbState = !connected
    ? "idle"
    : isSpeaking
      ? "speaking"
      : "listening";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div
            aria-hidden
            className={`h-28 w-28 rounded-full transition-all duration-300 ${
              orbState === "speaking"
                ? "scale-110 animate-pulse bg-teal-500 shadow-[0_0_60px_rgba(20,184,166,0.55)]"
                : orbState === "listening"
                  ? "scale-100 bg-teal-300 shadow-[0_0_30px_rgba(20,184,166,0.3)]"
                  : "bg-slate-200"
            }`}
          />
          <p className="min-h-6 text-sm text-slate-600" aria-live="polite">
            {status === "connecting" || starting
              ? "Conectando…"
              : connected
                ? isSpeaking
                  ? "Hablando…"
                  : "Te escucho"
                : "Pulsa para hablar con el asistente"}
          </p>
          {!connected ? (
            <button
              type="button"
              onClick={start}
              disabled={starting || status === "connecting"}
              className="rounded-full bg-teal-700 px-6 py-3 font-medium text-white shadow transition hover:bg-teal-800 disabled:opacity-60"
            >
              🎙 {mode === "puerta" ? "Ayuda con mi puerta" : "Hablar sobre mi estancia"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => conversation.endSession()}
              className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Terminar conversación
            </button>
          )}
          {setupError && (
            <p role="alert" className="max-w-md rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {setupError}
            </p>
          )}
        </div>

        <div className="mt-2 max-h-72 space-y-2 overflow-y-auto border-t border-slate-100 pt-4">
          {transcript.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              La transcripción aparecerá aquí.
            </p>
          ) : (
            transcript.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "agent"
                    ? "bg-teal-50 text-teal-950"
                    : "ml-auto bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </div>
            ))
          )}
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Acciones del agente
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Cada herramienta que el agente usa queda registrada aquí.
        </p>
        <ul className="space-y-2">
          {toolLog.length === 0 && (
            <li className="text-xs text-slate-400">Aún no ha usado ninguna.</li>
          )}
          {toolLog.map((l) => (
            <li key={l.id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
              <div className="flex items-center justify-between">
                <code className="font-semibold text-teal-800">{l.name}</code>
                <span className={l.result.ok === false ? "text-rose-600" : "text-emerald-600"}>
                  {l.result.ok === false ? "denegado" : "ok"}
                </span>
              </div>
              {typeof l.result.mensaje === "string" && (
                <p className="mt-1 text-slate-600">{l.result.mensaje}</p>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
