# GIRSD Membership Verification, Security & Infrastructure Hardening

**Global Institute of Research & Skills Development (GIRSD)**  
*Trading name of Q TECH PRIVATE LTD, Company No. 15754767, London, United Kingdom.*  
*UK Register of Learning Providers (UKRLP): 10098485 · CPD Group Provider #788000 · ICO: ZB867375*

---

## 1. Executive Summary & Core Security Principle

The GIRSD platform enforces a **strict, server-side eligibility verification and approval gate**. Under no circumstances does user registration or payment completion automatically grant active membership benefits or digital credentials.

```
USER REGISTRATION
       │
       ▼
MEMBERSHIP APPLICATION SUBMITTED
       │
       ├──────────────────────────────────────┐
       ▼                                      ▼
[Institutional Domain: .ac.uk, .edu]    [Personal Webmail: @gmail, @yahoo]
       │                                      │
Email Verification Required            Mandatory Official Proof Upload
       │                               (ID Badge / Appointment / Enrolment)
       └──────────────────┬───────────────────┘
                          ▼
                  UNDER BOARD REVIEW
                          │
                          ▼
            PAYMENT CONFIRMED (Stripe)
            Status: PAYMENT_COMPLETED
         [NO ACTIVE BENEFITS UNLOCKED YET]
                          │
                          ▼
              ADMINISTRATIVE BOARD AUDIT
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
        APPROVED                     REJECTED
   GIRSD-M-YYYY-XXXX             Reason Recorded
   Valid for 12 Months          Applicant Notified
            │
            ▼
   ACTIVE MEMBER BENEFITS
(Discounts, Credentials, Portal)
```

---

## 2. Membership State Machine & Lifecycle Transitions

| Status State | Description | Member Benefits |
|---|---|---|
| `REGISTERED` | User account created in authentication system | **Denied** |
| `APPLICATION_SUBMITTED` | Candidate submitted membership details | **Denied** |
| `VERIFICATION_REQUIRED` | Awaiting academic/institutional proof document | **Denied** |
| `UNDER_REVIEW` | Credentials submitted; under Academic Board review | **Denied** |
| `PAYMENT_PENDING` | Application accepted for checkout; unpaid | **Denied** |
| `PAYMENT_COMPLETED` | Subscription paid via Stripe; board approval pending | **Denied** |
| `APPROVED` / `ACTIVE_MEMBER` | Formally approved by Credentials Board with Membership ID | **Granted** |
| `REJECTED` | Ineligible credentials or unverifiable institution | **Denied** |
| `SUSPENDED` | Membership paused by administrator | **Denied** |
| `EXPIRED` | 12-month validity period has elapsed | **Denied** |
| `CANCELLED` | Cancelled by user or finance administrator | **Denied** |

### Backend Enforcement Rule
Any request attempting to claim member discounts (10% on conference tickets, 5% on courses) or download accredited member certificates executes `hasActiveMembership(userId)` on the server:
- Gated on `membership_applications` status in `['APPROVED', 'ACTIVE_MEMBER', 'Active']`.
- Verifies `valid_until > NOW()`.
- Client manipulation, query tampering, or payment success redirect parameters (`/checkout/confirmation?session_id=...`) can never bypass this check.

---

## 3. Institutional vs. Personal Email Verification

### Corporate / Institutional / University Verification (Domain Verification Code)
1. **Domain Detection**: Automatic heuristics identify legitimate academic, university, and research institutions (`.ac.uk`, `.edu`, `.edu.*`, `.gov`, `.gov.*`, and corporate domains).
2. **One-Time Verification Code Dispatch**:
   - The system dispatches a cryptographically generated 6-digit one-time verification code to the university email address via `/api/membership/verify-email`.
   - Code expires after 15 minutes and is rate-limited to prevent abuse.
3. **Domain Ownership Confirmation**:
   - The applicant enters the 6-digit code in the modal/portal to verify ownership of the university email address before proceeding.
   - Upon confirmation, `email_verified: true` is recorded in the application record and logged to the audit trail.
