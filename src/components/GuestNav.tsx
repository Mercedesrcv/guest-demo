"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGuest } from "./GuestProvider";

const TABS = [
  { href: "", label: "Mi estancia" },
  { href: "/checkin", label: "Check-in" },
  { href: "/acceso", label: "Mi acceso" },
  { href: "/ayuda", label: "Ayuda con la puerta" },
  { href: "/checkout", label: "Check-out" },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

export function GuestNav() {
  const { id, r, error } = useGuest();
  const pathname = usePathname();
  const base = `/r/${id}`;

  if (error) {
    return (
      <p className="p-6 text-center text-rose-700">
        Este enlace no es válido.{" "}
        <Link href="/" className="underline">
          Volver al inicio
        </Link>
      </p>
    );
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-semibold text-teal-900">
          🏨 {r?.hotel ?? "Hotel Mirador"}
        </Link>
        {r && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>
              {r.guestName} {r.lastName} · Hab. {r.room}
            </span>
            <span
              title="Hora simulada para que cada escenario de la demo sea reproducible"
              className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-900"
            >
              ⏱ Hora demo: {fmt(r.demoNow)}
            </span>
          </div>
        )}
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4" aria-label="Secciones">
        {TABS.map((t) => {
          const href = base + t.href;
          const active = pathname === href;
          return (
            <Link
              key={t.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-teal-700 text-teal-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
