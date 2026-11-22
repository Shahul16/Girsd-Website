-- GIRSD database schema
-- Run once in Supabase → SQL Editor → New query → paste → Run

-- ============================================================
-- ORDERS: every paid Stripe checkout (tickets, courses, memberships)
-- Written ONLY by the Stripe webhook (service role). Members read their own.
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  kind text not null check (kind in ('ticket', 'course', 'membership', 'unknown')),
  title text not null,
  slug text,
  tier text,
  quantity integer not null default 1,
  amount integer not null default 0,          -- pence (GBP)
  currency text not null default 'gbp',
  stripe_session_id text unique,
  status text not null default 'paid',
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Members can read their own orders (dashboard)
drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies for regular users:
-- only the service-role key (webhook + API routes) can write.

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_kind_idx on public.orders (kind);

-- ============================================================
-- CERTIFICATES: public verification lookup (/verify-certificate)
-- Add rows via Supabase Table Editor as you issue certificates.
-- ============================================================
create table if not exists public.certificates (
  id text primary key,                         -- e.g. GIRSD-2026-001
  name text not null,                          -- recipient full name
  course text not null,                        -- course or event title
  issued_date date not null default current_date
);

alter table public.certificates enable row level security;
-- No public policies: lookups go through the server API (service role),
-- so the full list can never be scraped.

-- ============================================================
-- MEMBERSHIP APPLICATIONS & VERIFICATION
-- Explicit approval gate: Registration/payment DOES NOT activate membership
-- until administrative verification is complete.
-- ============================================================
create table if not exists public.membership_applications (
  id text primary key,                               -- e.g. GIRSD-MEM-2026-000123
  user_id uuid references auth.users (id) on delete cascade,
  applicant_name text not null,
  email text not null,
  email_type text not null default 'personal_public', -- 'corporate_institutional' or 'personal_public'
  email_verified boolean not null default false,
  phone text,
  institution text not null,
  department text,
  role_title text not null,
  tier_id text not null,
  tier_name text not null,
  annual_fee integer not null default 0,
  proof_type text,                                   -- 'student_id', 'faculty_staff_id', etc.
  document_filename text,
  document_file_url text,
  payment_status text not null default 'unpaid',     -- 'unpaid', 'paid', 'waived'
  stripe_session_id text,
  status text not null default 'APPLICATION_SUBMITTED', 
  -- Lifecycle: REGISTERED, APPLICATION_SUBMITTED, PAYMENT_PENDING, PAYMENT_COMPLETED,
  -- VERIFICATION_REQUIRED, UNDER_REVIEW, APPROVED, ACTIVE_MEMBER, REJECTED, SUSPENDED, EXPIRED, CANCELLED
  reviewer_notes text,
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  membership_id text unique,                         -- e.g. GIRSD-M-2026-1042 (assigned upon approval)
  valid_from timestamptz,
  valid_until timestamptz,
  audit_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.membership_applications enable row level security;

-- Applicants can view their own application status
drop policy if exists "Users read own membership applications" on public.membership_applications;
create policy "Users read own membership applications"
  on public.membership_applications for select
  using (auth.uid() = user_id);

-- Only service role writes to membership_applications via validated APIs
create index if not exists mem_app_user_id_idx on public.membership_applications (user_id);
create index if not exists mem_app_status_idx on public.membership_applications (status);
create index if not exists mem_app_email_idx on public.membership_applications (email);
create index if not exists mem_app_membership_id_idx on public.membership_applications (membership_id);


-- ============================================================
-- AWARDS: Nominations & Registrations (£255 GBP)
-- ============================================================
create table if not exists public.award_nominations (
  id uuid primary key default gen_random_uuid(),
  nomination_ref text unique not null,              -- e.g. GIRSD-AWD-2026-XXXX
  nominator_name text not null,
  nominator_email text not null,
  nomination_type text not null default 'Self-nomination',
  category text not null,
  nominee_name text not null,
  nominee_email text not null,
  nominee_affiliation text,
  nominee_country text,
  statement text,
  supporting_links text,
  attachment_url text,
  attachment_filename text,
  status text not null default 'pending_review' check (status in ('pending_review', 'selected', 'rejected', 'registered')),
  selected_at timestamptz,
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.award_nominations enable row level security;
create index if not exists award_nominations_ref_idx on public.award_nominations (nomination_ref);
create index if not exists award_nominations_status_idx on public.award_nominations (status);
create index if not exists award_nominations_email_idx on public.award_nominations (nominee_email);

create table if not exists public.award_registrations (
  id uuid primary key default gen_random_uuid(),
  nomination_ref text not null references public.award_nominations (nomination_ref) on delete cascade,
  award_category text not null,
  full_name_engraving text not null,
  designation text not null,
  organization text not null,
  department text,
  country text not null,
  city text not null,
  email text not null,
  phone_whatsapp text not null,
  headshot_url text not null,
  logo_url text,
  linkedin_url text,
  website_orcid_url text,
  name_pronunciation text,
  attendance_mode text not null check (attendance_mode in ('in_person', 'virtual', 'proxy')),
  proxy_name text,
  proxy_relationship text,
  proxy_email text,
  proxy_phone text,
  accompanying_guests_count integer not null default 0,
  guests_details jsonb not null default '[]'::jsonb,
  shipping_address jsonb,
  amount_gbp integer not null default 255,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id text unique,
  stripe_payment_intent text,
  billing_entity_type text not null check (billing_entity_type in ('individual', 'organization')),
  billing_name text not null,
  billing_address text not null,
  vat_tax_number text,
  media_consent boolean not null default false,
  media_consent_at timestamptz,
  no_refund_consent boolean not null default false,
  no_refund_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.award_registrations enable row level security;
create index if not exists award_registrations_ref_idx on public.award_registrations (nomination_ref);
create index if not exists award_registrations_stripe_idx on public.award_registrations (stripe_session_id);
create index if not exists award_registrations_status_idx on public.award_registrations (payment_status);
