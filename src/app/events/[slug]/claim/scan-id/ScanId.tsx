"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { HoldTimer } from "@/components/HoldTimer";
import { Icon } from "@/components/Icon";
import { AppBar, Button, ButtonLink, Card, Chip, Content, IconRow, Notice, Screen, Stepper, TitleBlock, ui } from "@/components/ui";
import { newPassIdentifiers, useClaimDraft } from "@/lib/claim-store";
import { useCountdown } from "@/lib/use-countdown";
import { ClaimGate } from "../ClaimGate";

type Phase = "ready" | "processing" | "needs_rescan";

export function ScanId({ slug, eventDay }: { slug: string; eventDay: string }) {
  const router = useRouter();
  const [draft, setDraft] = useClaimDraft(slug);
  const [phase, setPhase] = useState<Phase>("ready");
  const [simulateUnreadable, setSimulateUnreadable] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const holdLeft = useCountdown(draft?.holdExpiresAt);

  return (
    <ClaimGate draft={draft} slug={slug} title="Scan ID for age">
      {(d) => {
        const expired = holdLeft === 0;

        if (!d.phoneVerified) {
          return (
            <Screen>
              <AppBar title="Scan ID for age" backHref={`/events/${slug}/claim/verify`} />
              <Content>
                <TitleBlock title="Verify your phone first">You need a verified phone before scanning your ID.</TitleBlock>
                <ButtonLink href={`/events/${slug}/claim/verify`}>Verify phone</ButtonLink>
              </Content>
            </Screen>
          );
        }

        // Prototype: the selected image is never read or uploaded. The real app sends it to a
        // protected OCR pipeline, deletes it right after, and decides eligibility on the server.
        const onFile = (input: HTMLInputElement | null) => {
          if (!input?.files?.length || expired) return;
          input.value = "";
          setPhase("processing");
          setTimeout(() => {
            if (simulateUnreadable) {
              setPhase("needs_rescan");
              setSimulateUnreadable(false);
              return;
            }
            const ids = newPassIdentifiers();
            setDraft({ ...d, ageCheck: "passed", passRef: ids.ref, passToken: ids.token });
            router.push(`/events/${slug}/claim/pass`);
          }, 1500);
        };

        return (
          <Screen>
            <AppBar title="Scan ID for age" backHref={`/events/${slug}/claim/verify`} />
            <Content>
              <Stepper flow="attendee" step={3} />
              <HoldTimer expiresAt={d.holdExpiresAt} message={phase === "needs_rescan" ? "Rescanning won’t add time to your hold." : undefined} />

              {expired ? (
                <ButtonLink href={`/events/${slug}/claim`}>Start again</ButtonLink>
              ) : phase === "needs_rescan" ? (
                <>
                  <Notice tone="warning" icon="alert" title="We couldn’t read your date of birth">
                    <p className={ui.body}>Part of the date was blurry, so we can’t check it automatically. Try again in brighter light, holding your phone steady.</p>
                  </Notice>
                  <Card label="What we read">
                    <p className={`${ui.overline} ${ui.muted}`}>What we read</p>
                    <div className={ui.row} style={{ gap: 12 }}>
                      <div className={ui.grow}>
                        <p className={`${ui.caption} ${ui.muted}`}>Name</p>
                        <p className={ui.bodyStrong}>{d.name.toUpperCase()}</p>
                      </div>
                      <Chip tone="success">Readable</Chip>
                    </div>
                    <div className={ui.row} style={{ gap: 12 }}>
                      <div className={ui.grow}>
                        <p className={`${ui.caption} ${ui.muted}`}>Date of birth</p>
                        <p className={ui.bodyStrong}>Unclear</p>
                      </div>
                      <Chip tone="warning">Unclear</Chip>
                    </div>
                  </Card>
                  <p className={`${ui.label} ${ui.muted}`}>You can’t type a correction here. A clear scan is needed before we can confirm your spot.</p>
                  <div className={ui.stack}>
                    <Button onClick={() => setPhase("ready")}>Rescan ID</Button>
                    <Button variant="ghost">Get help</Button>
                  </div>
                </>
              ) : (
                <>
                  <TitleBlock title="Scan your ID">
                    Driver’s license, state ID card or passport. We read only your name and date of birth to check you’ll be 21+ on {eventDay}.
                  </TitleBlock>
                  <div className={ui.viewfinder} aria-live="polite">
                    <div className={ui.idFrame}>
                      <Icon name="id-card" size={32} />
                      <p className={ui.label} style={{ color: "var(--color-text-primary)" }}>
                        {phase === "processing" ? "Reading your ID…" : "Fit the front of your ID in the frame"}
                      </p>
                    </div>
                  </div>
                  <div className={ui.stack} style={{ gap: 10 }}>
                    <IconRow icon="check" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
                      Bright, even light with no glare
                    </IconRow>
                    <IconRow icon="check" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
                      All four corners visible and in focus
                    </IconRow>
                    <IconRow icon="shield" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
                      The photo is deleted right after we read it
                    </IconRow>
                  </div>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={() => onFile(cameraRef.current)} />
                  <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/heic" hidden onChange={() => onFile(uploadRef.current)} />
                  <div className={ui.stack}>
                    <Button onClick={() => cameraRef.current?.click()} disabled={phase === "processing"}>
                      Take photo
                    </Button>
                    <Button variant="secondary" onClick={() => uploadRef.current?.click()} disabled={phase === "processing"}>
                      Upload a photo instead
                    </Button>
                  </div>
                  <label className={ui.checkRow} style={{ paddingTop: 0 }}>
                    <input type="checkbox" checked={simulateUnreadable} onChange={(e) => setSimulateUnreadable(e.target.checked)} />
                    <span className={`${ui.label} ${ui.muted}`}>Prototype: make the next scan unreadable</span>
                  </label>
                  <p className={`${ui.caption} ${ui.muted}`}>
                    This checks age eligibility from your scanned ID. It isn’t identity verification. Staff will still check your physical ID at the door.
                  </p>
                </>
              )}
            </Content>
          </Screen>
        );
      }}
    </ClaimGate>
  );
}
