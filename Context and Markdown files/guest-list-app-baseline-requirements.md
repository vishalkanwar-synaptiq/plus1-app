# Product requirements: mobile guest-list app

Version: 2 — revised MVP baseline
Updated: October 23, 2026
Audience: Claude Code and product/engineering collaborators

## Revision summary and precedence

This document replaces the previous baseline in full.
- Remove all email collection, verification, delivery, recovery, and marketing from MVP. Email is future scope.
- Replace identity-verification services with optical character recognition (OCR) to extract name and date of birth from an uploaded state-issued ID or passport, then calculate age eligibility.
- Hold spots for 10 minutes during the claim process.
- Add a door challenge: staff scan a QR pass, send a fresh confirmation code to the attendee's previously verified mobile number, compare it with the same code displayed on the staff device, and explicitly complete check-in.

Important limitation: OCR extracts text; it does not authenticate a document or prove that the presenter owns it. Describe the result as “age eligibility based on scanned ID,” not “identity verified.” Physical-ID inspection and comparison at entry remain required. SMS establishes access to a phone number, not legal identity.

## 1. Product objective

Build a small, mobile-first web app connecting venue marketing teams with prospective attendees through limited, complimentary guest-list offers.

Required journey:
1. Venue publishes an event and allocates spots.
2. Attendee searches by event name, venue name, or date.
3. Attendee enters full name, mobile number, and date of birth.
4. A 10-minute capacity hold starts after valid form submission.
5. Attendee verifies mobile access by SMS code or confirmation link.
6. Attendee photographs or uploads an ID or passport for OCR extraction.
7. Server compares extracted information and calculates age on the local event date.
8. Server confirms the claim only if all checks pass and capacity exists.
9. App saves a retrievable QR admission pass.
10. At entry, authorized staff scan the QR and send a new SMS door code.
11. Staff compare the attendee's received code against the staff-device code, inspect physical ID, and explicitly check in the attendee.

A successful claim represents a real reserved spot, not a form submission.

## 2. Scope and defaults

- Responsive web app, mobile-first.
- Passwordless attendee access using mobile number only.
- Invite-only venue staff accounts. Bootstrap access through an administrator and phone-based authentication; no email dependency in MVP.
- One spot per attendee per event; no plus-ones or payments.
- Required attendee fields: full name, mobile number with country code, date of birth.
- Do not collect email in forms, APIs, database fields, integrations, analytics, or seed data for MVP.
- SMS verification is mandatory for claiming and recovery.
- Age threshold: at least 21 on the event's local calendar date.
- Documents: supported state-issued driver's licenses, state-issued ID cards, and passports.
- OCR only; no authenticity service, selfie, face match, biometrics, or identity-verification provider.
- Capacity hold: exactly 10 minutes from server creation; no automatic extension on resend or OCR retry.
- Online door validation plus phone-code comparison and physical-ID check.
- Server-saved passes, accessible from My guest list.
- Optional SMS marketing consent, separate from claiming.
- No public attendee information.

## 3. Roles and permissions

### Attendee
Browse published events anonymously; start/resume a claim; verify phone; scan ID; retrieve own passes; cancel own unredeemed claims. Cannot view others' information or staff administration.

### Venue marketer
Manage events and allocations for assigned venues; publish/pause/cancel; see claim/attendance totals; view permitted names and mobile numbers with verification status. Cannot view ID images, document numbers, raw OCR, or birth dates.

### Door staff
View assigned venue events; scan/search passes; send door codes; compare current codes; record physical-ID confirmation; complete check-in. Show masked phone number only. No marketing exports, full contact data, birth dates, or documents.

Enforce all permissions server-side with venue scoping. Authentication alone is insufficient authorization.

## 4. Attendee experience

### 4.1 Discovery
Search event and venue names case-insensitively. Date filter defaults to Any date. Combine filters; persist in URL.
Cards: event/venue name, local date/time, city/neighborhood, availability, admission deadline if any, View event.
Sold-out events remain visible. Canceled/unpublished events accept no claims. Include loading, empty, no-results, error states. No attendee data in public responses.

### 4.2 Event details
Show name, optional image, venue/address, date/time/time zone, admission window, offer/inclusions, 21+ requirement, availability, conditions, Claim a spot.
Disclose before claiming:
“You’ll need a mobile phone that can receive texts and a photo of your government-issued ID. We’ll read the date of birth on the ID to check age eligibility. Bring your physical ID and phone for entry.”
Show the 10-minute hold policy before submission. Explain that another SMS code is required at the door.

