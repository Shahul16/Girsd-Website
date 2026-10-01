# GIRSD — Go-Live Setup Guide

Everything in the code is done. This guide is the exact order of account setup
to make it live. Total hands-on time: roughly 60–90 minutes (plus DNS wait).

---

## 0. The 14 Railway variables (final list)

| # | Variable | Where you get it | Required |
|---|----------|------------------|----------|
| 1 | `ADMIN_KEY` | You invent it (strong password for /admin) | ✅ |
| 2 | `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained token, **Contents: Read & Write** on this repo | ✅ for admin CMS |
| 3 | `GITHUB_REPO` | e.g. `Shahul16/globalrsd-website` — must match your real repo name | ✅ |
| 4 | `GITHUB_BRANCH` | `main` | optional |
| 5 | `RESEND_API_KEY` | resend.com → API Keys | ✅ for enquiry forms |
| 6 | `LEAD_TO_EMAIL` | Your inbox, e.g. `info@globalrsd.co.uk` | optional (defaults to info@) |
| 7 | `LEAD_FROM_EMAIL` | e.g. `GIRSD Website <leads@globalrsd.co.uk>` — only after domain verified in Resend | optional |
| 8 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ for login/payments |
| 9 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon public) | ✅ |
| 10 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role — keep secret) | ✅ |
| 11 | `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_test_…` now, `sk_live_…` later) | ✅ for payments |
| 12 | `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → your endpoint (`whsec_…`) | ✅ for orders to record |
| 13 | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Your registered reCAPTCHA key for www.globalrsd.co.uk: `6LcO_GstAAAAAAIinjg8tu23OoBRqu5ljAof7UVq` | optional (Google bot protection) |
| 14 | `RECAPTCHA_SECRET_KEY` | Paired secret key: `6LcO_GstAAAAAK3bLkRGCfZXv9O-yTKvDR3YMj6z` — keep this one private, never commit it | optional |
| 15 | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile → Add widget (or test key `1x00000000000000000000AA`) | optional (Cloudflare bot protection) |
| 16 | `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile → Widget Secret key (or test key `1x0000000000000000000000000000000AA`) | optional |

> After adding/changing variables, Railway redeploys automatically.
> `NEXT_PUBLIC_*` variables are baked in at build time — a redeploy is required.

---

## 1. GitHub + Railway (15 min)

1. Push this folder to GitHub (private repo is fine), e.g. `Shahul16/globalrsd-website`.
2. railway.app → New Project → **Deploy from GitHub repo** → select the repo.
   Railway auto-detects Next.js. No start command needed (`npm run build` / `npm start`).
3. Add variables 1–4 now (the site deploys and works read-only with just these).
4. Settings → Networking → Generate Domain → you get `xxxx.up.railway.app`.
   Later: add custom domain `www.globalrsd.co.uk` (Railway shows you the CNAME record).

## 2. Supabase — database + login (20 min)

1. supabase.com → New project (free tier). Region: London (`eu-west-2`).
2. **SQL Editor → New query** → paste the whole of `supabase/schema.sql` → Run.
   This creates the `orders` and `certificates` tables with row-level security.
3. Project Settings → API → copy the three values into Railway variables 8, 9, 10.
4. **Authentication → URL Configuration**:
   - Site URL: `https://www.globalrsd.co.uk` (or your railway.app URL until DNS is done)
   - Redirect URLs: add both `https://www.globalrsd.co.uk/**` and `https://xxxx.up.railway.app/**`
5. Email/password login now works. (Authentication → Providers → Email:
   you may turn OFF "Confirm email" for instant sign-up, or leave ON for verified emails —
   the register page handles both.)

## 3. Google sign-in (15 min, free)

1. console.cloud.google.com → New project → **APIs & Services → OAuth consent screen**
   → External → fill app name `GIRSD`, support email → Save (Testing mode is fine to start).
2. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorised redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
     (exact value shown in Supabase → Authentication → Providers → Google)
3. Copy Client ID + Client Secret into Supabase → Authentication → Providers → **Google** → Enable.
4. Done — the "Continue with Google" button is already wired.


## 4. Resend — enquiry emails (10 min + DNS wait)

1. resend.com → sign up → **API Keys → Create** → put in Railway variable 5.
2. Forms work immediately: emails arrive from `onboarding@resend.dev`.
   ⚠️ In this default mode Resend only delivers to **your own Resend account email** —
   fine for testing tonight.
3. For real delivery to `info@globalrsd.co.uk`: **Domains → Add domain**
   `globalrsd.co.uk` → add the 3 DNS records (SPF, DKIM) at your registrar →
   wait for "Verified" (minutes to a few hours) → set variable 7
   `LEAD_FROM_EMAIL="GIRSD Website <leads@globalrsd.co.uk>"` and variable 6 to your inbox.