4. **Critical Institutional Rule**:
   - University email verification confirms *domain ownership and inbox control*.
   - It does **not** automatically activate membership or grant restricted perks.
   - Final membership activation remains subject to Academic Board approval.

### Personal Webmail Workflow (Document Verification + Email Confirmation)
1. Detects personal webmail domains (`@gmail.com`, `@yahoo.*`, `@hotmail.com`, `@outlook.com`, `@icloud.com`, etc.).
2. Explains clearly that official institutional affiliation evidence (Student ID, faculty badge, appointment letter) is mandatory.
3. Allows sending an email verification code to confirm ownership of the applicant's contact email ID.
4. Assigns an official reference code: `GIRSD-MEM-YYYY-XXXXXX`.
5. Directs candidate to the secure document upload portal (with fallback to `membership@globalrsd.co.uk`).

---

## 4. Secure Document Upload & IDOR Protection

Verification files (student IDs, appointment letters, faculty badges) contain personal data. The system applies defense-in-depth protections:

1. **Storage Isolation**: Uploaded documents are saved in `private_documents/verifications/` **outside the public web root**. They cannot be reached by guessing filenames or direct HTTP URLs.
2. **File Type & Magic Byte Validation**:
   - Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`.
   - Executable, script, or disguised uploads (`.exe`, `.sh`, `.php`, `.svg` with scripts) are rejected.
   - Buffer signatures inspected:
     - PDF: `%PDF-` (`0x25 0x50 0x44 0x46`)
     - PNG: `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
     - JPEG: `0xFF 0xD8 0xFF`
     - WebP: `RIFF` ... `WEBP`
3. **Payload Limit**: Strict 5 MB maximum size constraint.
4. **Safe Renaming**: Files are renamed using cryptographically secure UUIDs (`girsd-doc-<UUID>.<ext>`) to prevent directory traversal (`../`) and file collisions.
5. **IDOR (Insecure Direct Object Reference) Protection**:
   - The document retrieval route `/api/membership/document?file=...` inspects the requester's identity.
   - Access is permitted **only** if the user owns the application record associated with the file, OR if the request carries valid administrator credentials.
   - Unauthorized attempts return `403 Forbidden` and are logged.

---

## 5. Administrative Approval Dashboard & Audit Trail

Administrators manage verification through `/admin` under **Membership Verification Queue**:
- **Application Dossier**: View applicant name, email, email classification, affiliation, department, role, tier, fee, payment status, and verification document.
- **Document Access**: One-click preview of uploaded documents via authenticated endpoint.
- **Available Actions**:
  - `Approve`: Generates unique Membership ID (`GIRSD-M-YYYY-XXXX`), sets 12-month validity, marks status as `ACTIVE_MEMBER`.
  - `Reject`: Requires explicit rejection reason; status set to `REJECTED`.
  - `Request Documents`: Prompts reviewer notes; status set to `VERIFICATION_REQUIRED`.
  - `Suspend` / `Reactivate`: Administrative controls for credential standing.
- **Tamper-Resistant Audit Trail**: Every administrative action logs timestamp, actor email, action, prior status, new status, and reason to the application's audit history.

---

## 6. Payment Webhook Hardening & Idempotency

1. **Server-Side Price Calculation**: Prices for tickets, courses, and memberships are strictly computed on the server from authoritative data files. Client-supplied price values are ignored.
2. **Webhook Signature Verification**: Every incoming webhook event to `/api/stripe/webhook` is verified using `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`.
3. **Replay & Idempotency Protection**: Session IDs are stored in the database with unique constraints (`stripe_session_id unique`) to prevent duplicate crediting.
4. **Payment Isolation**: Webhook confirms financial transaction (`orders` table) and flags application as `PAYMENT_COMPLETED` / `UNDER_REVIEW`, but explicitly leaves membership activation in the hands of the administrative review board.

---

## 7. Public Credential Verification Portal (`/verify-membership`)

