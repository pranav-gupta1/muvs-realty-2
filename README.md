# MUVS Realty

Premium residential and commercial real estate advisory for Delhi NCR — a complete
Next.js 15 site with a gated pre-launch section, OTP-verified lead capture, and an
admin panel for every piece of content.

Runs entirely on localhost with **no third-party account and no credentials**.

---

## Quick start

```bash
npm install
cp .env.example .env          # then generate the two secrets below
npm run db:migrate            # creates prisma/dev.db and applies migrations
npm run db:seed               # realistic Delhi NCR content
npm run dev                   # http://localhost:3000
```

Generate the two secrets in `.env`:

```bash
openssl rand -base64 32       # → AUTH_SECRET
openssl rand -hex 32          # → OTP_HASH_SECRET
```

**Admin panel:** <http://localhost:3000/admin>

| | |
|---|---|
| Email | `admin@muvsrealty.com` |
| Password | `muvs@admin123` |

Both come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`. Change them there and
re-run `npm run db:seed` to reset the account. **Change the password before deploying.**

### Testing phone verification locally

`OTP_DEV_MODE=true` is the default. In dev mode:

- the verification code is **always `123456`** (set by `OTP_DEV_CODE`)
- it is **shown on screen** in a gold panel above the code boxes, and printed to the server log
- **no SMS is sent** and no provider account is needed

Everything else about the flow is real — expiry, single use, attempt caps, rate limits
and the phone-match check all behave exactly as they do in production. Set
`OTP_DEV_MODE=false` and configure a provider to send real messages.

**This cannot leak to a live site.** `src/lib/env.ts` throws when a *serving* production
process has dev mode on, so the first request to `/api/otp/send` fails loudly with the
reason in the server log rather than handing out `123456`. The check is skipped during
`next build` only, so `npm run build` still works with a development `.env`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Taxonomy drift check, then `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply migrations (creates the SQLite file) |
| `npm run db:seed` | Seed content — **idempotent**, safe to re-run |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Prisma Studio |
| `npm run check:sms` | Validate SMS credentials **against the provider**, before spending a message |
| `npm run check:taxonomy` | Assert the Prisma schema and `src/lib/taxonomy.ts` agree |

`npm run check:sms -- +919810202834` additionally sends one real test message
(skipped while `OTP_DEV_MODE` is on).

---

## Phone verification

Lead capture is the most important feature on this site, so every lead's phone number
is verified by a one-time code before the lead is stored. "Verified" genuinely means
someone controls that number.

### The approach, and why

**Codes are generated, hashed and checked by this app. The provider only delivers the
SMS.** The three options were:

| Option | Why not chosen |
|---|---|
| **Hosted auth provider** (Firebase Phone Auth, Auth0) | Moves the verification record into someone else's system, exactly where our lead pipeline cannot enforce it. Firebase also drags in a client SDK, reCAPTCHA and a billing account for what is one field on one form. |
| **Provider-side verification** (Twilio Verify, MSG91 OTP API) | Simpler, but the "was this number verified?" fact lives at the provider. Joining it to the lead row means an extra API call at submit time and a hard dependency on that vendor's uptime for a lead we have already captured. |
| **Own backend + dumb SMS transport** ← chosen | The verification record sits in our own table, next to the lead, so the submit handler can enforce it in the same transaction. The provider becomes a commodity we can swap. |

The deciding factor for an Indian business is cost and regulation. Indian transactional
SMS requires DLT-registered templates, and MSG91 handles that at a fraction of Twilio's
per-message price for Indian numbers — but Twilio is better for NRI traffic (US, UAE, UK,
Singapore). Owning the code logic means using **either**, per environment, without
touching the form or the lead pipeline.

**The trade-off:** we are responsible for hashing, expiry, single use, attempt caps and
rate limiting — things a hosted provider would do for us. Those are implemented and
documented in `src/lib/otp/service.ts`; the guarantees are listed below.

### What is enforced

