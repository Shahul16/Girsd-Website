# GIRSD — Go-Live Setup Guide

Everything in the code is done. This guide is the exact order of account setup
to make it live. Total hands-on time: roughly 60–90 minutes (plus DNS wait).

---

## 0. Railway variables

| # | Variable | Where you get it | Required |
|---|----------|------------------|----------|
| 1 | `ADMIN_KEY` | You invent it (strong password for /admin) | ✅ |
| 2 | `RESEND_API_KEY` | resend.com → API Keys | ✅ for enquiry forms |
| 3 | `LEAD_TO_EMAIL` | Owner inbox | optional |
| 4 | `LEAD_FROM_EMAIL` | Verified sender domain in Resend | optional |
| 5 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| 6 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (public client key) | ✅ |
| 7 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server-side secret; never expose) | ✅ |
| 8 | `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | ✅ for payments |
| 9 | `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint signing secret | ✅ for order recording |
| 10 | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA console | optional |
| 11 | `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA console (server-side secret) | optional |
| 12 | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile | optional |
| 13 | `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile (server-side secret) | optional |

> After adding/changing variables, Railway redeploys automatically.
> `NEXT_PUBLIC_*` variables are baked in at build time — a redeploy is required.

---

## 1. Railway deployment (15 min)

1. Push this folder to GitHub (private repo is fine), e.g. `Shahul16/globalrsd-website`.
2. railway.app → New Project → **Deploy from GitHub repo** → select the repo.
   Railway auto-detects Next.js. No start command needed (`npm run build` / `npm start`).
3. Add `ADMIN_KEY` and the required variables from the table above. Supabase is required for the CMS and admin database browser.
4. Settings → Networking → Generate Domain → you get `xxxx.up.railway.app`.
   Later: add custom domain `www.globalrsd.co.uk` (Railway shows you the CNAME record).

## 2. Supabase — database + login (20 min)

1. supabase.com → New project (free tier). Region: London (`eu-west-2`).
2. **SQL Editor → New query** → run `supabase/schema.sql`, then run
   `supabase/migrations/20261123_awards_workflow.sql`,
   `supabase/migrations/20261127_site_management.sql`, and
   `supabase/migrations/20261127_awards_admin_review.sql` in that order. These create the
   business tables, CMS collection store, enquiry table, and public media bucket.
   For existing projects, run every migration too: `schema.sql` creates missing tables but
   does not add columns to tables that already exist. The awards review migration adds the
   reviewer fields required by admin select/reject actions.
3. Project Settings → API → add the project URL, anon key, and service-role key
   to Railway. Keep the service-role key server-side only.
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

1. resend.com → sign up → **API Keys → Create** → set `RESEND_API_KEY` in Railway.
2. Forms work immediately: emails arrive from `onboarding@resend.dev`.
   ⚠️ In this default mode Resend only delivers to **your own Resend account email** —
   fine for testing tonight.
3. For real delivery to `info@globalrsd.co.uk`: **Domains → Add domain**
   `globalrsd.co.uk` → add the 3 DNS records (SPF, DKIM) at your registrar →
   wait for "Verified" (minutes to a few hours) → set `LEAD_FROM_EMAIL` and
   `LEAD_TO_EMAIL` in Railway.
4. Contact and general enquiry submissions are stored in the admin database
   and emailed to the configured inbox, with Reply-To set to the visitor.

## 5. Stripe — payments (15 min test mode)

1. stripe.com → create account for **Q TECH PRIVATE LTD**.
2. Developers → API keys → copy **Secret key** (`sk_test_…`) → set `STRIPE_SECRET_KEY` in Railway.
3. Developers → **Webhooks → Add endpoint**:
   - URL: `https://www.globalrsd.co.uk/api/stripe/webhook` (or railway.app URL for now)
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_…`) → set `STRIPE_WEBHOOK_SECRET` in Railway.
4. Test the full flow: buy a ticket with card `4242 4242 4242 4242`, any future
   expiry, any CVC → you land on the confirmation page → the order appears on
   the member dashboard (written by the webhook).
5. **Going live** (when ready): complete Stripe's business activation
   (company number 15754767, bank account, ID). Then update `STRIPE_SECRET_KEY`
   to the `sk_live_…` key and create a live-mode webhook with its new
   `STRIPE_WEBHOOK_SECRET`.
   Activation review is usually same-day but is Stripe's decision, not ours.

---

## What changed in the code (for your records)

- **Forms** → POST `/api/lead` stores enquiries in Supabase and sends Resend email with attachments, with bot protection.
- **Auth** → real Supabase: email/password + Google/Microsoft/Apple OAuth, sessions persist across devices. `src/lib/auth.tsx` rewritten; localStorage demo removed.
- **Payments** → real Stripe Checkout (hosted page, PCI handled by Stripe). Prices recomputed **server-side**; member discounts (10% tickets / 5% courses) verified against the database, not the browser.
- **Orders** → recorded by the Stripe webhook into Supabase; dashboard reads them live. Membership checkout is linked to the signed-in member's application, and cancellation revokes active membership benefits.
- **Admin CMS** → `/admin` uses an HttpOnly admin session and Supabase for content and media. It includes a read-only business-data browser and workflow actions for membership and award approvals.
- **Certificate verification** → reads the Supabase `certificates` table (add rows in Table Editor); the verification API never treats sample data as valid.
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
same Resend pipeline as the other forms. Career openings can be edited in the
Careers tab in `/admin`.

## 8. reCAPTCHA — bot protection on every form (5 min)

1. In Railway, add the site key and secret key as environment variables.
   Never paste the secret into source code or documentation.
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

## 9. Admin panel (/admin)

Set a strong `ADMIN_KEY` and configure the Supabase project and service-role
key before using the panel. Admin sessions are short-lived, HTTP-only cookies.
The panel saves site content directly to the `site_content` table, manages
images in the `site-media` storage bucket, and provides read-only browsing of
orders, certificates, membership applications, award records, enquiries, and
published content. Membership approvals require payment to be recorded or
waived; award decisions and enquiry status updates are available from the
database view.

Editable collections include site settings, hero slides, events, courses,
awards, news, page editorial content, career openings, membership tiers, and
promotions. Most collection edits take effect without a deployment. Apply the
Supabase migration before the first admin save; test changes in a non-production
project before making them live.

If a credential was ever committed to a shared repository or documentation,
rotate it with its provider and update the deployment environment variables.
