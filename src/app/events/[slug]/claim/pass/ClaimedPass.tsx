"use client";

import { PassView } from "@/components/PassView";
import { AppBar, ButtonLink, Content, Screen, TitleBlock } from "@/components/ui";
import { useClaimDraft } from "@/lib/claim-store";
import type { GuestListEvent } from "@/lib/sample-data";
import { ClaimGate } from "../ClaimGate";

export function ClaimedPass({ event }: { event: GuestListEvent }) {
  const [draft, setDraft] = useClaimDraft(event.slug);

  return (
    <ClaimGate draft={draft} slug={event.slug} title="Your pass">
      {(d) =>
        d.ageCheck !== "passed" || !d.passRef || !d.passToken ? (
          // Never show a pass before the phone and age checks are complete.
          <Screen>
            <AppBar title="Your pass" backHref={`/events/${event.slug}/claim/scan-id`} />
            <Content>
              <TitleBlock title="Your spot isn’t confirmed yet">Finish verifying your phone and scanning your ID first.</TitleBlock>
              <ButtonLink href={`/events/${event.slug}/claim/scan-id`}>Continue</ButtonLink>
            </Content>
          </Screen>
        ) : (
          <PassView
            event={event}
            name={d.name}
            passRef={d.passRef}
            token={d.passToken}
            status="confirmed"
            showStepper
            justConfirmed
            onCancel={() => setDraft(null)}
          />
        )
      }
    </ClaimGate>
  );
}