| Guarantee | Where |
|---|---|
| Codes are never recoverable from storage — only an HMAC-SHA256 digest keyed by `OTP_HASH_SECRET` is written | `service.ts` → `hashCode` |
| Single use — consumed atomically, so two concurrent submits cannot both succeed | `verifyOtp` → conditional `updateMany` |
| Issuing a new code voids every earlier one for that number | `issueOtp` |
| 10-minute expiry (`OTP_TTL_MINUTES`) | `issueOtp` / `verifyOtp` |
| Wrong attempts capped per code, and the user is told how many remain | `verifyOtp` |
| Codes per phone per hour capped **in the database**, so it survives a restart | `issueOtp` |
| Send endpoint rate limited per IP; lead endpoint 5 per IP per hour | `src/app/api/otp/send`, `src/app/api/leads` |
| Honeypot + minimum fill time, both returning **200 with nothing stored** so bots get no signal | both routes |
| Comparison is timing-safe | `safeEqual` |

**The check that makes it mean anything:** `/api/leads` derives the E.164 number from the
country and digits *submitted on the form*, then requires the OTP challenge to have been
issued **for that exact number**. The client never sends an E.164 string, and never sends
a "verified" flag. Requesting a code for a number you control and then submitting a
different one is rejected with `PHONE_MISMATCH`.

Verified by hand during the build:

```
wrong code      → "That code is incorrect. You have 4 attempts left."
phone mismatch  → "The number on the form is not the one we sent the code to."
correct code    → { ok: true, leadId: … }
replayed code   → "That code has already been used."
honeypot filled → 200 { ok: true }, nothing stored
```

### Switching provider

Set `SMS_PROVIDER` and run `npm run check:sms`.

```bash
# India — cheapest, DLT-compliant. Needs a DLT-approved template with one variable.
SMS_PROVIDER="msg91"
MSG91_AUTH_KEY="..."
MSG91_TEMPLATE_ID="..."
MSG91_SENDER_ID="MUVSRL"

# International / NRI-heavy traffic
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+15551234567"     # or TWILIO_MESSAGING_SERVICE_SID
```

**Adding a fourth provider** means implementing one interface and registering it:

```ts
// src/lib/otp/provider.ts
export interface SmsProvider {
  readonly name: string
  describe(): string
  requiredEnv(): string[]
  verifyCredentials(): Promise<CredentialCheck>   // used by npm run check:sms
  send(params: { to: string; code: string; message: string }): Promise<SmsSendResult>
}
```

Register it in `src/lib/otp/providers/index.ts`. Nothing else changes — not the form,
not the routes, not the lead pipeline.

### When delivery fails

A provider outage must never block a developer:

- the provider's **actual error is always logged**, never swallowed
- in development the code that *would* have been sent is printed to the console
- the challenge is voided immediately, so a failed send does not burn one of the
  caller's hourly attempts
- the visitor sees an actionable message ending in a way forward — the office phone
  number, pulled from Site Settings. The raw provider detail is returned to the client
  **only** in development.

---

## Email (Nodemailer / SMTP)

Two emails fire on every lead:

1. **To the enquirer** — branded maroon/gold HTML, thanks them by name, restates their
   requirement, gives phone, email, WhatsApp and social links.
2. **To the company inbox** (`LEADS_INBOX`) — plain internal notification with every
   field, the timestamp, the source page, tap-to-call and a deep link to the lead in the
   admin panel.

Templates live in `src/lib/email/templates/` and are plain functions returning
`{ subject, html, text }`.

**If `SMTP_HOST` is empty, emails are pretty-printed to the server console instead of
sent — nothing crashes.** Email failures can never fail the request: the lead is already
committed before `sendLeadEmails` runs, and every error inside it is caught and logged.

### Google Workspace

