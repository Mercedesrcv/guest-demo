import { connection } from "next/server";
import {
  listEvents,
  listFeedback,
  listIncidents,
  listReservations,
  storageMode,
} from "@/lib/store";

export async function GET() {
  await connection(); // always render at request time
  const [reservations, incidents, feedback, events] = await Promise.all([
    listReservations(),
    listIncidents(),
    listFeedback(),
    listEvents(),
  ]);
  return Response.json({
    storage: storageMode(),
    voiceConfigured: Boolean(
      process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID,
    ),
    reservations: reservations.map(({ pin, ...r }) => {
      void pin;
      return r;
    }),
    incidents,
    feedback,
    events,
  });
}