Public registry lookup allows third-party institutions, employers, and visa authorities to verify credentials without exposing sensitive personal data:
- **Search Keys**: Accepts Membership ID (`GIRSD-M-2026-1042`), Application Reference (`GIRSD-MEM-2026-000123`), or Certificate ID (`GIRSD-2026-001`).
- **Controlled Output**:
  - `Status`: `VALID` or `NOT_VALID`
  - `Credential Type`: `Official Membership Credential` or `Accredited CPD Certificate`
  - `Membership Category`: e.g. `Fellow (FGRSD)`
  - `Affiliated Institution`: Verified organization name
  - `Expiry / Issue Date`: e.g. `01/10/2027`
  - `Issuing Body`: `Global Institute of Research & Skills Development (GIRSD, UK)`
- **Data Minimization**: Private applicant emails, home addresses, phone numbers, and payment details are never returned in public responses.

---

## 8. Bot, Abuse & Rate Limiting Controls

API endpoints implement server-side sliding-window rate limiting (`src/lib/server/rate-limit.ts`) based on client IP headers (`cf-connecting-ip`, `x-forwarded-for`, `x-real-ip`):

| Endpoint / Action | Rate Limit | Protection Target |
|---|---|---|
| Admin Login / Auth | 5 attempts / 15 mins | Brute force credential attacks |
| Membership Application | 8 submissions / hour | Form spam & fake applications |
| Document Upload | 10 uploads / hour | Storage exhaustion & upload abuse |
| Credential Verification | 30 queries / min | Registry scraping & ID enumeration |
| Stripe Checkout Session | 15 sessions / min | Payment processor carding attacks |

Excessive requests receive HTTP `429 Too Many Requests` with a `Retry-After` header.

---

## 9. Security Headers Configuration

Configured in `next.config.mjs` across all routes:

```javascript
// Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com; frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com;

// Transport & Frame Controls
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(), geolocation=()
X-Powered-By: [REMOVED]
```

---

## 10. Infrastructure Architecture & Disaster Recovery

### Production Architecture
```
Internet
   │
   ▼
Cloudflare CDN / WAF (DDoS Mitigation, Bot Management, SSL/TLS Termination)
   │
   ▼
Web Application Layer (Next.js / Node.js on Railway)
   │
   ├──────────────────────────────┬──────────────────────────────┐
   ▼                              ▼                              ▼
Private Document Storage    Supabase Postgres DB           Stripe Gateway
(Outside Web Root)          (Row-Level Security)           (Webhook Signing)
```

### Backup & Disaster Recovery Policy
- **Recovery Point Objective (RPO)**: 1 hour (automated database snapshots + write-ahead logs).
- **Recovery Time Objective (RTO)**: 4 hours (containerized redeployment from Git production branch).
- **Database Backup Frequency**: Daily full backup at 02:00 UTC, continuous WAL archiving.
- **Retention Period**: Daily backups retained 30 days; weekly backups retained 12 weeks; monthly backups retained 12 months.
- **Disaster Recovery Testing**: Bi-annual test restoration to an isolated staging environment to verify data integrity.

---

## 11. OWASP Top 10 Mitigation Verification

| OWASP Risk | Implementation & Mitigation |
|---|---|
| **A01: Broken Access Control** | Server-side role validation (`hasActiveMembership`), IDOR protection on document retrieval, admin routes authenticated. |
| **A02: Cryptographic Failures** | Strict HTTPS enforcement, HSTS preload, secure token generation via `crypto.randomUUID()`, TLS in transit. |
| **A03: Injection** | Parameterized queries via Supabase client, input sanitization, path traversal stripping on filenames. |
| **A04: Insecure Design** | Explicit approval gate: Payment confirmed + verification pending = no active benefits. |
| **A05: Security Misconfiguration** | Powered-By header stripped, secure production CSP, restrictive permissions policy. |
| **A06: Vulnerable Components** | `npm audit` patched, zero abandoned dependencies. |
| **A07: Identification & Auth Failures** | Password policy enforced, rate limiting on login/auth, email confirmation flows. |
| **A08: Software & Data Integrity** | Stripe webhook signature verification (`constructEvent`), tamper-evident application audit trail. |
| **A09: Logging & Monitoring Failures** | Centralized application audit logging for all administrative membership decisions. |
| **A10: SSRF** | File uploads restricted to local disk and GitHub content APIs; no arbitrary external URL fetching. |
