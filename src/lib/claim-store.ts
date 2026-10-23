"use client";

// Prototype-only claim state kept in sessionStorage so the flow survives reloads.
// In the real app the hold, phone verification and age check live on the server,
// and the browser never holds authoritative state. Birth dates are never stored here.

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const HOLD_SECONDS = 10 * 60;

export type ClaimDraft = {
  eventSlug: string;
  name: string;
  phone: string;
  holdExpiresAt: number;
  phoneVerified: boolean;
  ageCheck: "not_started" | "passed" | "needs_rescan";
  passRef?: string;
  passToken?: string;
};

const key = (slug: string) => `plus1.claim.${slug}`;

const CHANGE_EVENT = "plus1-claim-change";

function readRaw(slug: string): string | null {
  try {
    return sessionStorage.getItem(key(slug));
  } catch {
    return null;
  }
}

function write(draft: ClaimDraft | null, slug: string) {
  try {
    if (draft) sessionStorage.setItem(key(slug), JSON.stringify(draft));
    else sessionStorage.removeItem(key(slug));
  } catch {
    // Storage can be unavailable (private mode); the prototype still works for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Returns undefined during server render, then the draft or null. */
export function useClaimDraft(slug: string) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(slug), () => undefined);
  const draft = useMemo<ClaimDraft | null | undefined>(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as ClaimDraft) : null;
    } catch {
      return null;
    }
  }, [raw]);

  const update = useCallback((next: ClaimDraft | null) => write(next, slug), [slug]);

  return [draft, update] as const;
}

export function startClaim(slug: string, name: string, phone: string): ClaimDraft {
  const draft: ClaimDraft = {
    eventSlug: slug,
    name,
    phone,
    holdExpiresAt: Date.now() + HOLD_SECONDS * 1000,
    phoneVerified: false,
    ageCheck: "not_started",
  };
  write(draft, slug);
  return draft;
}

/** Opaque pass reference and token for a new prototype pass. */
export function newPassIdentifiers() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const pick = (i: number) => alphabet[bytes[i] % alphabet.length];
  const ref = `P1-${[0, 1, 2, 3].map(pick).join("")}-${[4, 5, 6, 7].map(pick).join("")}`;
  const token = "pt_" + Array.from(bytes.slice(8), (b) => b.toString(16).padStart(2, "0")).join("");
  return { ref, token };
}
