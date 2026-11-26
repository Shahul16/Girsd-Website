# 🏆 GIRSD Awards Workflow - Complete Process Flow

## Overview
The GIRSD Awards system handles nominations, selections, and final registrations for prestigious academic and professional honors. The complete workflow spans 14 stages with automated notifications and payment processing.

---

## 📋 Complete Award Workflow

### STAGE 1: Nomination Submission
**Entry Point**: `/awards` or `/awards/nominate`

**Process**:
1. User submits nomination form with:
   - Nominator details (name, email)
   -Nominee details (name, email, affiliation)
   - Category selection
   - Supporting statement and links
   - Optional attachment upload

2. API: `/api/awards/nominate` handles submission
3. Database: Insert into `award_nominations` table
4. Email notifications sent via Resend:
   - Nominee confirmation with reference ID
   - Admin alert with full nomination details

**Response**: `GIRSD-AWD-2026-XXXX` nomination reference

---

### STAGE 2: Internal Evaluation
**Status**: `pending_review` → `selected` / `rejected`

**Process**:
- Girsd Honours Committee reviews all nominations
- Evaluation criteria: Scholarly contribution, institutional impact, leadership
- Duration: 4-6 weeks from submission deadline

---

### STAGE 3: Selection Notification
**Trigger**: Admin marks nomination as "selected"

**Process**:
1. Admin API: `/api/admin/awards/select` marks nomination
2. Database: `award_nominations.status = "selected"`
3. Email: Official selection invitation sent to nominee

**Email Content**:
- Congratulations message
- Official invitation details
- Direct link to registration form
- Pre-filled with nomination reference

**Status**: `selected`

---

### STAGE 4: Registration & Payment
**Entry Point**: `/awards/register?ref=GIRSD-AWD-2026-XXXX`

**Process**:
1. User completes final registration form (Sections A-D)
2. Form sections:
   - **Section A**: Official details & engraving specifications
   - **Section B**: Media & profile assets (headshot, logo, LinkedIn)
   - **Section C**: Attendance mode & logistics
   - **Section D**: Billing info & policy consents

3. **Media Upload**:
   - Headshot: Auto-uploaded to secure storage
   - Logo: Optional organization logo
   - Both validated (max 5MB, JPG/PNG/SVG)

4. **Attendance Mode Options**:
   - **In-Person**: Ceremony attendance
   - **Virtual**: Live stream + international courier
   - **Proxy**: Representative attends on awardee behalf

5. **Package Summary Display**:
   ```
   Total Payable: £255.00 GBP
   Inclusive:
   - Heavyweight laser-engraved trophy
   - Gold-embossed parchment certificate
   - Ceremony stage presentation
   - International courier delivery
   - Digital credential
   ```

---

### STAGE 5: Stripe Checkout Integration
**API**: `/api/awards/checkout`

**Process**:
1. Frontend sends registration payload to backend
2. Backend validates all required fields
3. Creates Stripe checkout session with:
   - Product: Award Registration
   - Amount: £255.00 GBP (25500 pence)
   - Metadata: Nomination reference, registration ID
   - Success URL: `/awards/register/success`
   - Cancel URL: `/awards/register`

4. Returns Stripe checkout URL to frontend
5. User redirected to Stripe-hosted checkout page

**Payment Processing**:
- Stripe handles card processing securely
- Payment intent created with unique ID
- Async webhook notifies backend on completion

---

### STAGE 6: Payment Confirmation Webhook
**API**: `/api/stripe/webhook`

**Process**:
1. Stripe sends webhook event `checkout.session.completed`
2. Backend verifies webhook signature
3. Processes award registration payment:
   - Updates `award_registrations.payment_status = "paid"`
   - Updates `award_nominations.status = "registered"`
   - Stores Stripe payment intent ID

4. **Email Notifications**:
   - User: Payment confirmation + receipt
   - Admin: Complete data summary with 100% details

---

### STAGE 7: Production Initialization
**Trigger**: Payment confirmation received

**Process**:
1. Production team receives notification
2. Trophy engraving queued
3. Certificate printing scheduled
4. Media assets prepared for stage banners
5. Courier packaging prepared (virtual attendees)

---

### STAGE 8: Ceremony Logistics
**Pre-Ceremony (7 days prior)**:
- Ceremony itinerary sent
- Live streaming link provided
- Virtual participants receive tracking info
- Media feature assets delivered

---

## 🔐 Security Features

### Payment Security
- PCI-compliant Stripe integration
- No card details stored in database
- Stripe webhook signature verification
- Idempotent webhook processing

### Data Security
- RLS policies on award tables
- Email validation before submission
- File upload validation (max size, file types)
- HTML sanitization for user inputs

### Identity Verification
- Nomination reference code system
- Email confirmation mandatory
- Payment linked to specific registration

