import Link from "next/link";
import { SEED_RESERVATIONS } from "@/lib/seed";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-4 py-12">
      <section className="space-y-4">
        <p className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-900">
          Demo de producto · ElevenLabs + Next.js + Vercel
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-900">
          Un recepcionista de voz que no duerme, habla varios idiomas y convierte cada conversación en datos.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Experiencia de huésped para hoteles sin recepción: check-in online, acceso con PIN, soporte por voz cuando la puerta falla y check-out. Cada escenario de abajo simula el enlace único que recibiría el huésped por email.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/panel" className="rounded-lg bg-teal-700 px-5 py-2.5 font-medium text-white hover:bg-teal-800">
            Ver panel del hotel
          </Link>
          <Link href="/proyecto" className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-white">
            Sobre este proyecto (visión de producto)
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold">Elige un escenario</h2>
        <p className="mb-4 text-sm text-slate-500">
          Cada reserva demo tiene su propia situación y su propia hora simulada, para que la demo sea reproducible.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEED_RESERVATIONS.map((r) => (
            <Link
              key={r.id}
              href={`/r/${r.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600 hover:shadow"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{r.guestName} {r.lastName}</span>
                <span className="uppercase">{r.language}</span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-teal-800">{r.scenarioTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{r.scenarioDescription}</p>
              <p className="mt-3 text-xs font-medium text-teal-800">Abrir enlace del huésped →</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-6 text-xs text-slate-400">
        Proyecto personal de demostración. Hotel y huéspedes ficticios; pagos, documentos y cerradura simulados. No afiliado a ninguna empresa.
      </footer>
    </main>
  );
}
