"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeInput } from "@/components/CodeInput";
import { HoldTimer } from "@/components/HoldTimer";
import { Icon } from "@/components/Icon";
import { AppBar, Button, ButtonLink, Content, Screen, Stepper, TitleBlock, ui } from "@/components/ui";
import { HOLD_SECONDS, useClaimDraft } from "@/lib/claim-store";
import { mss } from "@/lib/format";
import { maskPhone } from "@/lib/phone";
import { useCountdown } from "@/lib/use-countdown";
import { ClaimGate } from "../ClaimGate";

const CODE_SECONDS = 5 * 60;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export function VerifyPhone({ slug }: { slug: string }) {
  const router = useRouter();
  const [draft, setDraft] = useClaimDraft(slug);
  const [code, setCode] = useState("");
  // The first code goes out when the hold starts; a resend replaces it.
  const [resentAt, setResentAt] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sentAt = resentAt ?? (draft ? draft.holdExpiresAt - HOLD_SECONDS * 1000 : null);
  const codeLeft = useCountdown(sentAt == null ? null : sentAt + CODE_SECONDS * 1000);
  const resendLeft = useCountdown(sentAt == null ? null : sentAt + RESEND_SECONDS * 1000);
  const holdLeft = useCountdown(draft?.holdExpiresAt);

  return (
    <ClaimGate draft={draft} slug={slug} title="Verify phone">
      {(d) => {
        const expired = holdLeft === 0;
        const locked = attempts >= MAX_ATTEMPTS;
        const codeExpired = codeLeft === 0;

        const verify = () => {
          if (code.length !== 6 || expired) return;
          // Prototype: any six digits pass except 000000, which shows the wrong-code path.
          if (code === "000000") {
            const used = attempts + 1;
            setAttempts(used);
            setCode("");
            setError(used >= MAX_ATTEMPTS ? "Too many tries. Request a new code." : `That code didn’t match. ${MAX_ATTEMPTS - used} tries left.`);
            return;
          }
          setDraft({ ...d, phoneVerified: true });
          router.push(`/events/${slug}/claim/scan-id`);
        };

        const resend = () => {
          // A new code replaces the old one. It never extends the 10-minute hold.
          setResentAt(Date.now());
          setAttempts(0);
          setCode("");
          setError(null);
        };

        return (
          <Screen>
            <AppBar title="Verify phone" backHref={`/events/${slug}/claim`} />
            <Content>
              <Stepper flow="attendee" step={2} />
              <HoldTimer expiresAt={d.holdExpiresAt} />
              {expired ? (
                <ButtonLink href={`/events/${slug}/claim`}>Start again</ButtonLink>
              ) : (
                <>
                  <TitleBlock title="Enter the code we texted">
                    Sent to {maskPhone(d.phone)}. You can also tap the link in the text, then confirm on the page it opens.
                  </TitleBlock>
                  <CodeInput value={code} onChange={(v) => { setCode(v); setError(null); }} describedBy="code-help" />
                  <div id="code-help" className={ui.stack} style={{ gap: 4 }}>
                    {error ? (
                      <p className={`${ui.help} ${ui.error}`} role="alert">
                        <Icon name="alert" size={16} />
                        {error}
                      </p>
                    ) : (
                      <p className={`${ui.caption} ${ui.muted}`}>
                        {codeExpired ? "This code has expired. Request a new one." : `Code expires in ${mss(codeLeft ?? CODE_SECONDS)} · ${MAX_ATTEMPTS - attempts} tries left`}
                      </p>
                    )}
                    <p className={`${ui.caption} ${ui.muted}`}>Prototype: any 6 digits work. 000000 shows a wrong-code error.</p>
                  </div>
                  {resendLeft === 0 ? (
                    <Button variant="ghost" onClick={resend}>
                      Resend code
                    </Button>
                  ) : (
                    <p className={`${ui.label} ${ui.muted}`}>Resend code in {mss(resendLeft ?? RESEND_SECONDS)}</p>
                  )}
                  <ButtonLink
                    variant="ghost"
                    href={`/events/${slug}/claim`}
                    onClick={() => setDraft(null)}
                  >
                    Change number
                  </ButtonLink>
                  <div style={{ flex: 1 }} />
                  <Button onClick={verify} disabled={code.length !== 6 || locked || codeExpired}>
                    Verify phone
                  </Button>
                  <p className={`${ui.caption} ${ui.muted} ${ui.center}`}>Changing your number cancels this code. You’ll need to verify the new number.</p>
                </>
              )}
            </Content>
          </Screen>
        );
      }}
    </ClaimGate>
  );
}
