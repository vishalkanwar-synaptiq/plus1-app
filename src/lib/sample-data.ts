// Synthetic sample data for the clickable prototype. No real people, numbers or venues.
// The 555-01xx numbers are reserved for fiction.

export type EventStatus = "draft" | "published" | "paused" | "canceled" | "completed";

export type GuestListEvent = {
  slug: string;
  name: string;
  venue: string;
  neighborhood: string;
  address: string;
  timeZone: string;
  startsAt: string;
  admissionStart: string;
  admissionEnd: string;
  claimsCloseAt: string;
  allocation: number;
  confirmed: number;
  held: number;
  canceledClaims: number;
  checkedIn: number;
  status: EventStatus;
  hasImage: boolean;
  offer: string;
  conditions: string;
};

export const EVENTS: GuestListEvent[] = [
  {
    slug: "midnight-jazz-session",
    name: "Midnight Jazz Session",
    venue: "Blue Room",
    neighborhood: "Lower East Side",
    address: "214 Rivington St, New York, NY 10002",
    timeZone: "America/New_York",
    startsAt: "2026-11-07T02:00:00Z",
    admissionStart: "2026-11-07T02:00:00Z",
    admissionEnd: "2026-11-07T03:30:00Z",
    claimsCloseAt: "2026-11-07T01:00:00Z",
    allocation: 80,
    confirmed: 64,
    held: 4,
    canceledClaims: 3,
    checkedIn: 1,
    status: "published",
    hasImage: true,
    offer: "Free entry for one before 10:30 PM and a welcome drink. Live quartet from 9:30 PM.",
    conditions: "Smart casual dress. The venue may refuse entry at its discretion. Physical ID is required at the door.",
  },
  {
    slug: "late-set-trio-velvet",
    name: "Late Set: Trio Velvet",
    venue: "Halcyon Lounge",
    neighborhood: "Williamsburg",
    address: "88 Wythe Ave, Brooklyn, NY 11249",
    timeZone: "America/New_York",
    startsAt: "2026-11-08T03:30:00Z",
    admissionStart: "2026-11-08T03:30:00Z",
    admissionEnd: "2026-11-08T05:00:00Z",
    claimsCloseAt: "2026-11-08T02:30:00Z",
    allocation: 40,
    confirmed: 36,
    held: 2,
    canceledClaims: 1,
    checkedIn: 0,
    status: "published",
    hasImage: false,
    offer: "Free entry for one before midnight. Two sets from Trio Velvet.",
    conditions: "No sportswear. Physical ID is required at the door.",
  },
  {
    slug: "jazz-brunch-after-hours",
    name: "Jazz Brunch After Hours",
    venue: "The Vault",
    neighborhood: "SoHo",
    address: "12 Greene St, New York, NY 10013",
    timeZone: "America/New_York",
    startsAt: "2026-11-09T04:00:00Z",
    admissionStart: "2026-11-09T04:00:00Z",
    admissionEnd: "2026-11-09T05:30:00Z",
    claimsCloseAt: "2026-11-09T03:00:00Z",
    allocation: 30,
    confirmed: 30,
    held: 0,
    canceledClaims: 0,
    checkedIn: 0,
    status: "published",
    hasImage: false,
    offer: "Free entry for one and late-night bites.",
    conditions: "Physical ID is required at the door.",
  },
  {
    slug: "sunset-rooftop-sessions",
    name: "Sunset Rooftop Sessions",
    venue: "The Overlook",
    neighborhood: "Silver Lake",
    address: "3300 Sunset Blvd, Los Angeles, CA 90026",
    timeZone: "America/Los_Angeles",
    startsAt: "2026-11-14T04:00:00Z",
    admissionStart: "2026-11-14T04:00:00Z",
    admissionEnd: "2026-11-14T05:30:00Z",
    claimsCloseAt: "2026-11-14T03:00:00Z",
    allocation: 50,
    confirmed: 0,
    held: 0,
    canceledClaims: 12,
    checkedIn: 0,
    status: "canceled",
    hasImage: false,
    offer: "Free entry for one with a jazz trio at sunset.",
    conditions: "Physical ID is required at the door.",
  },
  {
    slug: "autumn-swing-night",
    name: "Autumn Swing Night",
    venue: "Blue Room",
    neighborhood: "Lower East Side",
    address: "214 Rivington St, New York, NY 10002",
    timeZone: "America/New_York",
    startsAt: "2026-10-17T01:00:00Z",
    admissionStart: "2026-10-17T01:00:00Z",
    admissionEnd: "2026-10-17T02:30:00Z",
    claimsCloseAt: "2026-10-17T00:00:00Z",
    allocation: 60,
    confirmed: 58,
    held: 0,
    canceledClaims: 2,
    checkedIn: 51,
    status: "completed",
    hasImage: false,
    offer: "Free entry for one and a beginner swing lesson.",
    conditions: "Physical ID is required at the door.",
  },
];

