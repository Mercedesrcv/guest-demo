import type { Reservation } from "./types";

export const EXTRA_PRICE = 12;

export const EXTRAS = [
  { id: "desayuno", label: "Desayuno buffet" },
  { id: "parking", label: "Parking" },
  { id: "late-checkout", label: "Late check-out (14:00)" },
];

export const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

type Priced = Pick<Reservation, "nightlyRate" | "nights" | "touristTaxDue" | "extrasDue">;

export const staySubtotal = (r: Pick<Reservation, "nightlyRate" | "nights">) =>
  r.nightlyRate * r.nights;

export const totalDue = (r: Priced) =>
  staySubtotal(r) + r.touristTaxDue + r.extrasDue;

export const balanceDue = (r: Priced & Pick<Reservation, "paidAtCheckin">) =>
  r.paidAtCheckin ? 0 : totalDue(r);
