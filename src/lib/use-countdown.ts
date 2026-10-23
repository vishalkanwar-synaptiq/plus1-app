"use client";

import { useSyncExternalStore } from "react";

// One shared one-second clock for every countdown on the page.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const currentSecond = () => Math.floor(Date.now() / 1000);

/** Seconds remaining until `deadline` (epoch ms), ticking once a second. Null during server render. */
export function useCountdown(deadline: number | null | undefined): number | null {
  const second = useSyncExternalStore(subscribe, currentSecond, () => null);
  if (deadline == null || second == null) return null;
  return Math.max(0, Math.floor(deadline / 1000) - second);
}
