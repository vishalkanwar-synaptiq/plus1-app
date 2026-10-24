"use client";

import type { ReactNode } from "react";
import { AppBar, ButtonLink, Content, Screen, TitleBlock } from "@/components/ui";
import type { ClaimDraft } from "@/lib/claim-store";

/** Handles the "still loading" and "no claim in progress" cases shared by the claim steps. */
export function ClaimGate({ draft, slug, title, children }: { draft: ClaimDraft | null | undefined; slug: string; title: string; children: (d: ClaimDraft) => ReactNode }) {
  if (draft === undefined) {
    return (
      <Screen>
        <AppBar title={title} backHref={`/events/${slug}`} />
      </Screen>
    );
  }
  if (draft === null) {
    return (
      <Screen>
        <AppBar title={title} backHref={`/events/${slug}`} />
        <Content>
          <TitleBlock title="No claim in progress">Start from the event page to hold a spot.</TitleBlock>
          <ButtonLink href={`/events/${slug}/claim`}>Start a claim</ButtonLink>
        </Content>
      </Screen>
    );
  }
  return <>{children(draft)}</>;
}