1. Enable 2-Step Verification on the account.
2. Create an **App Password** (Google Account → Security → App passwords).
3. ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="info@muvsrealty.com"
   SMTP_PASS="the-16-character-app-password"
   SMTP_FROM="MUVS Realty <info@muvsrealty.com>"
   LEADS_INBOX="info@muvsrealty.com"
   ```

`SMTP_FROM` must be an address the account is allowed to send as, or Gmail silently
rewrites it.

### Zoho Mail

```bash
SMTP_HOST="smtp.zoho.in"     # smtp.zoho.com outside India
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="info@muvsrealty.com"
SMTP_PASS="an-application-specific-password"
```

Zoho requires an application-specific password when 2FA is on, and the domain must be
verified first.

---

## Adding content via /admin

Sign in at `/admin`. The sidebar covers everything on the site.

| Section | Notes |
|---|---|
| **Leads** | Search across name, phone, email and requirement. Set status (New / Contacted / Qualified / Closed / Lost), add notes, **Export to CSV**. Phones export in E.164 so the file drops straight into a dialer. |
| **Projects** | Developments you market. Full editor: pricing, configurations, amenities, floor plans, RERA, brochure, map, images. |
| **Pre-Launch** | **A filtered view of Projects where status = `PRE_LAUNCH` — not a separate model.** Change a project's status and it moves between `/projects` and `/pre-launch` with no migration. |
| **Inventory** | Resale listings. **The specification fields change with the property type** — an apartment asks for balconies and carpet area, a farm asks for soil type and khatauni, a shed asks for sanctioned load and crane availability. |
| **Certifications / Videos / Testimonials** | Compact list-plus-form editors. Videos store only the YouTube ID — paste a full watch URL and the ID is extracted. |
| **Site Settings** | Contact details, socials, hero copy, director bio and photo, trust-strip numbers. Fields still holding a placeholder are flagged. |

**Images:** drag and drop onto any image panel, or click to choose. Drag rows to reorder,
star one as the primary (used on cards and for social sharing), and add alt text. The
whole arrangement saves with the rest of the form — there is no separate save step.

### Content placeholders

The seed ships `[FILL: ...]` placeholders for details only the owner can supply — director
name and bio, phone, WhatsApp, email, office address, RERA number, and the four social
links. The dashboard lists which are still unfilled.

**An unfilled placeholder never renders as a broken link.** `src/lib/site.ts` treats
`[FILL: ...]` as absent, so the footer's phone row, the floating WhatsApp button and any
social chip simply do not render until real values are set. Body copy (the director bio)
does show the placeholder text, deliberately — so it is obvious what still needs writing.

---

## Architecture notes

### Enums and arrays on SQLite

SQLite has neither native enums nor scalar list columns, so:

- **Every enum value and human label lives in exactly one module**, `src/lib/taxonomy.ts`.
  The Prisma schema documents each one in a `/// @taxonomy(Name) A | B | C` comment, and
  `npm run check:taxonomy` (part of `npm run typecheck`) fails the build if the two ever
  disagree. The zod validators, filter UIs, admin forms and seed all import from that
  module, so they cannot drift.
- **Arrays and objects are JSON string columns**, marked `/// @json`, and are only ever
  read or written through the typed helpers in `src/lib/json.ts`. A malformed row
  degrades to a safe default instead of throwing mid-render.

### Derived columns

`Inventory.pricePerUnit` and `Inventory.areaSqft` are computed on every write by
`deriveInventoryFields` in `src/lib/inventory.ts`. `areaSqft` exists because listings are
quoted in sq.ft., sq.yd., acres **and** bigha — without a normalised column the area
filter and the "largest first" sort would be comparing unlike units. (Bigha uses the
western-UP / Delhi-NCR pucca bigha of 3,025 sq.yd.)

### The pre-launch gate

Gated content is decided **on the server**. `hasPreLaunchAccess()` reads an httpOnly,
HMAC-signed cookie that only `/api/leads` sets, and only after a successful verification.
Locked sections are never queried or rendered, so there is nothing in the HTML to reveal
with devtools — no hidden div, no blurred overlay.

---

## Deploying to Vercel (with Postgres)

### 1. Swap the database

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