4. Every Contact / Membership / Partner / Awards submission (incl. attachments)
   now lands in your inbox with Reply-To set to the visitor.

## 5. Stripe — payments (15 min test mode)

1. stripe.com → create account for **Q TECH PRIVATE LTD**.
2. Developers → API keys → copy **Secret key** (`sk_test_…`) → Railway variable 11.
3. Developers → **Webhooks → Add endpoint**:
   - URL: `https://www.globalrsd.co.uk/api/stripe/webhook` (or railway.app URL for now)
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_…`) → Railway variable 12.
4. Test the full flow: buy a ticket with card `4242 4242 4242 4242`, any future
   expiry, any CVC → you land on the confirmation page → the order appears on
   the member dashboard (written by the webhook).
5. **Going live** (when ready): complete Stripe's business activation
   (company number 15754767, bank account, ID). Then swap variable 11 to the
   `sk_live_…` key and create a live-mode webhook (new `whsec_…` for variable 12).
   Activation review is usually same-day but is Stripe's decision, not ours.

---

## What changed in the code (for your records)

- **Forms** → real: POST `/api/lead` → Resend email with attachments, honeypot anti-spam.
- **Auth** → real Supabase: email/password + Google/Microsoft/Apple OAuth, sessions persist across devices. `src/lib/auth.tsx` rewritten; localStorage demo removed.
- **Payments** → real Stripe Checkout (hosted page, PCI handled by Stripe). Prices recomputed **server-side**; member discounts (10% tickets / 5% courses) verified against the database, not the browser.
- **Orders** → recorded by the Stripe webhook into Supabase; dashboard reads them live. Membership cancel now updates the database.
- **Certificate verification** → reads the Supabase `certificates` table (add rows in Table Editor); sample data only as fallback.
- Removed every "demo mode / not transmitted / test mode" notice from the UI.

## Remaining honest limitations

- Membership is a **one-off annual payment** (12 months from purchase), not an
  auto-renewing Stripe subscription. "Renew now" charges again for another year.
  Auto-renew subscriptions can be added later as an upgrade.
- Apple sign-in pending the $99 developer account (see §5).
- Stripe **live** payouts pending Stripe's business verification (see §7).

---

## 6. Accreditation badge artwork (2 min per badge)

The site ships with tasteful in-house badge emblems for **CPD Provider, ICO
Registered and UKRLP Registered** so nothing looks empty on day one. Real
official artwork for ICO is already in place. CPD and UKRLP currently show
hand-redrawn approximations built to match the actual certificate/reference
image you shared — not the providers' own source files — so they look right
today but should be swapped for the real vector artwork once you can get it
directly from each body.

1. Enter your real registration numbers in `src/lib/site.ts` → `registrations`
   (CPD certificate no. ✅ already set to 788000, ICO registration ref e.g.
   `ZB…`, UKRLP → your UKPRN). They then appear on the badges automatically.
2. Each body's brand pack normally includes a dark version (for light
   backgrounds) and a white/reversed version (for dark backgrounds). Drop
   both into `public/accreditations/` as:
   - `cpd-light.svg` + `cpd-dark.svg` ✅ placeholder in place — a redrawn
     version of The CPD Group's sunflower emblem matching your Approved
     Provider #788000 certificate, in their orange brand colour (which reads
     well against both the site's cream sections and the navy footer). The
     badge is also a live link to your verify page on thecpdregister.com.
     Swap in their real artwork when The CPD Group provides it.
   - `ico-light.{…}` + `ico-dark.{…}` ✅ already added (official ICO logo,
     blue-on-transparent / white-on-transparent)
   - `ukrlp-light.svg` + `ukrlp-dark.svg` ✅ placeholder in place — a
     redrawn approximation, not UKRLP's own file. Request their real
     artwork directly from your UKRLP contact and swap it in when you have
     it (same filenames, any of the supported extensions).
   Any of these appear automatically after the next deploy — no code changes
   needed.
3. ⚠️ Only display a badge for registrations the company genuinely holds — ICO
   registration is a legal requirement for processing personal data (from ~£52/yr
   at ico.org.uk), and UKRLP registration is free at ukrlp.co.uk. Claiming them
   without holding them is a compliance risk, not a design choice.

## 7. Careers applications

The /careers page emails every application (with the CV attached) through the
same Resend pipeline as the other forms — no extra setup beyond §6. To edit or
add openings, update `src/lib/data/careers.ts` and push (or ask your developer).

## 8. reCAPTCHA — bot protection on every form (5 min)

Your reCAPTCHA key is already registered for `www.globalrsd.co.uk` (score-based,
"no challenge" type — visitors never see a checkbox or puzzle; it silently
scores each submission in the background).

1. In Railway, add variables 13 and 14 above (the real site key and secret
   key you registered). Both are already filled in from your registration —
   just paste them in.
2. That's it — no code changes needed. Once both variables are set:
   - Every page loads the reCAPTCHA v3 script automatically (site key only,
     which is not sensitive — it's designed to be visible in page source).
   - Every form on the site (Contact, Membership committee, Partner/Agent,
     Careers, **Internship**, Awards nomination) tags its submission with a
     fresh token right before sending.
   - `/api/lead` verifies that token server-side against Google using the
     secret key, and rejects the submission (with a friendly "please try
     again" message) if it looks automated or scores below the threshold.
3. If you ever only set the site key and not the secret (or vice versa), the
   site fails safe: forms keep working, just without bot screening — nothing
   breaks either way.
4. This uses the classic score-based verification method (`siteverify`),
   which is what your secret key is for — this is the correct method to
   pair with a secret key. Google's newer `CreateAssessment` API is for
   Google Cloud projects using API keys/service accounts instead of a secret
   key, and isn't needed here.
5. You can watch live traffic and scores any time in the Google Cloud
   Fraud Defense console (Security → reCAPTCHA → your key → Overview).

## 9. Admin panel (/admin) — what it does and how to verify it's working

**How publishing actually works.** The admin panel does not write to the live
server directly. When you press "Publish to live site" it commits the updated
JSON file straight to your GitHub repo (via the GitHub API, using
`GITHUB_TOKEN`/`GITHUB_REPO`/`GITHUB_BRANCH`). Railway is watching that repo
and automatically redeploys whenever a commit lands — that redeploy (roughly
2 minutes) is what actually puts the change on the live site. So three things
must all be true for a change to "stick": (1) the commit succeeds, (2) Railway
is connected to and deploying from that same repo/branch, (3) you wait for the
redeploy to finish before checking.

**Root cause of "changes not updating" in the previous build:** the code had a
hardcoded fallback repo name that was silently used whenever `GITHUB_REPO`
wasn't set, instead of failing loudly. If your Railway `GITHUB_REPO` value
didn't exactly match your real repo, admin saves could silently succeed
against the wrong repo (or a repo that doesn't exist) with no visible error.
This has been fixed: `GITHUB_REPO` (and `GITHUB_TOKEN` / `ADMIN_KEY`) are now
required — if any is missing, publishing fails immediately with a clear
message naming exactly which variable is missing, instead of failing silently.

**A real incident, and how it's now prevented:** an event added through the
admin's "Advanced" JSON box (tickets/agenda/speakers) had a ticket with no
`includes` array. That single missing field crashed the entire production
build on Railway — not just that one event's page, the whole site failed to
deploy, because Next.js generates every page in one build and one page
throwing an error fails all of them. The event's bad data has been fixed, the
event page code now defends against missing arrays so a future gap like this
can't crash the page even if it slips through, and — most importantly —
`/api/admin/save` now validates and normalises event data on every publish
(each ticket needs `id`/`name`/`price`; missing `includes`/`themes`/`agenda`/
`speakers` arrays are auto-filled instead of left `undefined`; an end date
before the start date is now rejected with a clear message instead of being
silently saved). In short: a malformed admin edit can no longer take the
whole live site down.

**New: "Check connection" button.** Inside `/admin`, under the page header,
there's now a **Check connection** button. Press it any time to confirm, live:
whether `ADMIN_KEY` / `GITHUB_TOKEN` / `GITHUB_REPO` are all set, whether the
token can actually reach the configured repo, whether the configured branch
exists, and whether the token has write (push) access — not just read. If
something's wrong it tells you exactly which of those four checks failed and
why, so you (or your developer) don't have to dig through Railway logs.

**What is and isn't editable from `/admin` today.** The panel covers the four
content collections that change often: **Events, Courses, Awards, News** —
add/edit/delete items, upload images, and publish, all without touching code.
Membership tiers/pricing, careers openings, committee/people bios,
testimonials, partner logos and site-wide settings (contact hours, discount
percentages, social links) are intentionally still edited in code
(`src/lib/data/*.ts`, `src/lib/site.ts`) rather than the admin panel, since
they change rarely and a wrong edit there (e.g. a broken discount rate or
membership price) has a much bigger blast radius than a wrong event date. If
you'd like any of these made admin-editable too, that's a scoped follow-up —
say which one and it can be added the same way as the existing four.
