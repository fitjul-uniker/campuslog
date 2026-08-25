begin;

create table if not exists public.dashboard_activity_pins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity_id text not null,
  pinned_at timestamptz not null default now(),
  primary key (user_id, activity_id),
  foreign key (user_id, activity_id)
    references public.tracked_activities (user_id, id)
    on update cascade
    on delete cascade
);

create index if not exists dashboard_activity_pins_user_pinned_at_idx
  on public.dashboard_activity_pins (user_id, pinned_at desc);

alter table public.dashboard_activity_pins enable row level security;
alter table public.dashboard_activity_pins force row level security;

grant select, insert, update, delete on public.dashboard_activity_pins to authenticated;

drop policy if exists "dashboard_activity_pins_select_own" on public.dashboard_activity_pins;
create policy "dashboard_activity_pins_select_own"
  on public.dashboard_activity_pins for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "dashboard_activity_pins_insert_own" on public.dashboard_activity_pins;
create policy "dashboard_activity_pins_insert_own"
  on public.dashboard_activity_pins for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "dashboard_activity_pins_update_own" on public.dashboard_activity_pins;
create policy "dashboard_activity_pins_update_own"
  on public.dashboard_activity_pins for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "dashboard_activity_pins_delete_own" on public.dashboard_activity_pins;
create policy "dashboard_activity_pins_delete_own"
  on public.dashboard_activity_pins for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
