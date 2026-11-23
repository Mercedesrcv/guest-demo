# Herramientas del agente (tipo **Client tool**)

Créalas en ElevenLabs → Agent → Tools → *Add tool* → **Client**. Los nombres deben coincidir exactamente con los de este archivo.
Marca **"Wait for response"** en todas, para que el agente use el resultado.

En la sección **Security** del agente no hace falta activar overrides: la demo usa variables dinámicas.

## Variables dinámicas (Agent → Advanced → Dynamic variables)
Define estos placeholders con un valor de prueba:
`modo`, `nombre_huesped`, `hotel`, `habitacion`, `planta`, `idioma_reserva`, `fecha_entrada`, `fecha_salida`, `primer_mensaje`.

## Herramientas

### 1. `consultar_estado_acceso`
- **Descripción:** Consulta el estado de acceso de la reserva: check-in, ventana horaria del PIN, estado de la cerradura y causa más probable del problema. Úsala siempre primero.
- **Parámetros:** ninguno.

### 2. `verificar_identidad`
- **Descripción:** Verifica la identidad del huésped comparando el apellido de la reserva. Necesario antes de abrir la puerta en remoto.
- **Parámetros:** `apellido` (string, requerido) — apellido que dice el huésped.

### 3. `reenviar_pin`
- **Descripción:** Reenvía el enlace con el PIN al email de la reserva. No revela el PIN.
- **Parámetros:** ninguno.

### 4. `abrir_puerta_remota`
- **Descripción:** Abre la puerta de la habitación en remoto. Solo tras verificar la identidad.
- **Parámetros:** `apellido` (string, requerido) — el apellido ya verificado.

### 5. `registrar_incidencia`
- **Descripción:** Registra una incidencia atendida para el panel del hotel.
- **Parámetros:**
  - `categoria` (string, requerido) — uno de: `pin_mal_introducido`, `puerta_equivocada`, `antes_de_hora`, `checkin_pendiente`, `pin_caducado`, `bateria_baja`, `cerradura_sin_conexion`, `late_checkout`, `early_checkin`, `identidad_no_verificada`, `otro`.
  - `resumen` (string, requerido) — una frase en español.
  - `resuelta` (boolean, requerido).
  - `idioma` (string) — idioma del huésped.

### 6. `escalar_a_humano`
- **Descripción:** Avisa al equipo del hotel con el resumen del caso cuando el agente no puede resolverlo.
- **Parámetros:**
  - `categoria` (string, requerido) — mismos valores que arriba.
  - `resumen` (string, requerido) — qué ha pasado y qué se ha probado.
  - `urgencia` (string, requerido) — `baja`, `media` o `alta`.
  - `idioma` (string).

### 7. `guardar_feedback`
- **Descripción:** Guarda el feedback del check-out.
- **Parámetros:**
  - `puntuacion` (number, requerido) — de 1 a 10.
  - `comentario` (string, requerido) — resumen breve en español.
  - `idioma` (string).
  - `acepta_resena_publica` (boolean) — false si el huésped lo ha rechazado.

## Idiomas y voz
- Idioma por defecto: español. Añade inglés, francés, alemán e italiano en *Additional languages*.
- Activa la herramienta de sistema **Language detection**.
- Elige una voz multilingüe cálida; la misma voz sirve para los 5 idiomas.
- LLM recomendado: uno rápido (baja latencia) con buena capacidad de seguir herramientas.
- Límite de duración por conversación: 5 minutos.
