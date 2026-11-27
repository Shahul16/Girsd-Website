-- Keep the database default aligned with the current award registration fee.
alter table public.award_registrations
  alter column amount_gbp set default 1;
