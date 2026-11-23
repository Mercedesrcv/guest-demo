import Link from "next/link";

const metrics = [
  ["Resolución sin humano", "% de incidencias de puerta cerradas por el agente sin escalar"],
  ["Tiempo hasta entrar", "Desde que el huésped pulsa “Ayuda” hasta que abre la puerta"],
  ["Escaladas por causa", "Qué causas dominan: guían cambios de producto, no de atención"],
  ["Idiomas usados", "Demuestra el valor de la voz multilingüe"],
  ["Nota media y reseñas derivadas", "Check-out por voz: nota ≥ 9 invita a reseña pública; el resto es feedback interno"],
];

const risks = [
  ["Apertura remota fraudulenta", "Doble factor: enlace único de reserva + apellido, 3 intentos máximos, solo con check-in completo y dentro del horario. El PIN nunca se dice en voz alta."],
  ["Alucinaciones del agente", "Las reglas viven en el servidor (herramientas), no en el prompt. El agente solo narra el resultado."],
  ["Latencia y ruido", "WebRTC de ElevenLabs; el agente confirma datos clave y ofrece alternativa en pantalla."],
  ["Privacidad", "No se guarda audio en esta demo; el micrófono solo se activa al pulsar. En producción: DPA y retención mínima."],
  ["Coste a escala", "Voz solo cuando hace falta (incidencia o feedback), TTS para mensajes fijos y límites de duración por conversación."],
];

const roadmap = [
  "Integración con el PMS y la cerradura reales (BLE / PIN).",
  "Escaneo real de documentos y pasarela de pago.",
  "Herramientas de servidor (webhooks) en lugar de herramientas de cliente.",
  "Evaluaciones automáticas de conversaciones y alertas al staff por WhatsApp.",
  "Upselling por voz (late check-out, desayuno) medido como ingreso incremental.",
];

export default function ProjectPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-12">
      <div>
        <Link href="/" className="text-sm text-teal-800 underline">← Inicio</Link>
        <h1 className="mt-2 text-3xl font-semibold">Visión de producto</h1>
        <p className="mt-2 text-slate-600">
          Por qué existe este prototipo, qué hipótesis prueba y cómo lo mediría.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Problema</h2>
        <p className="text-slate-700">
          En un hotel sin recepción, el momento más crítico es cuando el huésped llega y la puerta no abre: es de noche, hay maletas, a menudo otro idioma, y no hay nadie. Cada incidencia acaba en una llamada o en una mala reseña.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Hipótesis</h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          <li>Un agente de voz que diagnostica, guía y actúa resuelve la mayoría de incidencias de acceso sin intervención humana.</li>
          <li>Cuando no puede, escalar con resumen y causa probable reduce el tiempo de resolución del staff.</li>
          <li>Un check-out conversacional capta más feedback y dirige a reseña pública solo a quien está satisfecho.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Métricas</h2>
        <dl className="space-y-2">
          {metrics.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-200 bg-white p-3">
              <dt className="font-medium">{k}</dt>
              <dd className="text-sm text-slate-600">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Riesgos y mitigación</h2>
        <dl className="space-y-2">
          {risks.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-200 bg-white p-3">
              <dt className="font-medium">{k}</dt>
              <dd className="text-sm text-slate-600">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cómo usa ElevenLabs</h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          <li><strong>Agents (conversacional, WebRTC):</strong> soporte de la puerta y feedback de check-out, con herramientas que ejecutan acciones.</li>
          <li><strong>Text to Speech:</strong> bienvenida y despedida habladas en el idioma del huésped.</li>
          <li><strong>Multilingüe:</strong> la misma experiencia en español, inglés, francés, alemán e italiano.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Qué haría después</h2>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          {roadmap.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <p className="border-t border-slate-200 pt-4 text-xs text-slate-400">
        Prototipo personal. Hotel, huéspedes, pagos, documentos y cerradura son simulados.
      </p>
    </main>
  );
}
