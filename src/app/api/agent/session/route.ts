/**
 * Returns a short-lived WebRTC conversation token for the ElevenLabs agent,
 * so the API key never reaches the browser and the agent can stay private.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return Response.json(
      {
        error: "not_configured",
        message:
          "Faltan ELEVENLABS_API_KEY y/o ELEVENLABS_AGENT_ID en las variables de entorno.",
      },
      { status: 503 },
    );
  }
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!res.ok) {
    return Response.json(
      { error: "elevenlabs_error", status: res.status },
      { status: 502 },
    );
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    return Response.json({ error: "no_token" }, { status: 502 });
  }
  return Response.json({ token: data.token });
}
