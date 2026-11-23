import { runTool } from "@/lib/tools";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    reservationId?: string;
    params?: Record<string, unknown>;
  };
  if (!body.reservationId) {
    return Response.json({ ok: false, error: "falta_reserva" }, { status: 400 });
  }
  const result = await runTool(tool, body.reservationId, body.params ?? {});
  return Response.json(result);
}
