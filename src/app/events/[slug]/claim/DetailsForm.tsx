"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/Icon";
import { AppBar, Button, Card, Content, IconRow, Screen, Stepper, TitleBlock, ui } from "@/components/ui";
import { checkAgeEligibility, localDateOf, parseIsoDate } from "@/lib/age";
import { startClaim } from "@/lib/claim-store";
import { shortDate } from "@/lib/format";
import { toE164 } from "@/lib/phone";
import { canClaim, type GuestListEvent } from "@/lib/sample-data";

type Errors = Partial<Record<"name" | "phone" | "dob" | "acks", string>>;

const NAME = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

const REQUIRED_ACKS = [
  { id: "terms", label: "I agree to the guest-list terms" },
  { id: "privacy", label: "I’ve read the privacy notice" },
  { id: "ocr", label: "I agree to my ID photo being read by OCR to check my age. The image is deleted after processing." },
  { id: "sms", label: "I agree to receive texts for verification, pass recovery and door entry" },
];

export function DetailsForm({ event }: { event: GuestListEvent }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const eventDay = shortDate(event.startsAt, event.timeZone).split(", ")[1];

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim().replace(/\s+/g, " ");
    const phone = toE164(String(data.get("phone") ?? ""));
    const dob = parseIsoDate(String(data.get("dob") ?? ""));
    const next: Errors = {};

    if (!name) next.name = "Enter your full name as it appears on your ID.";
    else if (!NAME.test(name)) next.name = "Use letters, spaces, apostrophes, periods or hyphens only.";
    if (!phone) next.phone = "Enter a valid mobile number with country code, like +1 202 555 0142.";

    // Early check on the typed date only. It stays unverified until compared with the scanned ID.
    const age = checkAgeEligibility(dob, localDateOf(new Date(event.startsAt), event.timeZone), localDateOf(new Date(), event.timeZone));
    if (!age.ok) {
      next.dob = {
        invalid_date: "Enter your date of birth.",
        future_date: "Date of birth can’t be in the future.",
        under_age: `You need to be 21 or older on ${eventDay} to claim a spot.`,
      }[age.reason];
    }
    if (REQUIRED_ACKS.some((a) => data.get(a.id) !== "on")) next.acks = "Agree to all required items to continue.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = (["name", "phone", "dob"] as const).find((k) => next[k]) ?? REQUIRED_ACKS.find((a) => data.get(a.id) !== "on")?.id;
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    // Prototype: the real app creates the 10-minute hold atomically on the server here.
    startClaim(event.slug, name, phone!);
    router.push(`/events/${event.slug}/claim/verify`);
  }

  if (!canClaim(event)) {
    return (
      <Screen>
        <AppBar title="Claim a spot" backHref={`/events/${event.slug}`} />
        <Content>
          <TitleBlock title="This event isn’t accepting claims">It may be sold out, paused, canceled or over.</TitleBlock>
        </Content>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar title="Claim a spot" backHref={`/events/${event.slug}`} />
      <Content>
        <Stepper flow="attendee" step={1} />
        <TitleBlock title="Your details">
          For {event.name} · {shortDate(event.startsAt, event.timeZone)}. Use your name exactly as it appears on your ID.
        </TitleBlock>

        <form ref={formRef} className={ui.content} style={{ padding: 0 }} onSubmit={onSubmit} noValidate>
          <Field id="name" label="Full name (as shown on ID)" error={errors.name} help="Accents, apostrophes, hyphens and spaces are fine." input={{ autoComplete: "name", autoCapitalize: "words" }} />
          <Field
            id="phone"
            label="Mobile number"
            error={errors.phone}
            help="Include country code. We’ll text a code to verify it. No email needed."
            input={{ type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+1 202 555 0142" }}
          />
          <Field
            id="dob"
            label="Date of birth"
            error={errors.dob}
            help={`We compare this with the date of birth read from your ID to check you’ll be 21+ on ${eventDay}.`}
            input={{ type: "date", autoComplete: "bday" }}
          />

          <fieldset className={ui.fieldset} aria-describedby={errors.acks ? "acks-error" : undefined}>
            <legend className={`${ui.overline} ${ui.muted}`}>Required</legend>
            {REQUIRED_ACKS.map((a) => (
              <label key={a.id} className={ui.checkRow}>
                <input type="checkbox" name={a.id} />
                <span>{a.label}</span>
              </label>
            ))}
            {errors.acks && (
              <p id="acks-error" className={`${ui.help} ${ui.error}`} role="alert">
                <Icon name="alert" size={16} />
                {errors.acks}
              </p>
            )}
          </fieldset>

          <fieldset className={ui.fieldset}>
            <legend className={`${ui.overline} ${ui.muted}`}>Optional</legend>
            <label className={ui.checkRow}>
              <input type="checkbox" name="marketing_sms" />
              <span>Send me marketing texts from {event.venue}. Not required to claim.</span>
            </label>
          </fieldset>

          <Card raised>
            <IconRow icon="clock" iconClass={ui.accent} textClass={ui.label}>
              Continuing holds your spot for 10 minutes while you verify your phone and scan your ID.
            </IconRow>
          </Card>

          <Button type="submit">Continue and hold my spot</Button>
        </form>
      </Content>
    </Screen>
  );
}

function Field({ id, label, help, error, input }: { id: string; label: string; help: string; error?: string; input: InputHTMLAttributes<HTMLInputElement> }) {
  const helpId = `${id}-help`;
  return (
    <div className={ui.field}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} className={ui.input} aria-describedby={helpId} aria-invalid={error ? true : undefined} {...input} />
      <p id={helpId} className={`${ui.help} ${error ? ui.error : ""}`}>
        {error && <Icon name="alert" size={16} />}
        {error ?? help}
      </p>
    </div>
  );
}
