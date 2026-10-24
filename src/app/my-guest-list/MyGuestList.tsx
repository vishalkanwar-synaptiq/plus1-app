"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CodeInput } from "@/components/CodeInput";
import { Icon } from "@/components/Icon";
import { AppBar, Button, Chip, Content, Screen, TitleBlock, ui } from "@/components/ui";
import type { ClaimDraft } from "@/lib/claim-store";
import { shortDateTime } from "@/lib/format";
import { toE164 } from "@/lib/phone";
import { PASSES, getEvent } from "@/lib/sample-data";

type Step = "phone" | "code" | "passes";
type Listed = { ref: string; href: string; eventSlug: string; status: string };

/** Prototype passes claimed in this browser tab, plus one sample pass. */
function listPasses(): Listed[] {
  const listed: Listed[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith("plus1.claim.")) continue;
      const d = JSON.parse(sessionStorage.getItem(key) ?? "null") as ClaimDraft | null;
      if (d?.passRef) listed.push({ ref: d.passRef, href: `/events/${d.eventSlug}/claim/pass`, eventSlug: d.eventSlug, status: "Confirmed" });
    }
  } catch {
    // Storage unavailable: show the sample pass only.
  }
  const sample = PASSES[0];
  listed.push({ ref: sample.ref, href: `/passes/${sample.ref}`, eventSlug: sample.eventSlug, status: "Confirmed" });
  return listed;
}

export function MyGuestList() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [passes, setPasses] = useState<Listed[]>([]);

  const sendCode = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phone = toE164(String(new FormData(e.currentTarget).get("phone") ?? ""));
    if (!phone) {
      setPhoneError("Enter a valid mobile number with country code.");
      return;
    }
    setPhoneError(null);
    setStep("code");
  };

  return (
    <Screen>
      <AppBar title="My guest list" backHref="/" />
      <Content>
        {step === "phone" && (
          <form className={ui.content} style={{ padding: 0 }} onSubmit={sendCode} noValidate>
            <TitleBlock title="Find your passes">Enter the mobile number you verified when you claimed. We’ll text you a sign-in code.</TitleBlock>
            <div className={ui.field}>
              <label htmlFor="phone">Mobile number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={ui.input}
                placeholder="+1 202 555 0142"
                aria-invalid={phoneError ? true : undefined}
                aria-describedby="phone-help"
              />
              <p id="phone-help" className={`${ui.help} ${phoneError ? ui.error : ""}`}>
                {phoneError && <Icon name="alert" size={16} />}
                {phoneError ?? "Include country code."}
              </p>
            </div>
            <Button type="submit">Text me a code</Button>
          </form>
        )}

        {step === "code" && (
          <>
            {/* Same message whether or not the number has passes, so numbers can't be probed. */}
            <TitleBlock title="Check your texts">If this number has passes, we’ve sent a code to it. It expires in 5 minutes.</TitleBlock>
            <CodeInput value={code} onChange={setCode} />
            <p className={`${ui.caption} ${ui.muted}`}>Prototype: any 6 digits work.</p>
            <Button
              disabled={code.length !== 6}
              onClick={() => {
                setPasses(listPasses());
                setStep("passes");
              }}
            >
              Show my passes
            </Button>
            <Button variant="ghost" onClick={() => setStep("phone")}>
              Use a different number
            </Button>
          </>
        )}

        {step === "passes" && (
          <>
            <TitleBlock title="Your passes" />
            <ul className={ui.list}>
              {passes.map((p) => {
                const event = getEvent(p.eventSlug);
                if (!event) return null;
                return (
                  <li key={p.ref}>
                    <Link href={p.href} className={ui.linkRow}>
                      <Icon name="ticket" className={ui.accent} />
                      <span className={ui.grow}>
                        <span className={ui.bodyStrong} style={{ display: "block" }}>
                          {event.name}
                        </span>
                        <span className={`${ui.caption} ${ui.muted}`}>
                          {event.venue} · {shortDateTime(event.startsAt, event.timeZone)}
                        </span>
                      </span>
                      <Chip tone="success">{p.status}</Chip>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Content>
    </Screen>
  );
}
