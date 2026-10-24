import { describe, expect, it } from "vitest";
import { checkAgeEligibility, eligibilityCutoff, localDateOf, parseIsoDate, type CalendarDate } from "./age";

const d = (iso: string) => parseIsoDate(iso) as CalendarDate;
const TODAY = d("2026-10-23");

describe("checkAgeEligibility", () => {
  it("passes someone who turns 21 on the event day", () => {
    expect(checkAgeEligibility(d("2005-11-06"), d("2026-11-06"), TODAY)).toEqual({ ok: true });
  });

  it("fails someone who turns 21 the day after the event", () => {
    expect(checkAgeEligibility(d("2005-11-07"), d("2026-11-06"), TODAY)).toEqual({ ok: false, reason: "under_age" });
  });

  it("rejects impossible and future dates", () => {
    expect(parseIsoDate("2001-02-30")).toBeNull();
    expect(parseIsoDate("2001-13-01")).toBeNull();
    expect(checkAgeEligibility(parseIsoDate("not a date"), d("2026-11-06"), TODAY)).toEqual({ ok: false, reason: "invalid_date" });
    expect(checkAgeEligibility(d("2027-01-01"), d("2026-11-06"), TODAY)).toEqual({ ok: false, reason: "future_date" });
  });

  it("treats Feb 29 birthdays as reaching 21 on Mar 1 in non-leap years", () => {
    // Born 2004-02-29; 2025 has no Feb 29.
    expect(checkAgeEligibility(d("2004-02-29"), d("2025-02-28"), d("2025-01-01")).ok).toBe(false);
    expect(checkAgeEligibility(d("2004-02-29"), d("2025-03-01"), d("2025-01-01")).ok).toBe(true);
  });

  it("handles an event on Feb 29 when the cutoff year has no Feb 29", () => {
    expect(eligibilityCutoff(d("2028-02-29"))).toEqual(d("2007-02-28"));
    expect(checkAgeEligibility(d("2007-02-28"), d("2028-02-29"), d("2028-01-01")).ok).toBe(true);
    expect(checkAgeEligibility(d("2007-03-01"), d("2028-02-29"), d("2028-01-01")).ok).toBe(false);
  });
});

describe("localDateOf", () => {
  it("uses the venue's local date, not UTC, near midnight", () => {
    // 03:30 UTC on Nov 7 is still the evening of Nov 6 in Los Angeles.
    const instant = new Date("2026-11-07T03:30:00Z");
    expect(localDateOf(instant, "America/Los_Angeles")).toEqual(d("2026-11-06"));
    expect(localDateOf(instant, "UTC")).toEqual(d("2026-11-07"));
  });
});
