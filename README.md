# Conserje de voz para hoteles sin recepción

Demo de producto: la experiencia digital de un huésped en un hotel sin recepción, con **ElevenLabs** como capa de voz.

- **Check-in online:** documento (escaneo simulado), contrato con firma, habitación y extras, pago simulado.
- **Acceso con PIN:** el PIN solo aparece cuando se cumplen los requisitos del hotel y dentro del horario de la reserva.
- **Ayuda con la puerta (voz):** un agente de ElevenLabs diagnostica, guía, reenvía el acceso, abre en remoto tras verificar identidad o escala al staff con contexto.
- **Check-out online:** pagos pendientes, pasarela simulada, actualización del PMS y feedback por voz.
- **Panel del hotel:** incidencias, causas, resolución sin humano, feedback y registro de eventos en tiempo real.

Más contexto de producto (hipótesis, métricas, riesgos, roadmap) en la página `/proyecto`.

> Hotel, huéspedes, pagos, documentos y cerradura son **ficticios/simulados**. Proyecto personal, no afiliado a ninguna empresa.

## Cómo usa ElevenLabs

| Uso | Dónde |
|---|---|
| **Agents** (conversacional, WebRTC) con herramientas | `src/components/VoiceAgent.tsx`, `src/app/api/agent/session` |
| **Text to Speech** (bienvenida y despedida) | `src/app/api/tts` |
| Herramientas del agente (reglas de negocio en servidor) | `src/lib/tools.ts` |

La API key nunca llega al navegador: el servidor genera un token efímero para la conversación.

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local   # rellena las claves
npm run dev
```

Sin claves la app funciona igualmente: la voz del asistente mostrará un aviso y los mensajes hablados usan la voz del navegador.

### 1. Crear el agente en ElevenLabs
1. Crea una cuenta y un **Agent** nuevo.
2. Pega el prompt de [`agent/system-prompt.md`](agent/system-prompt.md) y pon `{{primer_mensaje}}` como primer mensaje.
3. Crea las 7 herramientas **Client** descritas en [`agent/tools.md`](agent/tools.md) (nombres exactos).
4. Añade idiomas (es, en, fr, de, it) y activa *Language detection*.
5. Copia el **Agent ID** y una **API key** a `.env.local`:
   `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID`.

### 2. Persistencia (Supabase, recomendado en Vercel)
En local los datos viven en memoria. En Vercel las instancias no comparten memoria, así que el panel necesita base de datos:
1. Crea un proyecto de Supabase **nuevo** y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
2. Añade `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).

## Despliegue
1. Sube el repo a GitHub.
2. Importa el repo en Vercel.
3. Añade las variables de `.env.example` en *Project Settings → Environment Variables*.

## Guion de demo (2 minutos)
1. **Ana** (PIN no funciona): el agente consulta el estado, guía paso a paso y registra la incidencia.
2. **Sofia** (batería baja, italiano): verifica el apellido, abre en remoto y abre un aviso de mantenimiento automático.
3. **Marc** (llega antes de hora, francés): explica el horario y escala el early check-in.
4. **Carlos** (PIN caducado) → check-out con pago pendiente y feedback por voz.
5. Abre `/panel`: todo aparece en directo, con causas y tasa de resolución.

## Decisiones técnicas
- Herramientas **de cliente** para que funcione en local y en Vercel sin túneles; toda la lógica y validaciones están en el servidor (`/api/tools/[tool]`). En producción pasarían a herramientas de servidor (webhooks) firmadas.
- Reloj simulado por reserva (`demoNow`) para que cada escenario sea determinista.
- Apertura remota: enlace único + apellido, máximo 3 intentos, check-in completo y dentro del horario.
- Next.js 16 con Cache Components: las rutas dinámicas de reserva van tras `Suspense`.
- `/api/reset` y el panel no tienen autenticación: es una demo pública con datos ficticios.
