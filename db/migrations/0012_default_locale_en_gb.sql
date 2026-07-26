-- FleetLever ships as a single English product, so new organizations and profiles should not
-- default to the Greek market settings the original schema carried. Existing rows keep whatever
-- they were created with; only the defaults for future inserts change.

alter table public.organizations alter column timezone set default 'Europe/London';
alter table public.profiles alter column timezone set default 'Europe/London';