### 4.3 Claim form
Required: full name as on ID, mobile including country code, date of birth. No email field.
Use mobile input types/autocomplete; permit international names and punctuation; normalize phones to E.164; store birth date as date-only. Explain data collection. Validate server-side with inline errors.
Run an early age check before OCR, but treat entered date as unverified. Required acknowledgments: guest-list terms, privacy notice, OCR processing, transactional SMS for verification/recovery/admission. Separate optional unchecked SMS marketing consent; no marketing consent required to claim.

### 4.4 Ten-minute hold
Create atomically after valid required form submission, before SMS/OCR. Display server-based expiry and remaining time throughout verification. Explain imminent expiration. Reload/resume does not reset it. SMS resend and OCR retries do not extend it. Cancel/expiry releases capacity.
Do not start an OCR upload if hold already expired without clearly obtaining a new available hold. Work already in progress may finish, but final confirmation always rechecks capacity.

### 4.5 Phone verification
Send an SMS containing a one-time code and confirmation link.
- Six-digit cryptographically random code; five-minute validity as proposed default.
- Five failed attempts maximum; 60-second resend cooldown.
- Additional destination/session/IP limits and SMS-spend protection.
- Code and link share one challenge; using either invalidates both.
- Use protected secret representations; never log codes/tokens.
- Link opens a confirmation page; require explicit action so previews do not consume it.
- Correcting the number invalidates old challenges and requires fresh verification.
- Expiration/resend does not extend the capacity hold.
- Never infer verification from sending/delivery success.

### 4.6 OCR-based age eligibility
Capture/upload state ID, driver's license, or passport. Extract full name and birth date with OCR. This is text extraction, not document or identity authentication.

Required behavior:
- Camera capture and file selection where supported; clear framing/lighting guidance.
- Configurable supported formats and size limits; validate MIME signature, size, and image decoding server-side.
- Extract required fields with confidence/ambiguity indicators.
- Normalize dates using document context, not an assumed universal date format.
- Compare entered birth date with extracted birth date.
- Require reasonable name consistency; punctuation/case differences may normalize, uncertain cases require rescan.
- Low-confidence, missing, impossible, conflicting, or ambiguous dates cannot pass automatically.
- Allow rescan; never let a typed correction bypass unresolved OCR.
- No general-purpose manual review console in MVP. Unresolved scans block confirmation and offer retry/support guidance.
- Do not use an LLM as the sole authority for date extraction or age decisions.
- Use server-side eligibility calculation with validated extraction results. Do not trust editable client results.
- Show not_started, processing, needs_rescan, passed, failed, unavailable states.
- No identity_verified or document_authentic flags anywhere.
- Fail safely during OCR outages; no simulated production success.

Minimize extraction to name and birth date. Do not persist extra extracted addresses, document numbers, raw text, or images.

#### Age calculation
```
eligibility_cutoff = event_local_date minus 21 calendar years
eligible = extracted_date_of_birth <= eligibility_cutoff
```
Exactly 21 that day passes; turning 21 the next day fails. Use calendar arithmetic and event IANA time zone, never a fixed day count or browser time zone. Reject future/impossible dates. Test leap days; proposed policy is March 1 for February 29 birthdays in non-leap years, subject to jurisdiction-specific review.
On event-date changes, re-evaluate existing claims; revoke newly ineligible passes and notify by SMS.

### 4.7 Confirmation and saved pass
Confirm only if phone verified, OCR eligibility passed, capacity available, and claim not expired/canceled/duplicated. If original hold expired, use the late-completion rule in section 5.
Show: You’re on the guest list; name; event/venue; local date/time; window/deadline; one-person admission; reference; QR; current status; conditions; physical-ID/phone reminder; View my guest list; Cancel my spot.
Send SMS with secure pass-access link. No birth dates, ID images, or raw OCR in SMS.
Pass is server-saved, not local-storage-only. Screenshots are presentation aids, not authoritative admission.
Disclose: “At the door, staff will send a code to your verified phone. Show them the received code and your physical ID.”

