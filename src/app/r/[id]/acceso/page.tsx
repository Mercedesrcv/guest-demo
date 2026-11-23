"use client";

import Link from "next/link";
import { useGuest } from "@/components/GuestProvider";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });

export default function AccessPage() {
  const { id, r } = useGuest();
  if (!r) return <p className="text-slate-500">Cargando…</p>;
  const a = r.access;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-semibold">Mi acceso · Habitación {r.room}</h1>

      {r.pin ? (
        <div className="rounded-2xl bg-slate-900 p-8 text-center text-white shadow">
          <p className="text-sm text-slate-300">Tu código PIN</p>
          <p className="mt-2 font-mono text-5xl tracking-[0.3em]" aria-label={`PIN ${r.pin.split("").join(" ")}`}>
            {r.pin}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Válido del {fmt(r.pinValidFrom)} al {fmt(r.pinValidTo)}
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Introduce el PIN en el teclado de la puerta de la planta {r.floor} y pulsa #.
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Tu PIN todavía no está disponible</h2>
          {a.probableCause === "checkin_pendiente" && (
            <p className="text-sm text-slate-600">
              Completa antes el check-in online.{" "}
              <Link className="font-medium text-teal-800 underline" href={`/r/${id}/checkin`}>Ir al check-in</Link>
            </p>
          )}
          {a.windowStatus === "before" && a.checkinDone && (
            <p className="text-sm text-slate-600">
              Tu acceso se activa el {fmt(r.pinValidFrom)} (faltan {Math.floor((a.minutesToStart ?? 0) / 60)} h {(a.minutesToStart ?? 0) % 60} min).
            </p>
          )}
          {a.windowStatus === "expired" && (
            <p className="text-sm text-slate-600">
              Tu estancia terminó el {fmt(r.pinValidTo)} y el código ha caducado.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Cerradura</span>
          <span className="font-medium">
            {r.lockStatus === "online" ? "🟢 En línea" : r.lockStatus === "low_battery" ? "🟠 Batería baja" : "🔴 Sin conexión"}
          </span>
        </div>
        <div className="mt-2 flex justify-between"><span className="text-slate-500">Estado en el PMS</span>
          <span className="font-medium">{r.pmsStatus}</span>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500">
        ¿No abre?{" "}
        <Link className="font-medium text-teal-800 underline" href={`/r/${id}/ayuda`}>Habla con el asistente de voz</Link>
      </p>
    </div>
  );
}
