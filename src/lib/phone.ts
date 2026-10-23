import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Normalize a typed mobile number to E.164, or null if it isn't a valid number. */
export function toE164(input: string, defaultCountry: "US" = "US"): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), defaultCountry);
  return parsed && parsed.isValid() ? parsed.number : null;
}

/** Masked form for screens and staff views: only the last four digits are shown. */
export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `••• ••• ${digits.slice(-4)}`;
}
