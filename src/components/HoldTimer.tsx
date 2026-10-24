"use client";

import { useCountdown } from "@/lib/use-countdown";
import { mmss } from "@/lib/format";
import { Icon } from "./Icon";
import s from "./ui.module.css";

const MILESTONES = [300, 120, 60];

/** Shows the hold countdown. Screen readers hear milestones (5, 2 and 1 minute), not every second. */
export function HoldTimer({ expiresAt, message }: { expiresAt: number; message?: string }) {
  const left = useCountdown(expiresAt);
  const ending = left != null && left < 120;
  const milestone = left == null ? null : left === 0 ? 0 : MILESTONES.find((m) => left <= m && left > m - 60);
  const announcement =
    milestone === 0 ? "Your hold has expired." : milestone ? `${milestone / 60} ${milestone === 60 ? "minute" : "minutes"} left on your hold.` : "";

  return (
    <div className={`${s.hold} ${ending ? s.holdEnding : ""}`}>
      <Icon name="clock" size={20} />
      <div className={s.grow}>
        <p className={s.label}>{left === 0 ? "Your hold has expired" : "Your spot is held"}</p>
        <p className={`${s.caption} ${s.muted}`}>
          {left === 0
            ? "The spot has been released. Start again to get a new hold if spots are left."
            : ending
              ? "Under 2 minutes left. If time runs out, your spot is released."
              : (message ?? "Finish within 10 minutes. Resending a code or rescanning won’t add time.")}
        </p>
      </div>
      <span className={s.holdTime} aria-label={left == null ? undefined : `${Math.ceil(left / 60)} minutes left`}>
        {left == null ? "--:--" : mmss(left)}
      </span>
      <span className="visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
