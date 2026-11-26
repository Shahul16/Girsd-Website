-- Award workflow review metadata and paid-order classification.
alter table public.orders drop constraint if exists orders_kind_check;
alter table public.orders
  add constraint orders_kind_check
  check (kind in ('ticket', 'course', 'membership', 'award_registration', 'unknown'));

alter table public.award_nominations
  add column if not exists reviewer_notes text,
  add column if not exists reviewed_at timestamptz;
