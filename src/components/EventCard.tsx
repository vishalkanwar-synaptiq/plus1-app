import Link from "next/link";
import { availabilityStatus, type GuestListEvent } from "@/lib/sample-data";
import { shortDateTime, time } from "@/lib/format";
import { Icon } from "./Icon";
import { Chip } from "./ui";
import s from "./ui.module.css";

export function EventCard({ event }: { event: GuestListEvent }) {
  const status = availabilityStatus(event);
  const footer =
    event.status === "canceled"
      ? "This event was canceled"
      : status.label === "Sold out"
        ? "Spots may open if guests cancel"
        : `Claims close ${time(event.claimsCloseAt, event.timeZone)}`;

  return (
    <Link href={`/events/${event.slug}`} className={s.eventCard}>
      {event.hasImage && <div className={s.eventImage} aria-hidden="true" />}
      <div className={s.eventBody}>
        <span>
          <Chip tone={status.tone}>{status.label}</Chip>
        </span>
        <h3 className={s.heading}>{event.name}</h3>
        <p className={s.meta}>
          <Icon name="calendar" size={16} />
          {shortDateTime(event.startsAt, event.timeZone)}
        </p>
        <p className={s.meta}>
          <Icon name="map-pin" size={16} />
          {event.venue} · {event.neighborhood}
        </p>
        <div className={s.eventFooter}>
          <span className={`${s.caption} ${s.muted}`}>{footer}</span>
          <span className={`${s.label} ${s.accent} ${s.row}`} style={{ gap: 2 }}>
            View event <Icon name="chevron-right" size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
