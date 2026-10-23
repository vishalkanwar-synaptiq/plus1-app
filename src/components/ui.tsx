import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import type { Tone } from "@/lib/sample-data";
import s from "./ui.module.css";

export { s as ui };

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export function Screen({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className={s.screen} aria-label={label}>
      {children}
    </div>
  );
}

export function Content({ children }: { children: ReactNode }) {
  return <main className={s.content}>{children}</main>;
}

export function AppBar({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <header className={cx(s.appBar, !backHref && s.appBarNoBack)}>
      {backHref && (
        <Link href={backHref} className={s.iconButton} aria-label="Back">
          <Icon name="chevron-left" />
        </Link>
      )}
      <h1>{title}</h1>
    </header>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({ variant = "primary", compact, className, ...props }: ComponentProps<"button"> & { variant?: Variant; compact?: boolean }) {
  return <button type="button" className={cx(s.button, s[variant], compact && s.compact, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", compact, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; compact?: boolean }) {
  return <Link className={cx(s.button, s[variant], compact && s.compact, className)} {...props} />;
}

export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={cx(s.chip, s[`tone-${tone}`])}>{children}</span>;
}

const ATTENDEE_STEPS = ["Your details", "Verify phone", "Scan ID for age", "Your pass"];
const STAFF_STEPS = ["Scan pass", "Send SMS code", "Compare code and check ID", "Check in"];

export function Stepper({ flow, step }: { flow: "attendee" | "staff"; step: 1 | 2 | 3 | 4 }) {
  const labels = flow === "attendee" ? ATTENDEE_STEPS : STAFF_STEPS;
  return (
    <div className={s.stepper}>
      <div className={s.stepperBars} aria-hidden="true">
        {labels.map((l, i) => (
          <span key={l} data-done={i < step} />
        ))}
      </div>
      <p className={s.row}>
        <span className={cx(s.overline, s.muted)}>Step {step} of 4</span>
        <span className={s.label}>{labels[step - 1]}</span>
      </p>
    </div>
  );
}

export function Card({ children, raised, className, label }: { children: ReactNode; raised?: boolean; className?: string; label?: string }) {
  return (
    <section className={cx(s.card, raised && s.cardRaised, className)} aria-label={label}>
      {children}
    </section>
  );
}

export function IconRow({ icon, children, iconClass = s.muted, textClass = s.body }: { icon: IconName; children: ReactNode; iconClass?: string; textClass?: string }) {
  return (
    <div className={s.iconRow}>
      <Icon name={icon} size={20} className={iconClass} />
      <p className={textClass}>{children}</p>
    </div>
  );
}

export function Notice({ tone, icon, title, children }: { tone: "success" | "warning" | "error"; icon: IconName; title: string; children?: ReactNode }) {
  const color = { success: "var(--color-status-success)", warning: "var(--color-status-warning)", error: "var(--color-status-error)" }[tone];
  return (
    <div className={cx(s.notice, s[`notice-${tone}`])} role={tone === "success" ? "status" : "alert"}>
      <span style={{ color, flex: "none" }}>
        <Icon name={icon} size={24} />
      </span>
      <div className={s.stack} style={{ gap: 4 }}>
        <p className={s.heading} style={{ color }}>
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}

export function TitleBlock({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={s.stack}>
      <h2 className={s.title}>{title}</h2>
      {children && <p className={cx(s.body, s.muted)}>{children}</p>}
    </div>
  );
}

export function KeyValues({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className={s.stack} style={{ gap: 12, margin: 0 }}>
      {items.map(([k, v]) => (
        <div key={k} className={s.kv}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
