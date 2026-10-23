"use client";

import { useId, useState } from "react";
import s from "./ui.module.css";

/** One real one-time-code input, drawn as six cells. */
export function CodeInput({ value, onChange, label = "6-digit code", describedBy }: { value: string; onChange: (v: string) => void; label?: string; describedBy?: string }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  return (
    <div className={s.codeWrap}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <div className={s.codeCells} aria-hidden="true">
        {digits.map((d, i) => (
          <span key={i} className={s.codeCell} data-active={focused && i === Math.min(value.length, 5)}>
            {d.trim()}
          </span>
        ))}
      </div>
      <input
        id={id}
        className={s.codeInput}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        aria-describedby={describedBy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
    </div>
  );
}