---

## 📊 Database Schema

### award_nominations Table
```sql
id: uuid
nomination_ref: text (unique)
nominator_name: text
nominator_email: text
nomination_type: text
category: text
nominee_name: text
nominee_email: text
nominee_affiliation: text
nominee_country: text
statement: text
supporting_links: text
attachment_url: text
attachment_filename: text
status: pending_review | selected | rejected | registered
selected_at: timestamptz
registered_at: timestamptz
created_at: timestamptz
updated_at: timestamptz
```

### award_registrations Table
```sql
id: uuid
nomination_ref: text (foreign key)
award_category: text
full_name_engraving: text
designation: text
organization: text
department: text
country: text
city: text
email: text
phone_whatsapp: text
headshot_url: text
logo_url: text
linkedin_url: text
website_orcid_url: text
name_pronunciation: text
attendance_mode: in_person | virtual | proxy
proxy_name: text
proxy_relationship: text
proxy_email: text
proxy_phone: text
accompanying_guests_count: integer
guests_details: jsonb[]
shipping_address: jsonb
amount_gbp: integer (255)
payment_status: pending | paid | failed | refunded
stripe_session_id: text
stripe_payment_intent: text
billing_entity_type: individual | organization
billing_name: text
billing_address: text
vat_tax_number: text
media_consent: boolean
media_consent_at: timestamptz
no_refund_consent: boolean
no_refund_consent_at: timestamptz
created_at: timestamptz
updated_at: timestamptz
```

---

## 📧 Email Templates

### Nomination Receipt
- Sent to: Nominee + Nominator
- Content: Reference ID, status update, next steps
- Trigger: Upon successful nomination submission

### Selection Invitation
- Sent to: Nominee only
- Content: Congratulations, registration link
- Trigger: Admin marks nomination as selected

### Payment Confirmation
- Sent to: Awardee
- Content: Payment receipt, production timeline
- Trigger: Stripe webhook confirms payment

### Admin Complete Data
- Sent to: awards@globalrsd.co.uk
- Content: 100% data summary in HTML table
- Trigger: Payment confirmation received

---

## 🎯 Award Categories

Available categories include:
- Outstanding Research Leadership
- Innovative Teaching Excellence
- Academic Publishing Excellence
- Cybersecurity Innovation Award
- AI Governance Leadership
- Business Analysis Excellence
- Professional Development Champion
- And more...

---

## 💰 Pricing Structure

### Award Registration Fee
- **Amount**: £255.00 GBP (25,500 pence)
- **Inclusive**: 
  - Laser-engraved crystal/brass trophy
  - Gold-embossed parchment certificate
  - Ceremony stage presentation
  - International courier delivery
  - Digital credential
  - Permanent Hall of Fame listing

---

## 🔧 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/awards/nominate` | POST | Submit new nomination |
| `/api/awards/verify-nomination` | GET | Verify nomination reference |
| `/api/awards/upload` | POST | Upload media assets |
| `/api/awards/checkout` | POST | Create Stripe checkout session |
| `/api/admin/awards/list` | GET | List all nominations |
| `/api/admin/awards/select` | POST | Mark nomination as selected |
| `/api/verify-award` | POST | Verify award registration |
| `/api/stripe/webhook` | POST | Handle Stripe events |

---

## ⏱️ Workflow Timeline

```
Nomination Submission → 4-6 weeks → Selection → 1 week → Payment → Production → Ceremony
                            (Review)        (Notify)     (3 days)   (2-3 weeks)   (Date TBD)
```

---

## 🛠️ Frontend Components

### Award Nomination Page
- Form with 5 sections
- Status verification
- File upload handling
- Responsive design

### Award Registration Page
- Step-by-step form with progress indicators
- Media preview functionality
- Attendance mode selection
- Billing details section
- Policy acceptance checkboxes

### Success Page
- Payment confirmation
- Registration summary
- Next steps guide
- Contact information

---

## 📱 Mobile Responsiveness

- All forms are fully responsive
- Touch-friendly input fields
- Conditional field display based on mode
- Optimized file upload for mobile

---

## 🔄 State Management

### Nomination States
1. `pending_review` - Initial submission
2. `selected` - Admin acceptance
3. `rejected` - Admin rejection
4. `registered` - Payment completed

### Registration States
1. `pending` - Form submitted, payment pending
2. `paid` - Payment confirmed
3. `failed` - Payment failed
4. `refunded` - Payment refunded

---

## 🔒 Compliance

- GDPR-compliant data handling
- Email consent mandatory
- Media usage rights obtained
- Non-refund policy acknowledged
- Engraving finality confirmed

---

**GIRSD Awards System v2.0**  
*Global Institute of Research and Skills Development*  
*UK Registered Provider #788000*
"