-- Owner-managed site content and enquiry records.
-- Public reads and all writes go through server routes using the service role.
create table if not exists public.site_content (
  collection text primary key check (
    collection in (
      'site',
      'hero',
      'events',
      'courses',
      'awards',
      'news',
      'pages',
      'promotions',
      'careers',
      'membership_tiers'
    )
  ),
  data jsonb not null,
  published boolean not null default true,
  version integer not null default 1 check (version > 0),
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
create index if not exists site_content_published_idx
  on public.site_content (published);

create table if not exists public.website_enquiries (
  id uuid primary key default gen_random_uuid(),
  form_name text not null,
  visitor_name text,
  visitor_email text,
  fields jsonb not null default '{}'::jsonb,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.website_enquiries enable row level security;
create index if not exists website_enquiries_created_at_idx
  on public.website_enquiries (created_at desc);
create index if not exists website_enquiries_status_idx
  on public.website_enquiries (status);

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;
drop policy if exists "Users read own member profile" on public.member_profiles;
create policy "Users read own member profile"
  on public.member_profiles for select
  using (auth.uid() = user_id);

create table if not exists public.abstract_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_slug text not null,
  event_title text not null,
  title text not null,
  track text,
  abstract text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.abstract_submissions enable row level security;
drop policy if exists "Users read own abstract submissions" on public.abstract_submissions;
create policy "Users read own abstract submissions"
  on public.abstract_submissions for select
  using (auth.uid() = user_id);
create index if not exists abstract_submissions_user_created_idx
  on public.abstract_submissions (user_id, created_at desc);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id text not null,
  job_title text not null,
  profile_snapshot jsonb not null default '{}'::jsonb,
  cv_path text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'shortlisted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;
drop policy if exists "Users read own job applications" on public.job_applications;
create policy "Users read own job applications"
  on public.job_applications for select
  using (auth.uid() = user_id);
create index if not exists job_applications_user_created_idx
  on public.job_applications (user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-files',
  'member-files',
  false,
  15728640,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- No anon/authenticated insert, update, or delete policies are granted.
-- Uploads and content edits are performed only by authenticated server routes.
