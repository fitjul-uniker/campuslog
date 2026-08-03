begin;

create table if not exists public.favorite_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null check (
    item_type in ('experience', 'tracked_activity', 'recommendation')
  ),
  item_id text not null check (char_length(btrim(item_id)) > 0),
  pinned_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create index if not exists favorite_items_user_pinned_at_idx
  on public.favorite_items (user_id, pinned_at desc);

alter table public.favorite_items enable row level security;
alter table public.favorite_items force row level security;

grant select, insert, update, delete on public.favorite_items to authenticated;

drop policy if exists "favorite_items_select_own" on public.favorite_items;
create policy "favorite_items_select_own"
  on public.favorite_items for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "favorite_items_insert_own" on public.favorite_items;
create policy "favorite_items_insert_own"
  on public.favorite_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "favorite_items_update_own" on public.favorite_items;
create policy "favorite_items_update_own"
  on public.favorite_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "favorite_items_delete_own" on public.favorite_items;
create policy "favorite_items_delete_own"
  on public.favorite_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.delete_favorites_for_removed_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.favorite_items
  where user_id = old.user_id
    and item_type = tg_argv[0]
    and item_id = old.id;

  return old;
end;
$$;

revoke all on function public.delete_favorites_for_removed_item() from public;
revoke all on function public.delete_favorites_for_removed_item() from anon;
revoke all on function public.delete_favorites_for_removed_item() from authenticated;

drop trigger if exists experiences_delete_favorites on public.experiences;
create trigger experiences_delete_favorites
  after delete on public.experiences
  for each row execute function public.delete_favorites_for_removed_item('experience');

drop trigger if exists tracked_activities_delete_favorites on public.tracked_activities;
create trigger tracked_activities_delete_favorites
  after delete on public.tracked_activities
  for each row execute function public.delete_favorites_for_removed_item('tracked_activity');

drop trigger if exists recommendations_delete_favorites on public.recommendations;
create trigger recommendations_delete_favorites
  after delete on public.recommendations
  for each row execute function public.delete_favorites_for_removed_item('recommendation');

commit;
