-- Align award registration with the virtual-only GBP 255 fee.
alter table public.award_registrations
  alter column amount_gbp set default 255;

update public.award_registrations
set amount_gbp = 255
where payment_status = 'pending';

-- Physical award items and shipping are quoted and invoiced separately.
alter table public.award_registrations
  add column if not exists physical_fulfillment_items text[] not null default '{}',
  add column if not exists physical_fulfillment_status text not null default 'not_requested',
  add column if not exists physical_fulfillment_quote_gbp numeric(10, 2),
  add column if not exists physical_fulfillment_paid_at timestamptz,
  add column if not exists physical_fulfillment_invoice_url text,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists admin_notification_email_sent_at timestamptz,
  add column if not exists payment_review_required boolean not null default false,
  add column if not exists payment_review_reason text;

alter table public.award_registrations
  drop constraint if exists award_registrations_physical_fulfillment_status_check;

alter table public.award_registrations
  add constraint award_registrations_physical_fulfillment_status_check
  check (physical_fulfillment_status in ('not_requested', 'requested', 'invoicing', 'invoiced', 'paid'));

alter table public.award_registrations
  drop constraint if exists award_registrations_physical_fulfillment_quote_gbp_check;

alter table public.award_registrations
  alter column physical_fulfillment_quote_gbp type numeric(10, 2)
  using physical_fulfillment_quote_gbp::numeric(10, 2);

alter table public.award_registrations
  add constraint award_registrations_physical_fulfillment_quote_gbp_check
  check (physical_fulfillment_quote_gbp is null or physical_fulfillment_quote_gbp between 0.01 and 10000);

alter table public.award_registrations
  add column if not exists physical_fulfillment_invoice_id text;

create unique index if not exists award_registrations_fulfillment_invoice_idx
  on public.award_registrations (physical_fulfillment_invoice_id)
  where physical_fulfillment_invoice_id is not null;

alter table public.award_nominations
  add column if not exists nominee_email_sent_at timestamptz,
  add column if not exists admin_email_sent_at timestamptz,
  add column if not exists decision_email_sent_at timestamptz;

alter table public.membership_applications
  add column if not exists decision_email_sent_at timestamptz;

-- Applicant evidence and award nomination documents must never be public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'membership-verifications',
  'membership-verifications',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'award-documents',
  'award-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Verification codes are HMACs tied to an authenticated user and exact email.
create table if not exists public.membership_email_verifications (
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, email)
);

alter table public.membership_email_verifications enable row level security;
revoke all on public.membership_email_verifications from anon, authenticated;
create index if not exists membership_email_verifications_expiry_idx
  on public.membership_email_verifications (expires_at);

-- Remove legacy plaintext one-time codes and any code fragments stored in reviewer notes.
drop policy if exists "Users can read own verification codes" on public.email_verification_codes;
revoke all on public.email_verification_codes from anon, authenticated;
delete from public.email_verification_codes;

update public.membership_applications
   set reviewer_notes = nullif(
     btrim(
       regexp_replace(
         reviewer_notes,
         '(^|[[:space:]]*\|[[:space:]]*)EmailToken:[0-9]{6}:[^[:space:]\|]+',
         '',
         'g'
       ),
       ' |'
     ),
     ''
   )
 where reviewer_notes like '%EmailToken:%';

