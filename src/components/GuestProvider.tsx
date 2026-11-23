"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AccessState } from "@/lib/access";
import type { Reservation } from "@/lib/types";

export type GuestReservation = Omit<Reservation, "pin"> & {
  pin: string | null;
  access: AccessState;
};

type Ctx = {
  id: string;
  r: GuestReservation | null;
  error: boolean;
  refresh: () => Promise<void>;
  act: (body: Record<string, unknown>) => Promise<void>;
};

const GuestCtx = createContext<Ctx | null>(null);

export function GuestProvider({ id, children }: { id: string; children: ReactNode }) {
  const [r, setR] = useState<GuestReservation | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/reservations/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError(true);
      return;
    }
    setR(await res.json());
  }, [id]);

  const act = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setR(await res.json());
    },
    [id],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <GuestCtx.Provider value={{ id, r, error, refresh, act }}>
      {children}
    </GuestCtx.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestCtx);
  if (!ctx) throw new Error("useGuest must be used inside GuestProvider");
  return ctx;
}
