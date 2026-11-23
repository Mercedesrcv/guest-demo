"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CATEGORY_LABEL } from "@/lib/access";
import type { DoorEvent, Feedback, Incident, Reservation } from "@/lib/types";

type PanelData = {
  storage: "supabase" | "memory";
  voiceConfigured: boolean;
  reservations: Omit<Reservation, "pin">[];
  incidents: Incident[];
  feedback: Feedback[];
  events: DoorEvent[];
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function PanelPage() {
  const [d, setD] = useState<PanelData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/panel", { cache: "no-store" });
    if (res.ok) setD(await res.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  async function reset() {
    await fetch("/api/reset", { method: "POST" });
    await load();
  }

  if (!d) return <p className="p-8 text-slate-500">Cargando panel…</p>;

  const voice = d.incidents.filter((i) => i.source === "voz");
  const resolved = voice.filter((i) => i.status === "resuelta_por_agente").length;
  const escalated = voice.filter((i) => i.status === "escalada").length;
  const rate = voice.length ? Math.round((resolved / voice.length) * 100) : null;
  const avg = d.feedback.length
    ? (d.feedback.reduce((s, f) => s + f.score, 0) / d.feedback.length).toFixed(1)
    : "–";
  const invited = d.feedback.filter((f) => f.publicReviewInvited).length;
  const causes = Object.entries(
    d.incidents.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-teal-800 underline">← Inicio</Link>
          <h1 className="text-2xl font-semibold">Panel del hotel · Hotel Mirador</h1>
          <p className="text-sm text-slate-500">
            Se actualiza solo cada 4 s · Almacenamiento: {d.storage === "supabase" ? "Supabase" : "memoria (demo local)"} · Voz ElevenLabs: {d.voiceConfigured ? "configurada" : "sin configurar"}
          </p>
        </div>
        <button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Reiniciar demo
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Resueltas sin humano" value={rate === null ? "–" : `${rate}%`} hint={`${resolved} de ${voice.length} por voz`} />
        <Kpi label="Escaladas al staff" value={String(escalated)} hint="con resumen y contexto" />
        <Kpi label="Nota media check-out" value={avg} hint={`${d.feedback.length} opiniones`} />
        <Kpi label="Invitaciones a reseña pública" value={String(invited)} hint="solo con nota ≥ 9" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold">Incidencias</h2>
          {d.incidents.length === 0 ? (
            <Empty text="Aún no hay incidencias. Abre una reserva demo y habla con el asistente de la puerta." />
          ) : (
            <ul className="space-y-2">
              {d.incidents.map((i) => (
                <li key={i.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${i.status === "escalada" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {i.status === "escalada" ? "Escalada" : "Resuelta por el agente"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{CATEGORY_LABEL[i.category]}</span>
                    <span className="text-slate-400">{i.source === "sistema" ? "Sistema" : "Voz"} · urgencia {i.urgency} · {time(i.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm">{i.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">{i.guestName} · Hab. {i.room}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Causas más frecuentes</h2>
          {causes.length === 0 ? (
            <Empty text="Sin datos todavía." />
          ) : (
            <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              {causes.map(([c, n]) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="w-40 truncate">{CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]}</span>
                  <span className="h-2 rounded bg-teal-600" style={{ width: `${(n / causes[0][1]) * 100}px` }} />
                  <span className="text-slate-500">{n}</span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="pt-2 font-semibold">Feedback de check-out</h2>
          {d.feedback.length === 0 ? (
            <Empty text="Sin opiniones todavía." />
          ) : (
            <ul className="space-y-2">
              {d.feedback.map((f) => (
                <li key={f.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex justify-between">
                    <strong>{f.score}/10</strong>
                    <span className={`text-xs ${f.sentiment === "positivo" ? "text-emerald-700" : f.sentiment === "negativo" ? "text-rose-700" : "text-slate-500"}`}>{f.sentiment}</span>
                  </div>
                  <p className="text-slate-600">{f.comment || "Sin comentario"}</p>
                  <p className="text-xs text-slate-400">{f.guestName}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Reservas y estado en el PMS</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3">Huésped</th><th className="p-3">Hab.</th><th className="p-3">Cerradura</th><th className="p-3">Check-in</th><th className="p-3">PMS</th>
              </tr>
            </thead>
            <tbody>
              {d.reservations.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3"><Link className="text-teal-800 underline" href={`/r/${r.id}`}>{r.guestName} {r.lastName}</Link></td>
                  <td className="p-3">{r.room}</td>
                  <td className="p-3">{r.lockStatus}</td>
                  <td className="p-3">{r.checkinDone ? "✓" : "pendiente"}</td>
                  <td className="p-3">{r.pmsStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Registro de accesos y eventos</h2>
        {d.events.length === 0 ? (
          <Empty text="Sin eventos." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
            {d.events.slice(0, 15).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 p-3">
                <span className={e.ok ? "text-emerald-600" : "text-rose-600"}>{e.ok ? "●" : "✕"}</span>
                <code className="text-xs text-slate-500">{e.type}</code>
                <span>{e.detail}</span>
                <span className="ml-auto text-xs text-slate-400">Hab. {e.room} · {time(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-teal-900">{value}</p>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">{text}</p>;
}