create or replace function public.submit_membership_application(
  p_application jsonb,
  p_require_email_verification boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (p_application->>'user_id')::uuid;
  v_email text := lower(p_application->>'email');
  v_verification public.membership_email_verifications%rowtype;
  v_id text := p_application->>'id';
  v_is_verified boolean;
begin
  if v_user_id is null or v_email is null or v_id is null then
    raise exception 'Invalid membership application data.';
  end if;

  select *
    into v_verification
    from public.membership_email_verifications
   where user_id = v_user_id
     and email = v_email
     and verified_at is not null
     and consumed_at is null
     and expires_at > clock_timestamp()
   for update;

  v_is_verified := found;
  if p_require_email_verification and not v_is_verified then
    raise exception 'membership_email_verification_required';
  end if;

  insert into public.membership_applications
  select (jsonb_populate_record(null::public.membership_applications, p_application)).*;

  if v_is_verified then
    update public.membership_email_verifications
       set consumed_at = clock_timestamp()
     where user_id = v_user_id
       and email = v_email;
  end if;

  return v_id;
end;
$$;

revoke all on function public.submit_membership_application(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.submit_membership_application(jsonb, boolean) to service_role;

create or replace function public.verify_membership_email_code(
  p_user_id uuid,
  p_email text,
  p_code_hash text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verification public.membership_email_verifications%rowtype;
begin
  select *
    into v_verification
    from public.membership_email_verifications
   where user_id = p_user_id
     and email = lower(p_email)
   for update;

  if not found then
    return 'missing';
  end if;
  if v_verification.expires_at <= clock_timestamp() or v_verification.consumed_at is not null then
    return 'expired';
  end if;
  if v_verification.verified_at is not null then
    return 'verified';
  end if;
  if v_verification.attempts >= 5 then
    return 'locked';
  end if;

  if v_verification.code_hash <> p_code_hash then
    update public.membership_email_verifications
       set attempts = attempts + 1
     where user_id = p_user_id
       and email = lower(p_email);
    return 'invalid';
  end if;

  update public.membership_email_verifications
     set verified_at = clock_timestamp()
   where user_id = p_user_id
     and email = lower(p_email);
  return 'verified';
end;
$$;

revoke all on function public.verify_membership_email_code(uuid, text, text) from public, anon, authenticated;
grant execute on function public.verify_membership_email_code(uuid, text, text) to service_role;

-- Keep API rate limits consistent across app instances without storing raw IPs.
create table if not exists public.api_rate_limits (
  rate_limit_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;
create index if not exists api_rate_limits_updated_idx on public.api_rate_limits (updated_at);

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, retry_after integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_started_at timestamptz;
  v_count integer;
begin
  if p_key is null or length(p_key) > 160 or p_window_seconds < 1 or p_max_requests < 1 then
    raise exception 'Invalid rate limit parameters.';
  end if;

  insert into public.api_rate_limits (rate_limit_key, window_started_at, request_count, updated_at)
  values (p_key, v_now, 1, v_now)
  on conflict (rate_limit_key) do update
    set window_started_at = case
          when public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now
            then v_now
          else public.api_rate_limits.window_started_at
        end,
        request_count = case
          when public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now
            then 1
          else public.api_rate_limits.request_count + 1
        end,
        updated_at = v_now
  returning public.api_rate_limits.window_started_at, public.api_rate_limits.request_count
    into v_started_at, v_count;

  if v_count = 1 then
    delete from public.api_rate_limits
    where updated_at < v_now - interval '1 day'
      and rate_limit_key <> p_key;
  end if;

  return query
    select
      v_count <= p_max_requests,
      greatest(1, ceil(extract(epoch from (v_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer),
      greatest(0, p_max_requests - v_count);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

-- A submitted/paid registration has separate, retryable email-notification state.
create index if not exists award_registrations_fulfillment_status_idx
  on public.award_registrations (physical_fulfillment_status);

create or replace function public.reserve_award_fulfillment_quote(
  p_registration_id uuid,
  p_quote_gbp numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved boolean;
begin
  if p_quote_gbp is null or p_quote_gbp < 0.01 or p_quote_gbp > 10000 then
    raise exception 'Invalid award fulfillment quote.';
  end if;

  update public.award_registrations
     set physical_fulfillment_status = 'invoicing',
         physical_fulfillment_quote_gbp = p_quote_gbp,
         updated_at = clock_timestamp()
   where id = p_registration_id
     and payment_status = 'paid'
     and physical_fulfillment_invoice_id is null
     and (
       physical_fulfillment_status = 'requested'
       or (
         physical_fulfillment_status = 'invoicing'
         and physical_fulfillment_quote_gbp = p_quote_gbp
       )
     )
  returning true into v_reserved;

  return coalesce(v_reserved, false);
end;
$$;

revoke all on function public.reserve_award_fulfillment_quote(uuid, numeric) from public, anon, authenticated;
grant execute on function public.reserve_award_fulfillment_quote(uuid, numeric) to service_role;
