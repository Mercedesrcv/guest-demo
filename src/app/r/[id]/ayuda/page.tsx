"use client";

import { useState } from "react";
import { useGuest } from "@/components/GuestProvider";
import { VoiceAgent, type ToolCallLog } from "@/components/VoiceAgent";

const SUGGESTIONS: Record<string, string> = {
  pin_mal_introducido: "“No me abre la puerta, he metido el código y no pasa nada.”",
  antes_de_hora: "“Je suis arrivé mais je ne peux pas entrer.” (o “Ya estoy aquí, ¿puedo entrar ya?”)",
  checkin_pendiente: "“Ich komme nicht in mein Zimmer.”",
  pin_caducado: "“Se me ha quedado la maleta dentro y mi código ya no funciona.”",
  bateria_baja: "“La cerradura no responde.” Si te piden el apellido, di tu apellido.",
};

export default function HelpPage() {
  const { r, refresh } = useGuest();
  const [doorOpen, setDoorOpen] = useState(false);

  if (!r) return <p className="text-slate-500">Cargando…</p>;

  function onToolCall(log: ToolCallLog) {
    if (log.name === "abrir_puerta_remota" && log.result.ok === true) setDoorOpen(true);
    void refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ayuda con la puerta</h1>
        <p className="mt-1 text-slate-600">
          Habla con el asistente en tu idioma. Puede guiarte, reenviarte el acceso, abrir la puerta en remoto si verifica tu identidad, o avisar a una persona del hotel con todo el contexto.
        </p>
      </div>

      <div
        className={`flex items-center justify-between rounded-xl border p-4 ${
          doorOpen ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white"
        }`}
        aria-live="polite"
      >
        <span className="font-medium">
          {doorOpen ? "🔓 Puerta abierta: empuja ahora" : `🔒 Puerta de la habitación ${r.room} cerrada`}
        </span>
        <span className="text-xs text-slate-500">Cerradura simulada</span>
      </div>

      <VoiceAgent reservation={r} mode="puerta" onToolCall={onToolCall} />

      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <strong className="text-slate-800">Escenario: {r.scenarioTitle}.</strong>{" "}
        {SUGGESTIONS[r.access.probableCause] ? `Prueba a decir ${SUGGESTIONS[r.access.probableCause]}` : r.scenarioDescription}
      </div>
    </div>
  );
}
