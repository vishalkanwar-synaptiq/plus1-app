import { AppBar, Button, Card, Chip, Content, IconRow, Screen, initials, ui } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { shortDate, time } from "@/lib/format";
import { maskPhone } from "@/lib/phone";
import { DASHBOARD_ATTENDEES, DOOR_EVENT_SLUG, availableSpots, getEvent } from "@/lib/sample-data";

export default function VenueDashboardPage() {
  const event = getEvent(DOOR_EVENT_SLUG)!;
  const totals: [string, number][] = [
    ["Allocation", event.allocation],
    ["Available", availableSpots(event)],
    ["Held now", event.held],
    ["Confirmed", event.confirmed],
    ["Checked in", event.checkedIn],
    ["Canceled", event.canceledClaims],
  ];

  return (
    <Screen>
      <AppBar title={event.name} backHref="/" />
      <Content>
        <div className={ui.row}>
          <Chip tone="success">Published</Chip>
          <p className={`${ui.caption} ${ui.muted}`}>
            {shortDate(event.startsAt, event.timeZone)} · Claims close {time(event.claimsCloseAt, event.timeZone)}
          </p>
        </div>

        <dl className={ui.statGrid} style={{ margin: 0 }}>
          {totals.map(([label, value]) => (
            <div key={label} className={ui.stat}>
              <dt className={`${ui.caption} ${ui.muted}`} style={{ order: 2 }}>
                {label}
              </dt>
              <dd className={ui.title} style={{ margin: 0, order: 1 }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <section className={ui.stackMedium}>
          <div className={ui.row} style={{ justifyContent: "space-between" }}>
            <h2 className={ui.heading}>Attendees</h2>
            <p className={`${ui.caption} ${ui.muted}`}>{event.confirmed + event.held} active</p>
          </div>
          <div className={ui.search}>
            <Icon name="search" size={20} />
            <label htmlFor="attendee-search" className="visually-hidden">
              Search by name or reference
            </label>
            <input id="attendee-search" type="search" placeholder="Search by name or reference" />
          </div>
          <ul className={ui.list}>
            {DASHBOARD_ATTENDEES.map((a) => (
              <li key={a.name} className={ui.attendeeRow}>
                <span className={ui.avatar} aria-hidden="true">
                  {initials(a.name)}
                </span>
                <span className={ui.grow}>
                  <span className={ui.bodyStrong} style={{ display: "block" }}>
                    {a.name}
                  </span>
                  <span className={`${ui.caption} ${ui.muted}`}>
                    {maskPhone(a.phone)} · {a.detail}
                  </span>
                </span>
                <Chip tone={a.tone}>{a.label}</Chip>
              </li>
            ))}
          </ul>
        </section>

        <Card raised>
          <IconRow icon="shield" iconClass={ui.accent} textClass={`${ui.label} ${ui.muted}`}>
            Birth dates, ID images and scanned text are never shown here.
          </IconRow>
        </Card>

        <div className={ui.split}>
          <Button variant="secondary" compact>
            Edit event
          </Button>
          <Button variant="secondary" compact>
            Pause claims
          </Button>
        </div>
      </Content>
    </Screen>
  );
}
