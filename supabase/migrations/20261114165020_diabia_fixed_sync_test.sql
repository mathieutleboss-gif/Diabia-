-- Schéma déclaratif du test fictif, appliqué par l'outil de migrations Supabase.
-- Aucun champ libre ni mesure médicale n'est stocké dans cette table.
create table public.diabia_sync_tests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision>0),
  updated_at timestamptz not null default now()
);
alter table public.diabia_sync_tests enable row level security;
revoke all on public.diabia_sync_tests from anon;
grant select,insert,update on public.diabia_sync_tests to authenticated;
create policy diabia_test_select on public.diabia_sync_tests for select to authenticated using ((select auth.uid())=user_id);
create policy diabia_test_insert on public.diabia_sync_tests for insert to authenticated with check ((select auth.uid())=user_id);
create policy diabia_test_update on public.diabia_sync_tests for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.diabia_sync_test_write(expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); result public.diabia_sync_tests;
begin
 if uid is null then raise exception 'authentication required'; end if;
 if expected_revision is null or expected_revision<0 then raise exception 'invalid revision'; end if;
 if expected_revision=0 then
  insert into public.diabia_sync_tests(user_id) values(uid) on conflict(user_id) do nothing returning * into result;
 else
  update public.diabia_sync_tests set revision=revision+1,updated_at=clock_timestamp()
  where user_id=uid and revision=expected_revision returning * into result;
 end if;
 if result.user_id is null then return jsonb_build_object('conflict',true); end if;
 return jsonb_build_object('revision',result.revision,'updated_at',result.updated_at);
end $$;
revoke all on function public.diabia_sync_test_write(bigint) from public,anon;
grant execute on function public.diabia_sync_test_write(bigint) to authenticated;