### 4.8 Recovery
Find my guest list: enter phone, receive fresh recovery SMS code/link, verify, view saved passes. Generic request response avoids enumeration. Rate-limit recovery. No email fallback.
Changing a verified phone requires authenticated account access and verification of the new number; revoke outstanding recovery and door challenges. No unauthenticated number replacement using a QR or name. MVP has no self-service lost-number bypass.

## 5. Capacity, lifecycle, duplicates

### Capacity
Track allocation, active holds, confirmed spots including checked-in claims, and available spots.
```
available = allocation - active_holds - confirmed_spots
```
Use transactions and row locks or equivalent atomic allocation. Concurrent last-spot requests cannot both succeed. Confirming a hold converts it to confirmed without double counting.
Expired holds release capacity automatically; allocation decisions must treat expired holds as inactive even before cleanup runs. Canceling unredeemed confirmed claims releases capacity. Checked-in claims retain capacity. Cannot reduce allocation below confirmed plus active holds. Pausing prevents new holds but preserves valid confirmed passes.

Late completion: atomically claim remaining capacity if verification completes after expiry; if full, say “Your age check is complete, but this event is now full.” Never issue a pass without capacity. Do not silently restart a hold timer.

### Independent states
- Claim: held, confirmed, expired, canceled, revoked.
- Phone verification: unverified, pending, verified, failed.
- OCR: not_started, processing, needs_rescan, passed, failed, unavailable.
- Door challenge: pending_delivery, active, matched, expired, superseded, failed, consumed.
- Admission: not_checked_in, checked_in.
Record transitions, actors, and timestamps.

### Duplicates
One confirmed claim per attendee/event; unique attendee/event constraint, normalized verified phone checks, idempotency on submissions. Do not claim this guarantees one real human per event; people may control multiple numbers and OCR does not prove identity.

## 6. Venue administration

Event fields: name, venue, description, address, local date/start time, IANA time zone, admission window, claim closing time, nonnegative allocation, entry conditions, optional image.
States: draft, published, paused, canceled, completed.
Validate logical windows and closing time no later than admission deadline; mandatory fields before publishing. Date/condition edits require confirmation and SMS notification. Closing time blocks new claims; define existing-hold handling clearly in UI and server rules (default: existing holds may finish until their expiry, but never beyond admission deadline).
Dashboard: allocation, available, held, confirmed, checked-in, canceled. Attendee rows: name, masked/permitted mobile, phone status, claim timestamp/status, OCR eligibility result (not identity verification), check-in status. Exclude birth dates/raw OCR/documents.
No marketing export in MVP; future export must preserve SMS consent/verification status.

## 7. Door QR scan and phone-code comparison

### Staff flow
1. Authenticated venue-authorized staff select event and scan QR (or search reference/name).
2. Server validates event/venue, confirmed claim, admission window, cancellation/revocation, and check-in status.
3. For a valid unredeemed claim, staff tap Send confirmation code. Scanning alone does not redeem the pass or automatically trigger unlimited SMS.
4. Server creates a fresh door challenge bound to claim, event, current verified phone, and requesting staff session. It sends an SMS with a six-digit code, event/venue label, and short expiration notice.
5. The staff device displays the same code, masked destination, delivery status, expiry countdown, and challenge status in an authenticated staff-only view.
6. Attendee shows the received SMS on their phone. Staff visually compare the code to their device and check physical ID against the attendee/name and age requirement.
7. Staff select Codes match and Physical ID checked, then tap Check in.
8. Server revalidates claim, challenge, staff authorization, expiration, and check-in state; atomically consumes the challenge and records one redemption.

The attendee pass screen and public QR endpoints must never display or return the door code. A screenshot or forwarded QR alone must not expose it. The SMS must go to the claim's verified number, never a number supplied at the door by the scanner request.

This is staff-attested visual comparison, not independent cryptographic proof that the attendee received the SMS: staff can see the expected code. Audit the attestation and do not describe it as automated possession verification.

### Challenge defaults
- Six-digit cryptographically random code.
- Two-minute lifetime from server challenge creation.
- Single use; at most one active door challenge per claim.
- 60-second resend cooldown; five sends per claim per 15 minutes as initial configurable default, plus staff/venue/IP/destination limits.
- Resend supersedes all prior codes; delayed older messages cannot be used.
- A second staff session cannot retrieve another session's active code. Show challenge-in-progress; deliberate authorized resend creates a new challenge and invalidates the old one globally.
- Display delivery pending/sent/failed accurately; delivery receipt alone never completes admission.
- No logs, analytics, URLs, SMS webhooks, or audit records containing plaintext codes.
- Because staff must see the code, retain a short-lived encrypted representation accessible only to the bound authorized session; keep a protected comparison value and delete encrypted display material at consumption/expiry. Do not attempt to recover plaintext from a hash.
- Code visibility must end at expiry, supersession, cancellation, or redemption.

