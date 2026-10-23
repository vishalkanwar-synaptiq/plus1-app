// Calendar age rules from the requirements (section 4.6). Dates are plain calendar
// dates, never timestamps, and the event date is taken in the event's IANA time zone.

export type CalendarDate = { year: number; month: number; day: number };

export const MINIMUM_AGE = 21;

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Parse "YYYY-MM-DD" into a real calendar date, or null for malformed or impossible dates. */
export function parseIsoDate(input: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const [year, month, day] = m.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function toIsoDate(d: CalendarDate): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/** The calendar date of an instant in a given IANA time zone (not the browser's zone). */
export function localDateOf(instant: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Latest birth date that still counts as `years` old on `eventDate`.
 * When the event is on Feb 29 and the cutoff year has no Feb 29, the cutoff is Feb 28,
 * which means Feb 29 birthdays reach the threshold on Mar 1 in non-leap years
 * (proposed policy; needs jurisdiction review before production).
 */
export function eligibilityCutoff(eventDate: CalendarDate, years = MINIMUM_AGE): CalendarDate {
  const year = eventDate.year - years;
  return { year, month: eventDate.month, day: Math.min(eventDate.day, daysInMonth(year, eventDate.month)) };
}

export type AgeCheck =
  | { ok: true }
  | { ok: false; reason: "invalid_date" | "future_date" | "under_age" };

/** eligible = date_of_birth <= event_local_date minus 21 calendar years */
export function checkAgeEligibility(dateOfBirth: CalendarDate | null, eventDate: CalendarDate, today: CalendarDate): AgeCheck {
  if (!dateOfBirth) return { ok: false, reason: "invalid_date" };
  if (compareDates(dateOfBirth, today) > 0) return { ok: false, reason: "future_date" };
  if (compareDates(dateOfBirth, eligibilityCutoff(eventDate)) > 0) return { ok: false, reason: "under_age" };
  return { ok: true };
}
