"use client";

import Link from "next/link";
import { useGuest } from "@/components/GuestProvider";
import { SpeakButton } from "@/components/SpeakButton";
import type { Lang } from "@/lib/types";

const WELCOME: Record<Lang, (n: string, room: string) => string> = {
  es: (n, room) => `Bienvenido al Hotel Mirador, ${n}. Tu habitación es la ${room}. Cuando quieras, consulta tu código de acceso en la sección Mi acceso. Si algo falla con la puerta, puedes hablar conmigo.`,
  en: (n, room) => `Welcome to Hotel Mirador, ${n}. Your room is ${room}. Check your access code in the My access section. If anything goes wrong with the door, just talk to me.`,
  fr: (n, room) => `Bienvenue à l'Hôtel Mirador, ${n}. Votre chambre est la ${room}. Consultez votre code d'accès dans la section Mon accès. Si la porte pose problème, parlez-moi.`,
  de: (n, room) => `Willkommen im Hotel Mirador, ${n}. Ihr Zimmer ist die ${room}. Ihren Zugangscode finden Sie unter Mein Zugang. Wenn es ein Problem mit der Tür gibt, sprechen Sie einfach mit mir.`,
  it: (n, room) => `Benvenuto all'Hotel Mirador, ${n}. La tua camera è la ${room}. Trova il tuo codice di accesso nella sezione Il mio accesso. Se la porta dà problemi, parla con me.`,
};

const LANG_NAME: Record<Lang, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

export default function GuestHome() {
  const { id, r } = useGuest();
  if (!r) return <p className="text-slate-500">Cargando tu reserva…</p>;

  const steps = [
    { done: true, label: "Has abierto tu enlace personal", href: "" },
    { done: r.checkinDone, label: "Check-in online (documento, contrato, pago)", href: "/checkin" },
    { done: r.access.pinReleased && r.access.windowStatus === "active", label: "Código PIN disponible en tu horario de acceso", href: "/acceso" },
    { done: r.checkoutDone, label: "Check-out online", href: "/checkout" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 p-8 text-white shadow">
        <p className="text-sm text-teal-200">Reserva {r.checkInDate} → {r.checkOutDate}</p>
        <h1 className="mt-1 text-3xl font-semibold">
          Hola, {r.guestName}
        </h1>
        <p className="mt-2 max-w-xl text-teal-100">
          {r.roomType} · Habitación {r.room} (planta {r.floor}). Todo tu viaje desde el móvil, sin pasar por recepción.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SpeakButton
            lang={r.language}
            label={`Escuchar bienvenida (${LANG_NAME[r.language]})`}
            text={WELCOME[r.language](r.guestName, r.room)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tu progreso</h2>
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={`/r/${id}${s.href}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-600"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    s.done ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.done ? "✓" : "·"}
                </span>
                <span className={s.done ? "text-slate-500" : "font-medium"}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        <strong className="text-slate-800">¿Algo falla con la puerta?</strong> Ve a{" "}
        <Link href={`/r/${id}/ayuda`} className="font-medium text-teal-800 underline">
          Ayuda con la puerta
        </Link>{" "}
        y habla con el asistente de voz.
        <p className="mt-2 text-slate-500">
          <em>Escenario de esta demo:</em> {r.scenarioTitle}. {r.scenarioDescription}
        </p>
      </section>
    </div>
  );
}
