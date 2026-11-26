-- Email verification codes table
-- Store temporary verification codes for email confirmations

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  used_at timestamptz,
  attempts integer not null default 0,
  max_attempts integer not null default 3
);

alter table public.email_verification_codes enable row level security;

-- Users can read their own codes
create policy "Users can read own verification codes" on public.email_verification_codes
  for select using (auth.uid() = user_id);

-- Service role can manage all codes (for verification and cleanup)
-- No insert/update permissions for regular users - only API routes handle creation

-- Index for lookups
create index if not exists evc_email_idx on public.email_verification_codes (email);
create index if not exists evc_user_id_idx on public.email_verification_codes (user_id);
create index if not exists evc_expires_at_idx on public.email_verification_codes (expires_at);
create index if not exists evc_code_idx on public.email_verification_codes (code);

-- Function to clean up expired codes (run periodically)
create or replace function cleanup_expired_verification_codes()
returns void as $$
begin
  delete from public.email_verification_codes
  where expires_at < now();
end;
$$ language plpgsql security definer;

-- Schedule cleanup job (requires pg_cron extension)
-- select cron.schedule('cleanup-verification-codes', '0 * * * *', 'select cleanup_expired_verification_codes()');
