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