No column types are SQLite-specific, so nothing else in the schema has to change. Then:

```bash
rm -rf prisma/migrations          # SQLite migration SQL is not portable
npx prisma migrate dev --name init
npm run db:seed
```

**Optional Postgres improvements** — none are required, and each is a one-line change:

- Promote any taxonomy column to a real `enum`. Keep `src/lib/taxonomy.ts` as the source
  of the labels; the `@taxonomy` comments and the drift check still apply.
- Change JSON columns from `String` to `Json`, and `String @default("[]")` list columns to
  `String[]`. The call sites do not change — they only touch `src/lib/json.ts`.
- Make search case-insensitive. `buildInventoryWhere` in `src/lib/inventory.ts` uses plain
  `contains` because Prisma's `mode: 'insensitive'` is Postgres-only; add it there once
  you have moved.

### 2. Two things that must change for serverless

Vercel runs functions on an ephemeral, read-only filesystem, with no shared memory
between invocations. Two pieces of this app assume neither of those:

| What | Why it breaks | Fix |
|---|---|---|
| **`/public/uploads`** — the `local` storage driver writes files to disk | The filesystem is read-only at runtime, and anything written vanishes | Implement a second adapter in `src/lib/storage.ts` (the file has a worked S3 sketch in a comment), register it in `ADAPTERS`, and set `UPLOAD_DRIVER`. The `StorageAdapter` interface is the only contract — no route, form or component changes. |
| **`src/lib/rate-limit.ts`** — in-memory fixed-window limiter | Each lambda gets its own memory, so limits are effectively per-instance | Replace the `buckets` Map with Upstash Redis (or Vercel KV). Only that one file changes; `rateLimit({ key, limit, windowMs })` stays the same everywhere it is called. |

Note the **per-phone** OTP quota is already counted in the database, so that one survives
serverless as-is. It is the per-IP limits that need Redis.

### 3. Environment variables on Vercel

Set everything from `.env.example` in the project settings, with these differences:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="https://www.muvsrealty.com"
AUTH_SECRET="<a fresh openssl rand -base64 32>"
# AUTH_URL — leave unset; Vercel provides the origin
OTP_DEV_MODE="false"          # verification refuses loudly if this is left true
OTP_HASH_SECRET="<a fresh openssl rand -hex 32>"
SMS_PROVIDER="msg91"          # plus its credentials
ADMIN_PASSWORD="<something strong>"
UPLOAD_DRIVER="s3"            # once the adapter is added
```

Rotating `OTP_HASH_SECRET` immediately invalidates every outstanding code, which is the
intended behaviour.

### 4. Before going live

```bash
npm run check:sms       # verifies credentials against the provider, sends nothing
npm run typecheck
npm run lint
npm audit
```

Then set the real values under **Site Settings** so the `[FILL: ...]` placeholders stop
suppressing your contact details.

---

## SEO

`next/metadata` on every page with canonicals pointing at `NEXT_PUBLIC_SITE_URL`
(`https://www.muvsrealty.com`) regardless of where the app is running, so a page
previewed locally still advertises its production URL. `sitemap.xml` includes every
published project and listing; `robots.txt` disallows `/admin` and `/api`. JSON-LD:
`RealEstateAgent` on the home page, `Product`/`Offer` on each listing and project,
`BreadcrumbList` on detail pages, `VideoObject` on `/videos`.

## Dependency notes

`npm audit` reports **0 vulnerabilities**. Three advisories affecting transitive
dependencies are resolved with `overrides` in `package.json` rather than by upgrading
Next.js to 16:

```json
"overrides": {
  "postcss": "^8.5.26",       // Next 15 pins 8.4.31; the sourceMappingURL fixes landed in 8.5.23
  "nodemailer": "^9.1.0",     // raw-option file read / SSRF
  "deepmerge-ts": "^8.0.0"    // stack exhaustion, reached via the Prisma CLI
}
```

Re-check these when upgrading Next.js — once Next ships a patched `postcss` pin, that
override can be dropped.
