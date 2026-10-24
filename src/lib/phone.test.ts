import { describe, expect, it } from "vitest";
import { maskPhone, toE164 } from "./phone";

describe("toE164", () => {
  it("normalizes common US formats", () => {
    expect(toE164("(202) 555-0142")).toBe("+12025550142");
    expect(toE164("+1 202 555 0142")).toBe("+12025550142");
  });

  it("keeps international numbers with a country code", () => {
    expect(toE164("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("rejects invalid input", () => {
    expect(toE164("12345")).toBeNull();
    expect(toE164("")).toBeNull();
  });
});

describe("maskPhone", () => {
  it("shows only the last four digits", () => {
    expect(maskPhone("+12025550142")).toBe("••• ••• 0142");
  });
});
