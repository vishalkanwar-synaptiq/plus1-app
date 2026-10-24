"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { AppBar, Button, ButtonLink, Card, Chip, Content, IconRow, KeyValues, Screen, Stepper, ui } from "@/components/ui";
import { mss } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";

export type StaffPassView =
  | { result: "valid"; ref: string; name: string; maskedPhone: string; windowEnd: string; window: string }
  | { result: "already_checked_in"; ref: string; name: string; at: string; by: string }
  | { result: "canceled"; ref: string; name: string }
  | { result: "wrong_event"; ref: string; name: string; eventName: string }
  | { result: "not_found"; ref: string };

const CODE_SECONDS = 2 * 60;
const RESEND_SECONDS = 60;

type Challenge = { code: string; sentAt: number; delivered: boolean };

function newCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}

export function DoorCheck({ view }: { view: StaffPassView }) {
  if (view.result !== "valid") return <Invalid view={view} />;
  return <ValidPass view={view} />;
}

function ValidPass({ view }: { view: Extract<StaffPassView, { result: "valid" }> }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [codesMatch, setCodesMatch] = useState(false);
  const [idChecked, setIdChecked] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const codeLeft = useCountdown(challenge ? challenge.sentAt + CODE_SECONDS * 1000 : null);
  const resendLeft = useCountdown(challenge ? challenge.sentAt + RESEND_SECONDS * 1000 : null);

  // Prototype: the real server creates a single-use challenge bound to this claim and staff session,
  // texts it to the guest's verified phone, and only this staff view may display it.
  const send = () => {
    const next = { code: newCode(), sentAt: Date.now(), delivered: false };
    setChallenge(next);
    setCodesMatch(false);
    setIdChecked(false);
    setMismatch(false);
    setTimeout(() => setChallenge((c) => (c && c.code === next.code ? { ...c, delivered: true } : c)), 1200);
  };

  if (checkedInAt) {
    return (
      <Screen>
        <AppBar title="Door check-in" />
        <Content>
          <Stepper flow="staff" step={4} />
          <BigStatus icon="check-circle" tone="success" title="Checked in">
            {view.name} is admitted. This pass can’t be used again.
          </BigStatus>
          <Card>
            <KeyValues
              items={[
                ["Reference", view.ref],
                ["Checked in", `${checkedInAt} by you`],
                ["Door code", "Matched · used"],
                ["Physical ID", "Checked by staff"],
              ]}
            />
          </Card>
          <ButtonLink href="/staff">Scan next pass</ButtonLink>
        </Content>
      </Screen>
    );
  }

  if (!challenge) {
    return (
      <Screen>
        <AppBar title="Pass found" backHref="/staff" />
        <Content>
          <Stepper flow="staff" step={2} />
          <Card label="Pass result">
            <span>
              <Chip tone="success">Valid for this event</Chip>
            </span>
            <div className={ui.stack} style={{ gap: 4 }}>
              <h2 className={ui.title}>{view.name}</h2>
              <p className={ui.row}>
                <span className={`${ui.overline} ${ui.muted}`}>Ref</span>
                <span className={`${ui.reference} ${ui.muted}`}>{view.ref}</span>
              </p>
            </div>
            <hr className={ui.divider} />
            <div className={ui.stack} style={{ gap: 12 }}>
              <IconRow icon="phone" iconClass={ui.accent} textClass={ui.label}>
                Phone {view.maskedPhone} · verified
              </IconRow>
              <IconRow icon="shield" iconClass={ui.accent} textClass={ui.label}>
                Age check passed (from scanned ID)
              </IconRow>
              <IconRow icon="clock" iconClass={ui.accent} textClass={ui.label}>
                Within entry window · until {view.windowEnd}
              </IconRow>
              <IconRow icon="user" textClass={ui.label}>
                Admits 1 · Not checked in
              </IconRow>
            </div>
          </Card>
          <Card raised>
            <IconRow icon="send" iconClass={ui.accent} textClass={ui.label}>
              Next, text a 2-minute code to the guest’s verified phone. You’ll compare it with the code they receive.
            </IconRow>
          </Card>
          <div className={ui.stack}>
            <Button onClick={send}>Send confirmation code</Button>
            <ButtonLink variant="ghost" href="/staff">
              Scan another pass
            </ButtonLink>
          </div>
        </Content>
      </Screen>
    );
  }

  const expired = codeLeft === 0;
  const canCheckIn = codesMatch && idChecked && !expired && challenge.delivered && !mismatch;

  return (
    <Screen>
      <AppBar title={view.name} backHref="/staff" />
      <Content>
        <Stepper flow="staff" step={3} />
        <Card label="Door code, staff view only" className={ui.center}>
          <p className={`${ui.overline} ${ui.muted}`}>Code sent to {view.maskedPhone}</p>
          {expired ? (
            <p className={`${ui.title} ${ui.muted}`}>Code expired</p>
          ) : (
            <p className={ui.bigCode} aria-label={`Code ${challenge.code.split("").join(" ")}`}>
              {challenge.code.slice(0, 3)} {challenge.code.slice(3)}
            </p>
          )}
          <div className={ui.rowWrap} style={{ justifyContent: "center" }} aria-live="polite">
            {challenge.delivered ? <Chip tone="success">Delivered</Chip> : <Chip tone="neutral">Sending…</Chip>}
            {expired ? <Chip tone="error">Expired</Chip> : <Chip tone="warning">Expires in {mss(codeLeft ?? CODE_SECONDS)}</Chip>}
          </div>
          <p className={`${ui.label} ${ui.muted}`}>Ask the guest to show the text on their phone. Every digit must match.</p>
        </Card>

        {mismatch ? (
          <Card raised>
            <IconRow icon="alert" iconClass={ui.error} textClass={ui.label}>
              Don’t check them in. Send a new code once the resend timer ends, or turn the guest away if it still doesn’t match.
            </IconRow>
          </Card>
        ) : (
          <fieldset className={ui.fieldset}>
            <legend className={`${ui.overline} ${ui.muted}`}>Confirm both</legend>
            <label className={ui.checkRow}>
              <input type="checkbox" checked={codesMatch} onChange={(e) => setCodesMatch(e.target.checked)} disabled={expired} />
              <span>Codes match on both phones</span>
            </label>
            <label className={ui.checkRow}>
              <input type="checkbox" checked={idChecked} onChange={(e) => setIdChecked(e.target.checked)} disabled={expired} />
              <span>Physical ID checked: name matches the pass and guest is 21+</span>
            </label>
          </fieldset>
        )}

        <div className={ui.stack}>
          <Button
            disabled={!canCheckIn}
            onClick={() => setCheckedInAt(new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date()))}
          >
            Check in
          </Button>
          {!mismatch && !expired && (
            <Button variant="danger" onClick={() => setMismatch(true)}>
              Codes don’t match
            </Button>
          )}
          <Button variant="ghost" disabled={resendLeft !== 0} onClick={send}>
            {resendLeft === 0 ? "Send a new code" : `Resend code in ${mss(resendLeft ?? RESEND_SECONDS)}`}
          </Button>
        </div>
        <p className={`${ui.caption} ${ui.muted}`}>
          Check-in is recorded under your name as a staff-attested comparison. Sending a new code cancels the previous one. If the text doesn’t arrive, don’t admit through the app.
        </p>
      </Content>
    </Screen>
  );
}