### Results and failures
- Already redeemed: show check-in time; block another check-in.
- Wrong venue/event, unknown, canceled, revoked: reject with reason appropriate to staff.
- Outside window: explain; no automatic admission.
- Mismatch/expired: do not check in; allow controlled resend.
- SMS failure, no phone access, no signal, or network outage: no automated admission; explain limitation. MVP has no bypass. Any venue exception procedure is outside the app and must not mark a normal successful verified check-in.
- QR valid alone: not sufficient for admission.

Provide camera scanner, manual reference entry, and name search. All paths require the same phone-code and physical-ID steps. Atomic check-in across devices; one success only. Venue entry conditions still apply.

## 8. Privacy, security, retention

### Sensitive data
Process images transiently in protected OCR pipeline. Do not put images in public storage, logs, analytics, backups, or error reports. For external OCR, require suitable data-processing terms and provider controls disabling retention/training where available. Disclose provider processing. Never claim no provider retention without verifying configuration.
Delete temporary image data immediately on processing success/failure and within a proposed hard 15-minute cleanup limit for interrupted jobs. No persistent raw OCR text, document numbers, addresses, selfies, biometrics, or documents.
Retain protected birth date only for eligibility and event-date changes; encrypt and restrict server access. Normal staff/attendee APIs exclude it. Record extraction outcome, eligible status, OCR engine/version, processing timestamps, and deletion completion without raw text.
No sensitive service-worker caching. No phone numbers, birth dates, tokens, or codes in analytics.

### Proposed retention; subject to privacy/legal review
- Images: transient only, immediate deletion after OCR; interrupted-job cleanup within 15 minutes. Confirm external-provider behavior separately.
- Raw OCR: do not persist.
- Birth date: event plus 30-day support window, then delete.
- Claim/contact: event plus 90 days unless another disclosed purpose justifies retention.
- Door-code encrypted display material: delete at use/expiry/supersession.
- Minimal door challenge audit metadata: claim support window; never code values.
- Marketing records: separate consent/deletion policy.
- Security logs: minimized under documented retention.
Support deletion requests and record completion, including external OCR deletion where applicable.

### Security controls
HTTPS; secure HTTP-only sessions; applicable CSRF protection; server validation; parameterized queries; venue-scoped authorization; anti-abuse limits and SMS budget alerts; environment secrets; no real personal data in source control; signed SMS callbacks; idempotent jobs; audit event edits, revocations, staff access, code sends, comparison attestations, physical-ID attestations, check-in.
Production review: privacy notices, OCR processing contracts, age rules, transactional/marketing messaging, phone-based recovery limitations. No compliance guarantees.

## 9. DTCG-compatible design system

DTCG is a design-token exchange format, not a requirements format. Use stable 2025.10 conventions.
Layers: primitive, semantic, component only as needed. Source tokens/design.tokens.json; generate CSS custom properties; components consume generated variables.

```json
{
  "$description": "Guest-list app design tokens",
  "color": {
    "$type": "color",
    "white": { "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "alpha": 1 } },
    "ink": { "$value": { "colorSpace": "srgb", "components": [0.067, 0.094, 0.153], "alpha": 1 } },
    "brand": { "$value": { "colorSpace": "srgb", "components": [0.263, 0.22, 0.792], "alpha": 1 } }
  },
  "space": {
    "$type": "dimension",
    "small": { "$value": { "value": 8, "unit": "px" } },
    "medium": { "$value": { "value": 16, "unit": "px" } },
    "large": { "$value": { "value": 24, "unit": "px" } }
  },
  "radius": { "$type": "dimension", "card": { "$value": { "value": 16, "unit": "px" } } },
  "size": { "$type": "dimension", "touchTarget": { "$value": { "value": 48, "unit": "px" } } },
  "font": {
    "body": { "$type": "fontFamily", "$value": ["Lato", "sans-serif"] },
    "bodySize": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } }
  },
  "semantic": {
    "surface": { "$type": "color", "$value": "{color.white}" },
    "text": { "$type": "color", "$value": "{color.ink}" },
    "action": { "$type": "color", "$value": "{color.brand}" },
    "onAction": { "$type": "color", "$value": "{color.white}" }
  }
}
```
Add muted text, borders, focus, disabled, success, warning, error tokens. Validate types/references at build time. No legacy value/$value mixing. Test actual rendered contrast; token conformance does not prove accessibility.
Themes: MVP ships dark and light themes, with dark as the default. Primitives are shared; semantic color tokens have a dark value and a light value, each aliasing primitives. Generate CSS custom properties for both themes so components switch theme without code changes. QR codes always render dark on a light tile in both themes.
Typography: Lato is the only typeface on every screen, including SMS codes, pass references and timers. Do not use monospace or any other font family. Load Lato from the app itself (it is licensed under the SIL Open Font License); the generic sans-serif fallback is only for when Lato fails to load.

