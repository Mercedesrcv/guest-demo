"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useGuest } from "@/components/GuestProvider";
import { EXTRAS, EXTRA_PRICE, eur, staySubtotal } from "@/lib/pricing";

const STEPS = ["Documento", "Contrato", "Habitación y extras", "Pago", "Listo"];

function SignaturePad({ onChange }: { onChange: (signed: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const b = c.getBoundingClientRect();
    return {
      x: ((e.clientX - b.left) / b.width) * c.width,
      y: ((e.clientY - b.top) / b.height) * c.height,
    };
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={600}
        height={160}
        aria-label="Zona de firma"
        className="w-full touch-none rounded-lg border border-slate-300 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#0f172a";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          onChange(true);
        }}
        onPointerUp={() => (drawing.current = false)}
      />
      <button
        type="button"
        className="mt-1 text-xs text-slate-500 underline"
        onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          onChange(false);
        }}
      >
        Borrar firma
      </button>
    </div>
  );
}

export default function CheckinPage() {
  const { id, r, act } = useGuest();
  const [step, setStep] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [doc, setDoc] = useState({ nombre: "", apellidos: "", numero: "", nacionalidad: "" });
  const [signed, setSigned] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [room, setRoom] = useState<string>("");
  const [extras, setExtras] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (!r) return <p className="text-slate-500">Cargando…</p>;

  if (r.checkinDone && step < 4) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-xl font-semibold text-emerald-900">Check-in completado ✓</h1>
        <p className="mt-1 text-emerald-800">
          Ya tienes tu acceso listo. Consulta tu código en{" "}
          <Link className="underline" href={`/r/${id}/acceso`}>Mi acceso</Link>.
        </p>
      </div>
    );
  }

  const roomOptions = [
    { id: r.room, label: `Habitación ${r.room} · ${r.roomType} (asignada)`, extra: 0 },
    { id: `${r.room}-vista`, label: "Misma categoría con vistas a la ciudad", extra: 0 },
    { id: "upgrade", label: "Mejora a Junior Suite", extra: 25 },
  ];
  const extrasTotal = extras.length * EXTRA_PRICE;
  const total = staySubtotal(r) + r.touristTaxDue + extrasTotal;

  async function finish(payNow: boolean) {
    setBusy(true);
    await act({
      action: "complete_checkin",
      selectedRoom: room || r!.room,
      extras,
      payNow,
    });
    setBusy(false);
    setStep(4);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Check-in online</h1>
        <ol className="mt-4 flex gap-2 text-xs">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`flex-1 rounded-full px-2 py-1 text-center ${
                i === step ? "bg-teal-700 text-white" : i < step ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Escanea tu documento de identidad</h2>
            <p className="text-sm text-slate-600">
              El formulario se autocompleta con el escáner. En esta demo el escaneo es simulado y no se usa tu cámara ni datos reales.
            </p>
            <button
              type="button"
              onClick={() => {
                setScanned(true);
                setDoc({
                  nombre: r.guestName,
                  apellidos: r.lastName,
                  numero: "DEMO-000000",
                  nacionalidad: r.language.toUpperCase(),
                });
              }}
              className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-900 hover:bg-teal-50"
            >
              📷 Simular escaneo de documento
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["nombre", "apellidos", "numero", "nacionalidad"] as const).map((k) => (
                <label key={k} className="text-sm">
                  <span className="mb-1 block capitalize text-slate-600">{k === "numero" ? "Nº de documento" : k}</span>
                  <input
                    value={doc[k]}
                    onChange={(e) => setDoc({ ...doc, [k]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              ))}
            </div>
            <button
              disabled={!scanned && !(doc.nombre && doc.apellidos && doc.numero)}
              onClick={() => setStep(1)}
              className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Revisa y firma el contrato</h2>
            <div className="h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p>
                Contrato de hospedaje (texto de demostración). El huésped se compromete a respetar las normas del establecimiento, el horario de acceso asignado y las condiciones de cancelación. El código de acceso es personal e intransferible y estará activo únicamente durante las fechas de la reserva. Este texto es ficticio.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              He leído y acepto las condiciones
            </label>
            <SignaturePad onChange={setSigned} />
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="rounded-lg border px-4 py-2">Atrás</button>
              <button
                disabled={!signed || !accepted}
                onClick={() => setStep(2)}
                className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white disabled:opacity-40"
              >
                Firmar y continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Elige habitación y personaliza tu estancia</h2>
            <div className="space-y-2">
              {roomOptions.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                  <span className="flex items-center gap-2">
                    <input type="radio" name="room" checked={(room || r.room) === o.id} onChange={() => setRoom(o.id)} />
                    {o.label}
                  </span>
                  <span className="text-slate-500">{o.extra ? `+${eur(o.extra)}` : "Incluido"}</span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Extras opcionales ({eur(EXTRA_PRICE)} cada uno)</p>
              {EXTRAS.map((x) => (
                <label key={x.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={extras.includes(x.id)}
                    onChange={(e) =>
                      setExtras((cur) => (e.target.checked ? [...cur, x.id] : cur.filter((c) => c !== x.id)))
                    }
                  />
                  {x.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="rounded-lg border px-4 py-2">Atrás</button>
              <button onClick={() => setStep(3)} className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white">Continuar</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Pago de la reserva y tasa turística</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt>{r.nights} noche(s) × {eur(r.nightlyRate)}</dt><dd>{eur(staySubtotal(r))}</dd></div>
              <div className="flex justify-between"><dt>Tasa turística</dt><dd>{eur(r.touristTaxDue)}</dd></div>
              <div className="flex justify-between"><dt>Extras</dt><dd>{eur(extrasTotal)}</dd></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><dt>Total</dt><dd>{eur(total)}</dd></div>
            </dl>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Pasarela simulada: no se introduce ni se procesa ninguna tarjeta real.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setStep(2)} className="rounded-lg border px-4 py-2">Atrás</button>
              <button disabled={busy} onClick={() => finish(true)} className="rounded-lg bg-teal-700 px-5 py-2 font-medium text-white disabled:opacity-50">
                Pagar ahora (simulado)
              </button>
              <button disabled={busy} onClick={() => finish(false)} className="rounded-lg border border-teal-700 px-5 py-2 font-medium text-teal-900 disabled:opacity-50">
                Pagar en el check-out
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-center">
            <p className="text-4xl">✅</p>
            <h2 className="text-xl font-semibold">Check-in completado</h2>
            <p className="text-slate-600">Tu código de acceso se mostrará en Mi acceso dentro de tu horario.</p>
            <Link href={`/r/${id}/acceso`} className="inline-block rounded-lg bg-teal-700 px-5 py-2 font-medium text-white">
              Ver mi acceso
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