export function availableSpots(e: GuestListEvent): number {
  return Math.max(0, e.allocation - e.held - e.confirmed);
}

export function getEvent(slug: string): GuestListEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export function canClaim(e: GuestListEvent): boolean {
  return e.status === "published" && availableSpots(e) > 0;
}

export type Tone = "success" | "warning" | "error" | "neutral" | "accent";

export function availabilityStatus(e: GuestListEvent): { tone: Tone; label: string } {
  if (e.status === "canceled") return { tone: "error", label: "Canceled" };
  if (e.status === "completed") return { tone: "neutral", label: "Ended" };
  if (e.status === "paused") return { tone: "warning", label: "Claims paused" };
  const left = availableSpots(e);
  if (left === 0) return { tone: "error", label: "Sold out" };
  return { tone: left <= 5 ? "warning" : "success", label: `${left} ${left === 1 ? "spot" : "spots"} left` };
}

export type PassStatus = "confirmed" | "canceled" | "revoked";

export type SamplePass = {
  ref: string;
  token: string;
  eventSlug: string;
  name: string;
  phone: string;
  status: PassStatus;
  checkedIn?: { at: string; by: string };
};

export const PASSES: SamplePass[] = [
  { ref: "P1-7KQ4-M2X9", token: "pt_8f3k2q9x7w1m4r6t0y5u", eventSlug: "midnight-jazz-session", name: "Maya Rodriguez", phone: "+12025550142", status: "confirmed" },
  { ref: "P1-3HD8-QW2L", token: "pt_2b7n5c1v9z3x8l4k6j0h", eventSlug: "midnight-jazz-session", name: "Daniel Okafor", phone: "+12025550177", status: "confirmed", checkedIn: { at: "2026-11-07T02:14:00Z", by: "Jordan K." } },
  { ref: "P1-9ZZ1-CN4V", token: "pt_5g1h8j2k6l9m3n7b0v4c", eventSlug: "midnight-jazz-session", name: "Arjun Kapoor", phone: "+12025550155", status: "canceled" },
  { ref: "P1-5TR2-LK8D", token: "pt_9q4w7e1r5t8y2u6i3o0p", eventSlug: "late-set-trio-velvet", name: "Priya Shah", phone: "+12025550163", status: "confirmed" },
];

export function findPass(refOrToken: string): SamplePass | undefined {
  const q = refOrToken.trim().toUpperCase();
  return PASSES.find((p) => p.ref === q || p.token.toUpperCase() === q);
}

export type DashboardAttendee = { name: string; phone: string; detail: string; tone: Tone; label: string };

export const DASHBOARD_ATTENDEES: DashboardAttendee[] = [
  { name: "Maya Rodriguez", phone: "+12025550142", detail: "Age check passed", tone: "success", label: "Confirmed" },
  { name: "Daniel Okafor", phone: "+12025550177", detail: "Age check passed", tone: "accent", label: "Checked in" },
  { name: "Sofia Lindqvist", phone: "+12025550139", detail: "Scanning ID", tone: "warning", label: "Held 6 min" },
  { name: "Arjun Kapoor", phone: "+12025550155", detail: "Canceled by guest", tone: "neutral", label: "Canceled" },
];

/** The event door staff are working tonight in the prototype. */
export const DOOR_EVENT_SLUG = "midnight-jazz-session";