## 10. UI and accessibility

Target WCAG 2.2 AA acceptance. Support 320 CSS pixels without horizontal scrolling, single-column flow, large labeled actions, visible focus, keyboard access, associated labels/errors, screen-reader updates, non-color status cues, text enlargement, reduced motion, preserved form values, and accessible timers. Provide camera/file alternatives where supported. Announce key expiry milestones, not every second.
Dark is the default theme; light is also supported. Both themes must meet WCAG 2.2 AA contrast, verified on rendered screens in each theme.
Progress: Your details → Verify phone → Scan ID for age → Your pass.
Staff progress: Scan pass → Send SMS code → Compare code and check ID → Check in.
Never show confirmation before capacity and checks complete. Distinguish readable ID, age eligible, phone verified, and admitted.

## 11. Technical defaults

Next.js/TypeScript; responsive React; PostgreSQL/migrations; typed database layer such as Prisma; server sessions; SMS adapter; OCR adapter; background expiry/deletion jobs; unit and browser E2E tests. No email or identity-verification integration.

```ts
interface PhoneVerificationService {
  sendChallenge(input: SendPhoneChallengeInput): Promise<ChallengeReference>;
  verifyCode(input: VerifyPhoneCodeInput): Promise<VerificationResult>;
  verifyLink(input: VerifyPhoneLinkInput): Promise<VerificationResult>;
}
interface DocumentOcrService {
  extractAgeFields(input: ProtectedDocumentInput): Promise<OcrAgeFieldsResult>;
  deleteTemporaryData(jobId: string): Promise<void>;
}
interface DoorChallengeService {
  sendCode(input: AuthorizedDoorChallengeInput): Promise<StaffDoorChallengeView>;
  getStaffChallenge(input: AuthorizedChallengeLookup): Promise<StaffDoorChallengeView>;
  resendCode(input: AuthorizedChallengeLookup): Promise<StaffDoorChallengeView>;
  completeCheckIn(input: StaffAttestedCheckInInput): Promise<CheckInResult>;
}
```
Define concrete types; never accept client eligibility or authorization flags as authoritative. StaffAttestedCheckInInput includes challenge reference, comparison and physical-ID attestations, and idempotency key; server validates all authoritative state.
Services: calendar age rules, capacity, claim finalization, OCR validation, phone authentication, door challenges/check-in.

Entities:
- Venue; StaffMembership; Event.
- Attendee: name, normalized mobile, verification time, encrypted birth date; no email.
- PhoneVerificationChallenge: purpose, secret representation, expiry, attempts.
- AgeEligibilityCheck: OCR outcome, age result, engine/version, deletion status; no raw document.
- Claim: attendee/event, hold timestamps, state.
- AdmissionPass: protected opaque token and lifecycle.
- DoorChallenge: claim/event/phone reference, bound staff session, protected code and short-lived encrypted display value, expiry/state, send metadata.
- CheckIn: one redemption, staff, challenge, timestamps, attestations.
- ConsentRecord: SMS purpose, notice version, timestamp.
- AuditLog: minimal security/admin actions, no codes.

Constraints: unique attendee/event, unique pass token, one check-in per claim, one active door challenge per claim. Idempotent sends and check-in requests prevent duplicate SMS/redemption on retries.

## 12. Acceptance tests

