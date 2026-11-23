/**
 * Scripted voice messages (check-in welcome, check-out goodbye) with
 * ElevenLabs Text to Speech. The agent handles conversations; this handles
 * one-way announcements, which are cheaper and instant.
 */
export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || text.length > 600) {
    return Response.json({ error: "invalid_text" }, { status: 400 });
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    },
  );
  if (!res.ok || !res.body) {
    return Response.json({ error: "elevenlabs_error", status: res.status }, { status: 502 });
  }
  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
