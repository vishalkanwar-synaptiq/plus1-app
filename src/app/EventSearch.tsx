"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { Icon } from "@/components/Icon";
import { ui } from "@/components/ui";
import { eventLocalIsoDate, shortDate } from "@/lib/format";
import { EVENTS } from "@/lib/sample-data";

// Only published and canceled events are listed; drafts and ended events are not.
const LISTED = EVENTS.filter((e) => e.status === "published" || e.status === "paused" || e.status === "canceled");

export function EventSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const date = params.get("date") ?? "";

  const dates = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of LISTED) seen.set(eventLocalIsoDate(e), shortDate(e.startsAt, e.timeZone));
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LISTED.filter((e) => (!q || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)) && (!date || eventLocalIsoDate(e) === date));
  }, [query, date]);

  // Search state lives in the URL so results can be shared and survive reloads.
  const setParam = (key: "q" | "date", value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const summary = query || date ? `${results.length} ${results.length === 1 ? "event matches" : "events match"}` : `${results.length} events`;

  return (
    <>
      <div className={ui.search} role="search">
        <Icon name="search" size={20} />
        <label htmlFor="event-search" className="visually-hidden">
          Search events or venues
        </label>
        <input
          id="event-search"
          type="search"
          placeholder="Search events or venues"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setParam("q", e.target.value.trim());
          }}
        />
        {query && (
          <button
            type="button"
            className={ui.iconButton}
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setParam("q", "");
            }}
          >
            <Icon name="x" size={20} />
          </button>
        )}
      </div>

      <div className={ui.row} style={{ justifyContent: "space-between" }}>
        <span className={ui.pillSelectWrap}>
          <Icon name="calendar" size={18} />
          <label htmlFor="date-filter" className="visually-hidden">
            Date
          </label>
          <select id="date-filter" className={ui.pillSelect} value={date} onChange={(e) => setParam("date", e.target.value)}>
            <option value="">Any date</option>
            {dates.map(([iso, label]) => (
              <option key={iso} value={iso}>
                {label}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={16} />
        </span>
        <p className={`${ui.caption} ${ui.muted}`} aria-live="polite">
          {summary}
        </p>
      </div>

      {results.length === 0 ? (
        <div className={ui.card} style={{ alignItems: "flex-start" }}>
          <p className={ui.heading}>No events match</p>
          <p className={`${ui.body} ${ui.muted}`}>Try a different name or venue, or choose Any date.</p>
        </div>
      ) : (
        <ul className={ui.stackMedium} style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {results.map((e) => (
            <li key={e.slug}>
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
