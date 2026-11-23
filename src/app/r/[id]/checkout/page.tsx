"use client";

import { useState } from "react";
import { useGuest } from "@/components/GuestProvider";
import { SpeakButton } from "@/components/SpeakButton";
import { VoiceAgent, type ToolCallLog } from "@/components/VoiceAgent";
import { balanceDue, eur, staySubtotal } from "@/lib/pricing";
import type { Lang } from "@/lib/types";

const BYE: Record<Lang, (n: string) => string> = {
  es: (n) => `Gracias por tu estancia, ${n}. Tu check-out está completado. ¡Buen viaje y esperamos verte pronto!`,
  en: (n) => `Thank you for staying with us, ${n}. Your check-out is complete. Safe travels, and we hope to see you again soon!`,
  fr: (n) => `Merci pour votre séjour, ${n}. Votre check-out est terminé. Bon voyage et à bientôt !`,
  de: (n) => `Danke für Ihren Aufenthalt, ${n}. Ihr Check-out ist abgeschlossen. Gute Reise und bis bald!`,
  it: (n) => `Grazie per il soggiorno, ${n}. Il tuo check-out è completato. Buon viaggio e a presto!`,
};

export default function CheckoutPage() {
  const { r, act } = useGuest();
  const [paying, setPaying] = useState(false);
  const [review, setReview] = useState<"positivo" | "neutro" | "negativo" | null>(null);

  if (!r) return <p className="text-slate-500">Cargando…</p>;

  const due = balanceDue(r);
  const done = r.checkoutDone;

  async function pay() {
    setPaying(true);
    await new Promise((res) => setTimeout(res, 900)); // simulated gateway
    await act({ action: "complete_checkout" });
    setPaying(false);
  }

  function onToolCall(log: ToolCallLog) {
    if (log.name === "guardar_feedback" && typeof log.result.sentimiento === "string") {
      setReview(log.result.sentimiento as "positivo" | "neutro" | "negativo");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Check-out online</h1>

      {!done ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Pagos pendientes</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Estancia ({r.nights} noche/s)</dt><dd>{eur(staySubtotal(r))}</dd></div>
            <div className="flex justify-between"><dt>Tasa turística</dt><dd>{eur(r.touristTaxDue)}</dd></div>
            <div className="flex justify-between"><dt>Extras</dt><dd>{eur(r.extrasDue)}</dd></div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <dt>{due > 0 ? "A pagar ahora" : "Pendiente"}</dt>
              <dd>{eur(due)}</dd>
            </div>
          </dl>
          {due === 0 && <p className="text-sm text-emerald-700">No tienes nada pendiente: ya pagaste en el check-in.</p>}
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Pasarela simulada: no se procesa ninguna tarjeta real.</p>
          <button
            onClick={pay}
            disabled={paying}
            className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white disabled:opacity-50"
          >
            {paying ? "Procesando pago…" : due > 0 ? `Pagar ${eur(due)} y hacer check-out` : "Confirmar check-out"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-semibold text-emerald-900">Check-out completado ✓</h2>
            <p className="mt-1 text-sm text-emerald-800">
              El PMS ha recibido la salida de la habitación {r.room}: estado <code>checked-out</code>.
            </p>
            <div className="mt-3">
              <SpeakButton lang={r.language} label="Escuchar despedida" text={BYE[r.language](r.guestName)} />
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">¿Nos cuentas cómo ha ido? (1 minuto, por voz)</h2>
            <VoiceAgent reservation={r} mode="checkout" onToolCall={onToolCall} />
          </div>

          {review === "positivo" && (
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl bg-amber-100 p-4 text-center font-medium text-amber-900"
            >
              ⭐ ¡Gracias! Deja tu reseña pública en Google (demo)
            </a>
          )}
          {review === "negativo" && (
            <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
              Tu comentario se ha enviado al equipo del hotel para que pueda mejorar. No se publica.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
