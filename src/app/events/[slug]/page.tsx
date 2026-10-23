import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ScreenFallback } from "@/components/ScreenFallback";
import { AppBar, ButtonLink, Card, Chip, Content, IconRow, Screen, ui } from "@/components/ui";
import { admissionWindow, longDateTime, time, timeZoneLabel } from "@/lib/format";
import { EVENTS, availabilityStatus, availableSpots, canClaim, getEvent } from "@/lib/sample-data";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default function EventDetailsPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <Suspense fallback={<ScreenFallback />}>
      <EventDetails params={params} />
    </Suspense>
  );
}

async function EventDetails({ params }: { params: PageProps<"/events/[slug]">["params"] }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const status = availabilityStatus(event);
  const claimable = canClaim(event);
  const left = availableSpots(event);

  return (
    <Screen>
      <AppBar title="Event details" backHref="/" />
      <div className={`${ui.eventImage} ${ui.eventImageHero}`} aria-hidden="true" />
      <Content>
        <div className={ui.stack} style={{ paddingTop: 16 }}>
          <div className={ui.rowWrap}>
            <Chip tone="accent">21+ only</Chip>
            <Chip tone={status.tone}>{event.status === "published" && left > 0 ? `${left} of ${event.allocation} spots left` : status.label}</Chip>
          </div>
          <h1 className={ui.display}>{event.name}</h1>
          <p className={`${ui.bodyStrong} ${ui.muted}`}>{event.venue}</p>
        </div>

        <Card>
          <IconRow icon="calendar">
            {longDateTime(event.startsAt, event.timeZone)}
            <br />
            {timeZoneLabel(event.startsAt, event.timeZone)}
          </IconRow>
          <IconRow icon="clock">
            Entry {admissionWindow(event)} · Claims close {time(event.claimsCloseAt, event.timeZone)}
          </IconRow>
          <IconRow icon="map-pin">{event.address}</IconRow>
        </Card>

        <section className={ui.stack}>
          <h2 className={ui.heading}>What’s included</h2>
          <p className={`${ui.body} ${ui.muted}`}>{event.offer}</p>
        </section>

        <Card raised label="Before you claim">
          <h2 className={ui.heading}>Before you claim</h2>
          <p className={ui.body}>
            You’ll need a mobile phone that can receive texts and a photo of your government-issued ID. We’ll read the date of birth on the ID to check age eligibility. Bring
            your physical ID and phone for entry.
          </p>
          <IconRow icon="clock" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
            We hold your spot for 10 minutes once you submit your details. Resending a code or rescanning won’t add time.
          </IconRow>
          <IconRow icon="message" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
            At the door, staff will text a new code to your phone. Show it with your physical ID.
          </IconRow>
          <IconRow icon="shield" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
            One spot per person. No plus-ones.
          </IconRow>
        </Card>

        <section className={ui.stack}>
          <h2 className={ui.heading}>Entry conditions</h2>
          <p className={`${ui.body} ${ui.muted}`}>{event.conditions}</p>
        </section>
      </Content>

      <div className={ui.bottomBar}>
        {claimable ? (
          <ButtonLink href={`/events/${event.slug}/claim`}>Claim a spot</ButtonLink>
        ) : (
          <button type="button" className={`${ui.button} ${ui.primary}`} disabled>
            {event.status === "canceled" ? "Event canceled" : event.status === "completed" ? "Event has ended" : event.status === "paused" ? "Claims paused" : "Sold out"}
          </button>
        )}
        <p className={`${ui.caption} ${ui.muted} ${ui.center}`}>
          {claimable ? (
            "Free · 21+ on the event date"
          ) : (
            <>
              <Icon name="alert" size={14} /> This event isn’t accepting claims.
            </>
          )}
        </p>
      </div>
    </Screen>
  );
}
