"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { AppBar, Button, Content, Screen, Stepper, ui } from "@/components/ui";
import { DOOR_EVENT_SLUG, PASSES } from "@/lib/sample-data";

type Mode = "scan" | "reference" | "name";

const SAMPLES = [
  { ref: "P1-7KQ4-M2X9", label: "Valid pass" },
  { ref: "P1-3HD8-QW2L", label: "Already checked in" },
  { ref: "P1-9ZZ1-CN4V", label: "Canceled pass" },
  { ref: "P1-5TR2-LK8D", label: "Different event" },
  { ref: "P1-0000-0000", label: "Unknown pass" },
];

export function ScanPass({ eventName, detail }: { eventName: string; detail: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scan");
  const [query, setQuery] = useState("");

  const open = (ref: string) => router.push(`/staff/passes/${encodeURIComponent(ref.trim().toUpperCase())}`);
  const submitRef = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) open(query);
  };
  // Name search only covers confirmed guests for this event.
  const matches = query.trim().length >= 2 ? PASSES.filter((p) => p.eventSlug === DOOR_EVENT_SLUG && p.status === "confirmed" && p.name.toLowerCase().includes(query.trim().toLowerCase())) : [];

  return (
    <Screen>
      <AppBar title="Door check-in" />
      <Content>
        <button type="button" className={ui.card} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: "12px 16px", textAlign: "left", cursor: "pointer" }}>
          <Icon name="calendar" size={20} className={ui.accent} />
          <span className={ui.grow}>
            <span className={ui.bodyStrong} style={{ display: "block" }}>
              {eventName}
            </span>
            <span className={`${ui.caption} ${ui.muted}`}>{detail}</span>
          </span>
          <Icon name="chevron-right" size={20} className={ui.muted} />
        </button>
        <Stepper flow="staff" step={1} />

        {mode === "scan" && (
          <div className={ui.viewfinder} style={{ minHeight: 300 }}>
            <div className={ui.scanTarget}>
              <Icon name="scan" size={40} />
            </div>
            <p className={ui.label}>Point the camera at the guest’s QR pass</p>
            <p className={`${ui.caption} ${ui.muted}`}>Prototype: no camera. Use a sample pass below.</p>
          </div>
        )}

        {mode !== "scan" && (
          <form onSubmit={submitRef} className={ui.field}>
            <label htmlFor="lookup">{mode === "reference" ? "Pass reference" : "Guest name"}</label>
            <input
              id="lookup"
              className={ui.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "reference" ? "P1-XXXX-XXXX" : "Start typing a name"}
              autoCapitalize={mode === "reference" ? "characters" : "words"}
              autoComplete="off"
            />
            {mode === "reference" ? (
              <Button type="submit">Look up pass</Button>
            ) : (
              <ul className={ui.list} aria-live="polite">
                {matches.map((p) => (
                  <li key={p.ref}>
                    <Link href={`/staff/passes/${p.ref}`} className={ui.linkRow}>
                      <span className={ui.grow}>
                        <span className={ui.bodyStrong} style={{ display: "block" }}>
                          {p.name}
                        </span>
                        <span className={`${ui.caption} ${ui.muted}`}>{p.ref}</span>
                      </span>
                      <Icon name="chevron-right" size={20} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}

        <p className={`${ui.caption} ${ui.muted}`}>Looking up a pass never checks anyone in or sends a text by itself.</p>
        <div className={ui.split}>
          <Button variant="secondary" compact aria-pressed={mode === "reference"} onClick={() => { setMode(mode === "reference" ? "scan" : "reference"); setQuery(""); }}>
            {mode === "reference" ? "Use camera" : "Enter reference"}
          </Button>
          <Button variant="secondary" compact aria-pressed={mode === "name"} onClick={() => { setMode(mode === "name" ? "scan" : "name"); setQuery(""); }}>
            {mode === "name" ? "Use camera" : "Search name"}
          </Button>
        </div>

        <section className={ui.stack}>
          <h2 className={`${ui.overline} ${ui.muted}`}>Prototype sample passes</h2>
          <ul className={ui.list}>
            {SAMPLES.map((p) => (
              <li key={p.ref}>
                <Link href={`/staff/passes/${p.ref}`} className={ui.linkRow}>
                  <Icon name="scan" size={20} className={ui.accent} />
                  <span className={ui.grow}>{p.label}</span>
                  <span className={`${ui.caption} ${ui.muted}`}>{p.ref}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Content>
    </Screen>
  );
}
