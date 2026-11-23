import { resetDemo } from "@/lib/store";

export async function POST() {
  await resetDemo();
  return Response.json({ ok: true });
}
