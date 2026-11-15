-- Applied through the Supabase migration tool. No row is changed or deleted.
-- RLS does not protect TRUNCATE; remove inherited/default excessive grants too.
revoke all privileges on table public.diabia_snapshots, public.diabia_sync_tests from public, anon, authenticated;
grant select, insert, update on table public.diabia_snapshots, public.diabia_sync_tests to authenticated;
