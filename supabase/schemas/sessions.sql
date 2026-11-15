-- Schéma déclaratif : révocation immédiate des sessions sur les routes et tables Diabia.
create schema if not exists diabia_private;
revoke all on schema diabia_private from public,anon;
grant usage on schema diabia_private to authenticated;
create function diabia_private.session_active()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from auth.sessions s where s.user_id=auth.uid()
   and s.id::text=auth.jwt()->>'session_id'
   and (s.not_after is null or s.not_after>now())
 );
$$;
revoke all on function diabia_private.session_active() from public,anon;
grant execute on function diabia_private.session_active() to authenticated;
create function public.diabia_session_active()
returns boolean language sql stable security invoker set search_path='' as $$
 select diabia_private.session_active();
$$;
revoke all on function public.diabia_session_active() from public,anon;
grant execute on function public.diabia_session_active() to authenticated;
alter policy diabia_snapshot_owner_select on public.diabia_snapshots using ((select auth.uid())=user_id and (select public.diabia_session_active()));
alter policy diabia_snapshot_owner_insert on public.diabia_snapshots with check ((select auth.uid())=user_id and (select public.diabia_session_active()));
alter policy diabia_snapshot_owner_update on public.diabia_snapshots using ((select auth.uid())=user_id and (select public.diabia_session_active())) with check ((select auth.uid())=user_id and (select public.diabia_session_active()));
alter policy diabia_test_select on public.diabia_sync_tests using ((select auth.uid())=user_id and (select public.diabia_session_active()));
alter policy diabia_test_insert on public.diabia_sync_tests with check ((select auth.uid())=user_id and (select public.diabia_session_active()));
alter policy diabia_test_update on public.diabia_sync_tests using ((select auth.uid())=user_id and (select public.diabia_session_active())) with check ((select auth.uid())=user_id and (select public.diabia_session_active()));
