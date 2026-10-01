# GIRSD Digital Platform

**Global Institute of Research & Skills Development** — official website and member platform
**Production domain:** [www.globalrsd.co.uk](https://www.globalrsd.co.uk)

| | |
|---|---|
| **Owner** | Q TECH PRIVATE LTD (England & Wales, Company No. 15754767), trading as GIRSD |
| **Registered office** | 23 Kinnaird Avenue, Bromley BR1 4HG, England |
| **Stack** | Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 3 |
| **Infrastructure** | Railway (hosting & CI/CD) · Supabase (auth & PostgreSQL) · Stripe (payments) · Resend (transactional email) |
| **Status** | Production-ready · All integrations live-capable |

---

## 1. Overview

The GIRSD Digital Platform is the institute's complete online presence: a public marketing and information site, an e-commerce layer for conference tickets, CPD course enrolments and annual memberships, and a secure member area. Content is managed through a built-in administration panel with Git-based publishing, requiring no separate CMS licence.

The platform is engineered for a small operations team: a single hosted service, managed third-party providers on free or usage-based tiers, and no servers to maintain.

## 2. Capability Summary

### Public website
- **Home** — animated hero, live countdown to the next conference, key statistics, services overview, partner marquee, accreditation trust badges
- **About** — vision & mission, founder profile, committees, CSR and publications
- **Events** — conference catalogue with detail pages (agenda, speakers, tiered ticketing £99–£399)
- **Courses** — six certified CPD courses with syllabus, assessment and certification detail
- **Awards** — individual and institutional categories with online nomination (incl. document upload)
- **Membership** — Student / Academic / Industry tiers with a benefits comparison table
- **Careers** — open positions, employer value proposition and an online application form with CV upload
- **News, Contact, Partner With Us** and a **public certificate verification** service
- **Legal suite** — Terms, Privacy (UK GDPR), Refund & Cancellation, Data Protection

### Commerce & member services
- **Stripe Checkout** for tickets, courses and memberships — PCI handled entirely by Stripe; prices computed server-side; automatic member discounts (10% conferences / 5% courses) verified against the database
- **Order ledger** written by Stripe webhook into PostgreSQL; surfaced live on the member dashboard
- **Member accounts** — email/password plus Google, Microsoft and Apple single sign-on (Supabase Auth); password reset by secure email link
- **Member dashboard** — profile, tickets, enrolments, membership status, renewal and cancellation

### Operations
- **Admin panel** (`/admin`) — password-protected editor for events, courses, awards and news; publishing commits JSON content to GitHub, which triggers an automatic Railway deployment (full audit trail in Git history)
- **Lead routing** — every enquiry and application form is delivered by email with reply-to set to the enquirer and attachments preserved; honeypot spam protection included
- **Trust & accreditation badges** — CPD Provider, ICO Registered and UKRLP Registered, rendered site-wide with registration numbers; official artwork auto-detected when placed in `public/accreditations/`

### Engineering quality
- Static generation for all content pages; per-page metadata, Open Graph, `sitemap.xml`, `robots.txt`
- WCAG-AA-oriented: semantic landmarks, skip link, visible focus states, `prefers-reduced-motion` support
- No client-side animation libraries; CSS/IntersectionObserver only
- Brand system: navy `#14213D` / gold `#C9A227`, Playfair Display headings, Inter body

## 3. Architecture

```
Visitor ──▶ Railway (Next.js 15, SSG + API routes)
                 │
                 ├── Supabase ──── Auth (email, Google, Microsoft, Apple)
                 │                 PostgreSQL: orders · certificates (RLS enforced)
                 ├── Stripe ────── Hosted Checkout ──▶ webhook ──▶ orders table
                 ├── Resend ────── Enquiry / application email delivery
                 └── GitHub ────── Content publishing (admin panel) ──▶ auto-deploy
```

Design principles: card data never touches the application (Stripe-hosted checkout); all pricing and discount decisions are made server-side; database writes occur only through the service role (webhook and audited API routes) with row-level security governing member reads.

## 4. Getting Started (Local Development)

**Prerequisites:** Node.js 20+ and npm.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

The site runs locally without any environment variables; integration-dependent features (login, payments, forms) return clear "not configured" messages until keys are supplied via `.env.local`.

## 5. Environment Configuration

All twelve variables, their sources and step-by-step acquisition instructions are documented in **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — the authoritative go-live runbook.

| Group | Variables |
|---|---|
| Administration | `ADMIN_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` |
| Email (Resend) | `RESEND_API_KEY`, `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL` |
| Auth & database (Supabase) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Payments (Stripe) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

Database schema (orders, certificates, policies): [`supabase/schema.sql`](./supabase/schema.sql) — a single script executed once in the Supabase SQL editor.

## 6. Deployment

The platform deploys as a single Railway service connected to this repository: every push to `main` — including publishes from the admin panel — builds and releases automatically. Custom-domain and DNS steps, provider console configuration (Supabase, Stripe, Resend, Google Cloud, Microsoft Entra) and go-live verification are covered in [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## 7. Content & Data Management

| Task | Where |
|---|---|
| Events, courses, awards, news | `/admin` panel (or edit `src/content/*.json` in Git) |
| Careers openings | `src/lib/data/careers.ts` |
| Company details, contact, accreditation numbers | `src/lib/site.ts` |
| Issue a verifiable certificate | Supabase → Table Editor → `certificates` |
| Review orders | Supabase → `orders` (mirrors Stripe Dashboard) |
| Official accreditation artwork | Drop files in `public/accreditations/` (`cpd`/`ico`/`ukrlp` + `.png .svg .webp .jpg`) |

## 8. Security Posture

- Payment card data is processed exclusively by Stripe (SAQ-A scope); webhook signatures verified on every event
- Authentication delegated to Supabase Auth; OAuth secrets held in provider consoles, never in this codebase
- Row-level security on all tables; the service-role key is server-only and never shipped to the browser
- Admin actions require `ADMIN_KEY`; content changes are attributable through Git commits
- Enquiry endpoints validate input, cap attachment size (10 MB) and include bot honeypots
- No secrets are committed to the repository; configuration is injected via Railway variables

## 9. Known Scope Boundaries

- Membership is billed as a one-off annual payment (12 months from purchase); automatic Stripe subscription renewal is a planned enhancement
- Apple sign-in activates once the organisation's Apple Developer Programme enrolment (US$99/yr) completes — the integration is already coded
- Live card payments require completion of Stripe's standard business verification for Q TECH PRIVATE LTD

## 10. Repository Structure

```
src/
  app/                    Pages (App Router) + API routes
    api/lead              Enquiry & application email delivery (Resend)
    api/checkout          Stripe session creation (server-side pricing)
    api/stripe/webhook    Order recording (signature-verified)
    api/admin/*           Content publishing & image upload (GitHub commits)
    api/verify-certificate  Public certificate lookup
    careers/              Careers page & application form
    forgot-password/ · reset-password/   Credential recovery flows
  components/             UI system (Header, Footer, TrustBadges, forms…)
  content/                Editable JSON collections (admin-managed)
  lib/
    auth.tsx              Supabase auth context (session, OAuth, orders)
    supabase.ts           Browser client
    server/supabase-admin.ts  Service-role client (server only)
    site.ts               Brand, company & registration constants
    data/                 Events, courses, memberships, careers, people
supabase/schema.sql       Database schema & RLS policies
SETUP_GUIDE.md            Go-live runbook (accounts, variables, consoles)
```

## 11. Support & Maintenance

For technical queries regarding this platform, contact the institute at **info@globalrsd.co.uk**.

---

© Q TECH PRIVATE LTD. All rights reserved. "GIRSD" and the Global Institute of Research & Skills Development identity are property of the owner. This repository is proprietary; no licence is granted for reuse or redistribution.

*Platform designed & built by [Shahul Hameed](https://www.linkedin.com/in/shahul-hameed16/).*
