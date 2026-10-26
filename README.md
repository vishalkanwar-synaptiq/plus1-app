# Plus1 App

A mobile-first web app that lets venues publish free guest-list spots, lets people 21 and over claim one, and lets door staff check them in.

The product spec lives in [`Context and Markdown files/guest-list-app-baseline-requirements.md`](Context%20and%20Markdown%20files/guest-list-app-baseline-requirements.md). The design is in Figma: [261023-Plus1-App](https://www.figma.com/design/nkCYJuoRKLeAX5l7BdSuMU).

## Status: clickable UI prototype

This first pass builds every screen from the Figma file with **sample data and no backend**. A yellow bar on every screen labels it as a prototype.

| Works now | Not built yet |
| --- | --- |
| All attendee, door-staff and venue screens, dark and light themes | Database, server-side holds and capacity locking |
| Event search and date filter, kept in the URL | Real SMS sending and phone verification |
| Claim form validation, including the early 21+ check in the event's time zone | OCR on ID photos (the chosen photo is never read or uploaded) |
| 10-minute hold countdown, code entry, ID scan states, saved pass with QR code | Staff and venue sign-in and permissions |
| Door flow: pass lookup, 2-minute door code, both confirmations, check-in, invalid passes | Data retention jobs, rate limits, audit logs |

Prototype shortcuts, all clearly labelled in the UI:

- Any 6-digit phone code works. `000000` shows the wrong-code path.
- On the ID scan step, tick "make the next scan unreadable" to see the rescan state.
- Door staff can open sample passes (valid, already checked in, canceled, different event, unknown) from the scan screen.
- Claim progress is kept in `sessionStorage` for the current tab only. Birth dates are never stored.

## Getting started

Requires Node.js 20.9 or later (developed on Node 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000. The links in the prototype bar switch between the guest, door and venue areas, and toggle light mode.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Builds the design tokens, then starts the dev server |
| `npm run build` | Builds the design tokens, then makes a production build |
| `npm start` | Serves the production build |
| `npm test` | Runs the unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run tokens` | Regenerates `src/styles/tokens.css` from the token source |

## Design tokens

`tokens/design.tokens.json` is the single source, in the DTCG 2025.10 format. It matches the Figma variables:

- `color.*` are shared primitives.
- `theme.dark.*` and `theme.light.*` are semantic colors that alias primitives. Dark is the default.
- `space`, `radius` and `size` hold dimensions.
- `font` holds the Lato font stack, weights, letter spacing, and the Tailwind CSS default type scale (`font.size.xs` to `font.size.9xl`, each with a matching `font.lineHeight`).

Text styles match the Figma file and map to the scale like this:

| Tailwind step | Style | Used for |
| --- | --- | --- |
| `xs` 12/16 | Caption, Overline | Helper text, metadata, section labels |
| `sm` 14/20 | Label, Reference | Field labels, chips, pass references |
| `base` 16/24 | Body, Body strong | Body copy, inputs, buttons |
| `lg` 18/28 | H6 Heading | App bar titles, card headings, hold countdown |
| `xl` 20/28 | H5 Title | Screen titles, code-entry digits |
| `3xl` 30/36 | H3 Display | Page heroes, big status titles |
| `4xl` 36/40 | H2 Code | The door code on the staff screen |

The other steps (`2xl`, `5xl` to `9xl`) exist as tokens for future headings and display text.

`scripts/build-tokens.mjs` validates the file and writes `src/styles/tokens.css` (generated, not committed). The build fails on unknown or mistyped references, legacy `value` keys, invalid colors or dimensions, or themes that don't define the same tokens. Components use only the generated CSS variables.

Lato is the only typeface. It's served from the app via the `lato-font` package (SIL Open Font License), including the Medium and SemiBold weights.

## Project layout

```
src/app/                    Routes (Next.js App Router)
  page.tsx                  Discover events
  events/[slug]/            Event details
  events/[slug]/claim/      Your details → verify → scan-id → pass
  my-guest-list/            Find saved passes by phone
  passes/[ref]/             A saved pass
  staff/                    Door: scan or look up a pass
  staff/passes/[ref]/       Door: send code, compare, check in
  venue/                    Venue dashboard
src/components/             Shared UI matching the Figma components
src/lib/                    Age rules, phone formatting, sample data, prototype state
tokens/                     DTCG token source
scripts/                    Token build and its tests
```

## Tests

`npm test` covers:

- Age rules: exactly 21 on the event day passes, a birthday the next day fails, Feb 29 cases, impossible and future dates, and the event's local date near midnight UTC.
- Phone numbers: normalizing to E.164 and masking.
- Tokens: CSS output for both themes, and build failures for bad references, type mismatches, legacy `value` keys and mismatched themes.

Browser end-to-end tests (spec section 12) come with the server work.

## Next steps

Following the spec's build order (section 14), the next pass adds the server:

1. PostgreSQL schema and migrations with a typed database layer. Local development will use embedded Postgres (PGlite), so nothing needs installing; production uses a real `DATABASE_URL`.
2. Atomic 10-minute holds and claim states.
3. SMS adapter for phone verification, recovery and door codes, with a labelled local mock that production refuses.
4. OCR adapter for the age check, with immediate image deletion.
5. Invite-only staff accounts with venue-scoped permissions.
6. Retention jobs, rate limits, audit logs and the acceptance tests.

`.env.example` lists the environment variables those steps will need.
