-- Version aligned with the already-applied remote migration history.
-- À appliquer uniquement au projet autorisé pour les données visées.
create table if not exists public.diabia_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb,
  updated_at timestamptz not null default now(),
  constraint diabia_snapshot_size check (payload is null or octet_length(payload::text) <= 2000000)
);
alter table public.diabia_snapshots enable row level security;
revoke all on public.diabia_snapshots from anon;
grant select,insert,update on public.diabia_snapshots to authenticated;
create policy diabia_snapshot_owner_select on public.diabia_snapshots for select to authenticated using ((select auth.uid())=user_id);
create policy diabia_snapshot_owner_insert on public.diabia_snapshots for insert to authenticated with check ((select auth.uid())=user_id);
create policy diabia_snapshot_owner_update on public.diabia_snapshots for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Révision atomique : un second appareil ne peut pas écraser une version plus récente.
-- Une suppression garde un marqueur afin de bloquer le renvoi d'une ancienne version hors ligne.
create or replace function public.diabia_sync_write(expected_revision bigint, new_payload jsonb, erase boolean default false)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare uid uuid := auth.uid(); result public.diabia_snapshots;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if expected_revision < 0 or expected_revision is null then raise exception 'invalid revision'; end if;
  if not erase and (new_payload is null or jsonb_typeof(new_payload)<>'object') then raise exception 'invalid payload'; end if;
  if expected_revision=0 then
    insert into public.diabia_snapshots(user_id,revision,payload) values(uid,1,case when erase then null else new_payload end)
    on conflict(user_id) do nothing returning * into result;
  else
    update public.diabia_snapshots set revision=revision+1,payload=case when erase then null else new_payload end,updated_at=now()
    where user_id=uid and revision=expected_revision returning * into result;
  end if;
  if result.user_id is null then return jsonb_build_object('conflict',true); end if;
  return jsonb_build_object('revision',result.revision,'updated_at',result.updated_at,'deleted',result.payload is null);
end $$;
revoke all on function public.diabia_sync_write(bigint,jsonb,boolean) from public,anon;
grant execute on function public.diabia_sync_write(bigint,jsonb,boolean) to authenticated;
