import { getAccessState } from "@/lib/access";
import { addEvent, getReservation, saveReservation } from "@/lib/store";
import type { Reservation } from "@/lib/types";

function publicView(r: Reservation) {
  const access = getAccessState(r);
  // The PIN is only visible when the hotel's requirements are met and
  // the stay's access window is open (CivitPIN step 5).
  const pin = access.pinReleased && access.windowStatus === "active" ? r.pin : null;
  const { pin: _pin, ...rest } = r;
  void _pin;
  return { ...rest, pin, access };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getReservation(id);
  if (!r) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(publicView(r));
}

type Action =
  | { action: "complete_checkin"; selectedRoom?: string; extras?: string[]; payNow?: boolean }
  | { action: "complete_checkout" };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getReservation(id);
  if (!r) return Response.json({ error: "not_found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Action;
  const guest = `${r.guestName} ${r.lastName}`;

  if (body.action === "complete_checkin") {
    r.checkinDone = true;
    r.contractSigned = true;
    r.pmsStatus = "checked-in";
    if (body.selectedRoom) r.selectedRoom = body.selectedRoom;
    r.extras = body.extras ?? [];
    r.extrasDue = r.extras.length * 12;
    r.paidAtCheckin = body.payNow === true;
    await saveReservation(r);
    return Response.json(publicView(r));
  }

  if (body.action === "complete_checkout") {
    r.checkoutDone = true;
    r.pmsStatus = "checked-out";
    r.paidAtCheckin = true;
    r.extrasDue = 0;
    await saveReservation(r);
    await addEvent({
      reservationId: r.id,
      guestName: guest,
      room: r.room,
      type: "pms_checkout",
      ok: true,
      detail: `PMS actualizado: habitación ${r.room} → checked-out`,
    });
    return Response.json(publicView(r));
  }

  return Response.json({ error: "unknown_action" }, { status: 400 });
}