function Invalid({ view }: { view: Exclude<StaffPassView, { result: "valid" }> }) {
  const copy: Record<typeof view.result, { title: string; body: string }> = {
    already_checked_in: { title: "Don’t admit", body: view.result === "already_checked_in" ? `This pass was already checked in at ${view.at}. A pass can only be used once.` : "" },
    canceled: { title: "Not valid", body: "This pass was canceled or revoked. It can’t be used for entry." },
    wrong_event: { title: "Not valid for this event", body: view.result === "wrong_event" ? `This pass is for ${view.eventName}, not tonight’s event.` : "" },
    not_found: { title: "Pass not found", body: "No pass matches this code or reference. Check the reference with the guest." },
  };
  const { title, body } = copy[view.result];
  const items: [string, string][] = [];
  if ("name" in view) items.push(["Guest", view.name]);
  items.push(["Reference", view.ref]);
  if (view.result === "already_checked_in") items.push(["Checked in", `${view.at} by ${view.by}`]);

  return (
    <Screen>
      <AppBar title="Pass check" backHref="/staff" />
      <Content>
        <Stepper flow="staff" step={1} />
        <BigStatus icon="alert" tone="error" title={title}>
          {body}
        </BigStatus>
        <Card>
          <KeyValues items={items} />
        </Card>
        <ButtonLink href="/staff">Scan another pass</ButtonLink>
      </Content>
    </Screen>
  );
}

function BigStatus({ icon, tone, title, children }: { icon: IconName; tone: "success" | "error"; title: string; children: React.ReactNode }) {
  const color = `var(--color-status-${tone})`;
  return (
    <div className={ui.bigStatus} role={tone === "error" ? "alert" : "status"}>
      <div className={ui.statusRing} style={{ background: `var(--color-status-${tone}-bg)`, color }}>
        <Icon name={icon} size={44} />
      </div>
      <h2 className={ui.display} style={{ color }}>
        {title}
      </h2>
      <p className={`${ui.body} ${ui.muted}`}>{children}</p>
    </div>
  );
}
