import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SEED_RESERVATIONS, seedById } from "./seed";
import type {
  DoorEvent,
  Feedback,
  Incident,
  RecordKind,
  Reservation,
} from "./types";

/**
 * Tiny persistence layer.
 * - With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY it uses one table (demo_records).
 * - Without them it falls back to process memory (fine for local dev; on Vercel
 *   memory is not shared between instances, so configure Supabase there).
 */

type Entry = { data: unknown; created_at: string };
const KINDS: RecordKind[] = ["reservation", "incident", "feedback", "event"];

const g = globalThis as unknown as {
  __demoMem?: Record<RecordKind, Map<string, Entry>>;
  __demoSb?: SupabaseClient | null;
};

function mem() {
  if (!g.__demoMem) {
    g.__demoMem = {
      reservation: new Map(),
      incident: new Map(),
      feedback: new Map(),
      event: new Map(),
    };
  }
  return g.__demoMem;
}

function sb(): SupabaseClient | null {
  if (g.__demoSb !== undefined) return g.__demoSb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__demoSb =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return g.__demoSb;
}

export function storageMode(): "supabase" | "memory" {
  return sb() ? "supabase" : "memory";
}

async function getRaw<T>(kind: RecordKind, id: string): Promise<T | null> {
  const client = sb();
  if (client) {
    const { data, error } = await client
      .from("demo_records")
      .select("data")
      .eq("kind", kind)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.data as T) ?? null;
  }
  return (mem()[kind].get(id)?.data as T) ?? null;
}

async function putRaw<T>(kind: RecordKind, id: string, data: T): Promise<void> {
  const client = sb();
  if (client) {
    const { error } = await client
      .from("demo_records")
      .upsert({ kind, id, data }, { onConflict: "kind,id" });
    if (error) throw new Error(error.message);
    return;
  }
  const prev = mem()[kind].get(id);
  mem()[kind].set(id, {
    data,
    created_at: prev?.created_at ?? new Date().toISOString(),
  });
}

async function listRaw<T>(kind: RecordKind): Promise<T[]> {
  const client = sb();
  if (client) {
    const { data, error } = await client
      .from("demo_records")
      .select("data")
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.data as T);
  }
  return [...mem()[kind].values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((e) => e.data as T);
}

// ---------- Reservations ----------

export async function getReservation(id: string): Promise<Reservation | null> {
  const stored = await getRaw<Reservation>("reservation", id);
  if (stored) return stored;
  const seeded = seedById(id);
  if (!seeded) return null;
  await putRaw("reservation", id, seeded);
  return seeded;
}

export async function saveReservation(r: Reservation): Promise<void> {
  await putRaw("reservation", r.id, r);
}

export async function listReservations(): Promise<Reservation[]> {
  const stored = await listRaw<Reservation>("reservation");
  const byId = new Map(stored.map((r) => [r.id, r]));
  return SEED_RESERVATIONS.map((s) => byId.get(s.id) ?? structuredClone(s));
}

// ---------- Incidents / feedback / events ----------

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export async function addIncident(
  i: Omit<Incident, "id" | "createdAt">,
): Promise<Incident> {
  const rec: Incident = { ...i, id: newId("inc"), createdAt: new Date().toISOString() };
  await putRaw("incident", rec.id, rec);
  return rec;
}

export async function addFeedback(
  f: Omit<Feedback, "id" | "createdAt">,
): Promise<Feedback> {
  const rec: Feedback = { ...f, id: newId("fb"), createdAt: new Date().toISOString() };
  await putRaw("feedback", rec.id, rec);
  return rec;
}

export async function addEvent(
  e: Omit<DoorEvent, "id" | "createdAt">,
): Promise<DoorEvent> {
  const rec: DoorEvent = { ...e, id: newId("ev"), createdAt: new Date().toISOString() };
  await putRaw("event", rec.id, rec);
  return rec;
}

export const listIncidents = () => listRaw<Incident>("incident");
export const listFeedback = () => listRaw<Feedback>("feedback");
export const listEvents = () => listRaw<DoorEvent>("event");

export async function resetDemo(): Promise<void> {
  const client = sb();
  if (client) {
    const { error } = await client
      .from("demo_records")
      .delete()
      .in("kind", KINDS);
    if (error) throw new Error(error.message);
    return;
  }
  for (const k of KINDS) mem()[k].clear();
}
