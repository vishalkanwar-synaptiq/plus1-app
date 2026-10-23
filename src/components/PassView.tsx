"use client";

import { useState } from "react";
import { admissionWindow, shortDateTime, time } from "@/lib/format";
import type { GuestListEvent } from "@/lib/sample-data";
import { QrCode } from "./QrCode";
import { AppBar, Button, ButtonLink, Card, Chip, Content, IconRow, Notice, Screen, Stepper, ui } from "./ui";

type Props = {
  event: GuestListEvent;
  name: string;
  passRef: string;
  token: string;
  status: "confirmed" | "canceled" | "revoked";
  checkedInAt?: string;
  showStepper?: boolean;
  justConfirmed?: boolean;
  backHref?: string;
  onCancel?: () => void;
};

/** The saved admission pass. It never shows the door code, birth date or anything from the ID. */
export function PassView({ event, name, passRef, token, status, checkedInAt, showStepper, justConfirmed, backHref, onCancel }: Props) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceled, setCanceled] = useState(status === "canceled");
  const active = !canceled && status === "confirmed";

  return (
    <Screen>
      <AppBar title="Your pass" backHref={backHref} />
      <Content>
        {showStepper && <Stepper flow="attendee" step={4} />}
        {canceled ? (
          <Notice tone="error" icon="x" title="This spot is canceled">
            <p className={ui.label}>The pass can’t be used for entry. The spot has been released for someone else.</p>
          </Notice>
        ) : justConfirmed ? (
          <Notice tone="success" icon="check-circle" title="You’re on the guest list">
            <p className={ui.label}>Your spot is confirmed. We texted you a link to this pass.</p>
          </Notice>
        ) : null}

        <Card label="Admission pass">
          <div className={ui.stack} style={{ gap: 4 }}>
            <p className={`${ui.overline} ${ui.muted}`}>{name}</p>
            <h2 className={ui.title}>{event.name}</h2>
            <p className={`${ui.label} ${ui.muted}`}>
              {event.venue} · {shortDateTime(event.startsAt, event.timeZone)}
            </p>
          </div>
          {active && <QrCode token={token} />}
          <p className={`${ui.row} ${ui.center}`} style={{ justifyContent: "center" }}>
            <span className={`${ui.overline} ${ui.muted}`}>Ref</span>
            <span className={ui.reference}>{passRef}</span>
          </p>
          <div className={ui.rowWrap} style={{ justifyContent: "center" }}>
            {canceled ? <Chip tone="error">Canceled</Chip> : <Chip tone="success">Confirmed</Chip>}
            <Chip tone="accent">Phone verified</Chip>
            <Chip tone="success">Age check passed</Chip>
            {checkedInAt ? <Chip tone="accent">Checked in {time(checkedInAt, event.timeZone)}</Chip> : <Chip tone="neutral">Not checked in</Chip>}
          </div>
          <div className={ui.stack} style={{ gap: 10 }}>
            <IconRow icon="user" textClass={ui.label}>
              Admits 1 person
            </IconRow>
            <IconRow icon="clock" textClass={ui.label}>
              Entry {admissionWindow(event)}
            </IconRow>
            <IconRow icon="id-card" textClass={ui.label}>
              Bring your physical ID and this phone
            </IconRow>
          </div>
        </Card>

        {active && (
          <Card raised label="At the door">
            <IconRow icon="message" iconClass={ui.accent}>
              At the door, staff will send a code to your verified phone. Show them the received code and your physical ID.
            </IconRow>
            <p className={`${ui.caption} ${ui.muted}`}>A screenshot of this pass alone won’t get you in.</p>
          </Card>
        )}

        <div className={ui.stack}>
          <ButtonLink variant="secondary" href="/my-guest-list">
            View my guest list
          </ButtonLink>
          {active && !checkedInAt && !confirmingCancel && (
            <Button variant="danger" onClick={() => setConfirmingCancel(true)}>
              Cancel my spot
            </Button>
          )}
          {confirmingCancel && !canceled && (
            <Card raised label="Cancel my spot">
              <p className={ui.bodyStrong}>Cancel your spot at {event.name}?</p>
              <p className={`${ui.label} ${ui.muted}`}>
                The spot goes back to the venue. You’d need to claim again, if spots are left, before claims close at {time(event.claimsCloseAt, event.timeZone)}.
              </p>
              <div className={ui.split}>
                <Button variant="secondary" compact onClick={() => setConfirmingCancel(false)}>
                  Keep my spot
                </Button>
                <Button
                  compact
                  onClick={() => {
                    setCanceled(true);
                    setConfirmingCancel(false);
                    onCancel?.();
                  }}
                >
                  Yes, cancel
                </Button>
              </div>
            </Card>
          )}
        </div>
      </Content>
    </Screen>
  );
}
