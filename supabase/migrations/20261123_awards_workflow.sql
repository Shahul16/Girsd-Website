-- ============================================================
-- GIRSD AWARDS WORKFLOW MIGRATION
-- Stage 1: Award Nominations & Selection
-- Stage 2: Final Award Registrations (£255 GBP)
-- Storage Bucket: awards-assets
-- ============================================================

-- 1. AWARD NOMINATIONS TABLE
create table if not exists public.award_nominations (
  id uuid primary key default gen_random_uuid(),
  nomination_ref text unique not null,              -- e.g. GIRSD-AWD-2026-XXXX
  nominator_name text not null,
  nominator_email text not null,
  nomination_type text not null default 'Self-nomination', -- 'Self-nomination' or 'Nominating someone else'
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

-- Public can read limited nomination details for verification via server API
-- Direct table access is restricted to service-role key
create index if not exists award_nominations_ref_idx on public.award_nominations (nomination_ref);
create index if not exists award_nominations_status_idx on public.award_nominations (status);
create index if not exists award_nominations_email_idx on public.award_nominations (nominee_email);

-- 2. AWARD REGISTRATIONS TABLE (£255 GBP)
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

-- 3. STORAGE BUCKET FOR AWARDS ASSETS (HEADSHOTS, LOGOS & ATTACHMENTS)
insert into storage.buckets (id, name, public)
values ('awards-assets', 'awards-assets', true)
on conflict (id) do update set public = true;

-- Policy to allow public read access to uploaded media
drop policy if exists "Public Access for awards-assets" on storage.objects;
create policy "Public Access for awards-assets"
  on storage.objects for select
  using (bucket_id = 'awards-assets');

-- Policy to allow authenticated/service-role uploads
drop policy if exists "Service upload for awards-assets" on storage.objects;
create policy "Service upload for awards-assets"
  on storage.objects for insert
  with check (bucket_id = 'awards-assets');