1. Search event/venue/date combinations and all empty/error states.
2. No email field, collection, verification, sender integration, recovery, or email dependency in MVP.
3. Mobile mandatory; invalid and unverified numbers cannot complete a claim.
4. Code and link single-use; expired/over-attempt rejected; previews do not consume.
5. Hold exactly 10 minutes server-side; no reset on reload/resend/rescan.
6. Expired holds excluded before cleanup; capacity released.
7. Concurrent final-spot requests yield one success.
8. Late OCR completion atomically rechecks capacity.
9. OCR extracts name/birth date from supported state IDs and passports.
10. Missing/ambiguous/low-confidence/mismatched dates require rescan; no typed bypass.
11. Altered client OCR results cannot authorize a claim.
12. Exactly 21 passes; next-day birthday fails; time-zone and leap-day cases tested.
13. UI/API never asserts authenticated identity or document authenticity.
14. Temporary images deleted after success/failure and interrupted-job deadline; raw OCR absent from storage/logs.
15. Phone authentication on another device retrieves saved passes.
16. Invalid/canceled/wrong-venue/out-of-window passes cannot start valid admission.
17. Scanning does not itself redeem or send uncontrolled SMS.
18. SMS door code equals current staff-view code and goes only to previously verified phone.
19. Public/attendee endpoints do not reveal door code; unauthorized staff cannot retrieve it.
20. Staff compare and physical-ID attestations required before final check-in.
21. Expired/superseded/mismatching codes cannot complete check-in; resend invalidates prior code.
22. Parallel staff sessions cannot reuse challenges or redeem twice.
23. SMS failure/network outage/no phone access never produces success.
24. Door code is absent from logs/analytics/URLs and encrypted display value deleted on termination.
25. Cross-venue access denied; normal API responses exclude birth dates/documents/raw OCR.
26. Event date changes trigger eligibility recalculation and SMS notification.
27. Production cannot use mocks or silently succeed with unconfigured SMS/OCR.
28. DTCG valid tokens generate CSS; invalid references fail build.
29. QR screenshot alone is insufficient for admission.
30. Repeated idempotent send/check-in requests do not double-send or double-redeem.

## 13. Out of scope and future scope

Future: email collection, verification, notifications, recovery, marketing, and related consent. Do not implement now.
Other exclusions: payments, groups/plus-ones, waitlists, native apps, wallet integration, social login, recommendations, CRM/export automation, offline admission approval, ID-authenticity verification, selfies/biometrics, ownership proof, cross-venue identity sharing, general OCR manual-review console, lost-number bypass, legal-compliance guarantees.

## 14. Claude Code execution instructions

1. Scaffold app/schema/migrations/DTCG token pipeline with no email fields.
2. Discovery and details.
3. Invite-only venue administration and mobile staff authentication.
4. Atomic 10-minute holds and state transitions.
5. SMS phone verification/recovery.
6. Protected OCR capture, extraction validation, calendar age rules, deletion jobs.
7. Saved QR passes.
8. Staff scan → SMS challenge → visual comparison/physical ID → atomic check-in.
9. Security, retention, anti-abuse, accessibility, acceptance tests.

Use clearly labeled local SMS/OCR mocks and synthetic data only. OCR mock results must not be labeled identity verification. Production must refuse mock adapters and fail closed for missing integrations. Seed available/sold-out/canceled/expired cases. Include environment example without secrets and README covering setup, migrations, tests, deployment, providers, supported documents, SMS delivery callbacks, OCR retention, limitations. Document staff visual-comparison trust assumptions and SMS/network failure behavior.

Definition of done: a venue allocates spots; an attendee verifies a phone and passes an OCR-based age eligibility check within a capacity-safe flow; the app saves a pass; authorized door staff send and compare a fresh SMS code, inspect physical ID, and redeem exactly once without exposing documents or overbooking.

## Source notes

Product defaults (10-minute holds, two-minute door codes, limits, retention) are proposed implementation decisions, not legal requirements.
- DTCG 2025.10 format: https://www.designtokens.org/TR/2025.10/format/
- DTCG: https://www.designtokens.org/
- OWASP token practices: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- OWASP OTP guidance: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
- OCR versus document verification: https://regulaforensics.com/blog/data-parsing-vs-ocr-for-id-documents/

The previous identity-verification-provider requirements are superseded. Do not carry their provider integrations, verified-identity labels, or email requirements into this MVP.
