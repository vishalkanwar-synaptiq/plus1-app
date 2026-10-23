import { localDateOf, toIsoDate } from "./age";
import type { GuestListEvent } from "./sample-data";

const fmt = (iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(new Date(iso));

/** "Fri, Nov 6 · 9:00 PM EST" */
export function shortDateTime(iso: string, timeZone: string): string {
  const date = fmt(iso, timeZone, { weekday: "short", month: "short", day: "numeric" });
  const time = fmt(iso, timeZone, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return `${date} · ${time}`;
}

/** "Friday, November 6 · 9:00 PM" */
export function longDateTime(iso: string, timeZone: string): string {
  const date = fmt(iso, timeZone, { weekday: "long", month: "long", day: "numeric" });
  return `${date} · ${time(iso, timeZone)}`;
}

/** "9:00 PM" */
export function time(iso: string, timeZone: string): string {
  return fmt(iso, timeZone, { hour: "numeric", minute: "2-digit" });
}

/** "Eastern Time (America/New_York)" */
export function timeZoneLabel(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longGeneric" }).formatToParts(new Date(iso));
  return `${parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone} (${timeZone})`;
}

/** "Fri, Nov 6" */
export function shortDate(iso: string, timeZone: string): string {
  return fmt(iso, timeZone, { weekday: "short", month: "short", day: "numeric" });
}

export function eventLocalIsoDate(e: GuestListEvent): string {
  return toIsoDate(localDateOf(new Date(e.startsAt), e.timeZone));
}

/** "Entry 9:00–10:30 PM EST" style window, using the event's own time zone. */
export function admissionWindow(e: GuestListEvent): string {
  const tz = fmt(e.admissionEnd, e.timeZone, { timeZoneName: "short" }).split(" ").pop();
  return `${time(e.admissionStart, e.timeZone)}–${time(e.admissionEnd, e.timeZone)} ${tz}`;
}

/** "08:42" for a countdown. */
export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** "1:42" for short countdowns. */
export function mss(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
