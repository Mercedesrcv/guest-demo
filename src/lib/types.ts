export type Lang = "es" | "en" | "fr" | "de" | "it";

export type LockStatus = "online" | "low_battery" | "offline";

export type Reservation = {
  /** Also used as the unique link token: /r/{id} */
  id: string;
  guestName: string;
  lastName: string;
  email: string;
  language: Lang;
  hotel: string;
  room: string;
  floor: number;
  roomType: string;
  /** Scheduled stay */
  checkInDate: string;
  checkOutDate: string;
  /** PIN validity window (ISO with offset) */
  pin: string;
  pinValidFrom: string;
  pinValidTo: string;
  /** Simulated "now" so every demo scenario is deterministic */
  demoNow: string;
  lockStatus: LockStatus;
  /** Online check-in / payment / contract state */
  checkinDone: boolean;
  contractSigned: boolean;
  nightlyRate: number;
  nights: number;
  touristTaxDue: number;
  extrasDue: number;
  paidAtCheckin: boolean;
  checkoutDone: boolean;
  /** PMS status mirrored in the staff panel */
  pmsStatus: "pre-checkin" | "checked-in" | "checked-out";
  selectedRoom?: string;
  extras: string[];
  failedIdentityAttempts: number;
  doorOpenedRemotely: boolean;
  /** Scenario shown on the landing page */
  scenarioTitle: string;
  scenarioDescription: string;
};

export type IncidentCategory =
  | "pin_mal_introducido"
  | "puerta_equivocada"
  | "antes_de_hora"
  | "checkin_pendiente"
  | "pin_caducado"
  | "bateria_baja"
  | "cerradura_sin_conexion"
  | "late_checkout"
  | "early_checkin"
  | "identidad_no_verificada"
  | "otro";

export type Incident = {
  id: string;
  createdAt: string;
  reservationId: string;
  guestName: string;
  room: string;
  category: IncidentCategory;
  summary: string;
  status: "resuelta_por_agente" | "escalada";
  urgency: "baja" | "media" | "alta";
  source: "voz" | "sistema";
  language?: string;
};

export type Feedback = {
  id: string;
  createdAt: string;
  reservationId: string;
  guestName: string;
  score: number;
  comment: string;
  sentiment: "positivo" | "neutro" | "negativo";
  publicReviewInvited: boolean;
  language?: string;
};

export type DoorEvent = {
  id: string;
  createdAt: string;
  reservationId: string;
  guestName: string;
  room: string;
  type: "remote_open" | "pin_resend" | "identity_check" | "pms_checkout";
  ok: boolean;
  detail: string;
};

export type RecordKind = "reservation" | "incident" | "feedback" | "event";
