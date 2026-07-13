-- CampusLog 2nd MVP user data foundation.
-- This migration keeps browser-local entity ids as text and scopes every row by auth user.

create schema if not exists "extensions";
create extension if not exists "pgcrypto" with schema "extensions";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.experiences (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  title text not null check (char_length(btrim(title)) > 0),
  period text not null check (char_length(btrim(period)) > 0),
  role text not null check (char_length(btrim(role)) > 0),
  description text not null check (char_length(btrim(description)) > 0),
  achievements text not null default '',
  related_links jsonb not null default '[]'::jsonb check (jsonb_typeof(related_links) = 'array'),
  analysis_status text not null default 'unanalyzed' check (
    analysis_status in ('unanalyzed', 'analyzed', 'needs_reanalysis')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.tracked_activities (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  title text not null check (char_length(btrim(title)) > 0),
  description text not null check (char_length(btrim(description)) > 0),
  start_date date not null,
  expected_end_date date,
  status text not null check (status in ('planned', 'active', 'completed')),
  completed_at date,
  generated_experience_id text,
  synthesis_status text not null default 'idle' check (
    synthesis_status in ('idle', 'processing', 'draft_ready', 'failed', 'saved')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, generated_experience_id)
    references public.experiences (user_id, id)
    on update cascade
    on delete restrict,
  check (expected_end_date is null or expected_end_date >= start_date),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  check (generated_experience_id is null or status = 'completed'),
  check (
    (generated_experience_id is null and synthesis_status <> 'saved')
    or (generated_experience_id is not null and synthesis_status = 'saved')
  )
);

create table public.daily_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  activity_id text not null,
  date date not null,
  content text not null check (char_length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, activity_id)
    references public.tracked_activities (user_id, id)
    on update cascade
    on delete cascade
);

create table public.experience_synthesis_drafts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity_id text not null,
  description text not null,
  achievements text[] not null default array[]::text[],
  used_log_ids text[] not null default array[]::text[],
  evidence_gaps text[] not null default array[]::text[],
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_id),
  foreign key (user_id, activity_id)
    references public.tracked_activities (user_id, id)
    on update cascade
    on delete cascade
);

create table public.experience_analyses (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  experience_id text not null,
  summary text not null,
  competency_tags text[] not null default array[]::text[],
  achievements text[] not null default array[]::text[],
  keywords text[] not null default array[]::text[],
  generated_at timestamptz not null default now(),
  source_experience_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, experience_id),
  foreign key (user_id, experience_id)
    references public.experiences (user_id, id)
    on update cascade
    on delete cascade
);

create table public.recommendations (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  purpose text not null check (
    purpose in ('cover_letter', 'portfolio', 'interview', 'activity_application', 'other')
  ),
  prompt text not null check (char_length(btrim(prompt)) > 0),
  recommended_experience_id text not null,
  recommended_experience_title text not null,
  reason text not null,
  related_tags text[] not null default array[]::text[],
  highlighted_achievement text not null,
  usage_direction text not null,
  draft_sentence text not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, recommended_experience_id)
    references public.experiences (user_id, id)
    on update cascade
    on delete cascade
);

create table public.local_data_migration_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_migration_id text not null,
  source_version text not null default 'campuslog-localStorage-v1',
  status text not null default 'planned' check (
    status in ('planned', 'processing', 'completed', 'partially_failed', 'failed', 'canceled')
  ),
  total_count integer not null default 0 check (total_count >= 0),
  succeeded_count integer not null default 0 check (succeeded_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, client_migration_id)
);

create table public.local_data_migration_items (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  batch_id uuid not null,
  entity_type text not null check (
    entity_type in (
      'experience',
      'tracked_activity',
      'daily_log',
      'experience_analysis',
      'recommendation',
      'synthesis_draft'
    )
  ),
  local_storage_key text not null,
  local_id text not null,
  target_table text,
  target_id text,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'succeeded', 'failed', 'skipped')
  ),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, batch_id)
    references public.local_data_migration_batches (user_id, id)
    on update cascade
    on delete cascade,
  unique (user_id, entity_type, local_id)
);

create unique index tracked_activities_generated_experience_once
  on public.tracked_activities (user_id, generated_experience_id)
  where generated_experience_id is not null;

create index experiences_user_updated_at_idx
  on public.experiences (user_id, updated_at desc);

create index tracked_activities_user_status_updated_at_idx
  on public.tracked_activities (user_id, status, updated_at desc);

create index daily_logs_user_activity_date_idx
  on public.daily_logs (user_id, activity_id, date desc);

create index daily_logs_user_date_idx
  on public.daily_logs (user_id, date desc);

create index experience_analyses_user_generated_at_idx
  on public.experience_analyses (user_id, generated_at desc);

create index recommendations_user_generated_at_idx
  on public.recommendations (user_id, generated_at desc);

create index local_data_migration_items_batch_idx
  on public.local_data_migration_items (user_id, batch_id, status);

create trigger set_experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

create trigger set_tracked_activities_updated_at
  before update on public.tracked_activities
  for each row execute function public.set_updated_at();

create trigger set_daily_logs_updated_at
  before update on public.daily_logs
  for each row execute function public.set_updated_at();

create trigger set_experience_synthesis_drafts_updated_at
  before update on public.experience_synthesis_drafts
  for each row execute function public.set_updated_at();

create trigger set_experience_analyses_updated_at
  before update on public.experience_analyses
  for each row execute function public.set_updated_at();

create trigger set_recommendations_updated_at
  before update on public.recommendations
  for each row execute function public.set_updated_at();

create trigger set_local_data_migration_batches_updated_at
  before update on public.local_data_migration_batches
  for each row execute function public.set_updated_at();

create trigger set_local_data_migration_items_updated_at
  before update on public.local_data_migration_items
  for each row execute function public.set_updated_at();

alter table public.experiences enable row level security;
alter table public.tracked_activities enable row level security;
alter table public.daily_logs enable row level security;
alter table public.experience_synthesis_drafts enable row level security;
alter table public.experience_analyses enable row level security;
alter table public.recommendations enable row level security;
alter table public.local_data_migration_batches enable row level security;
alter table public.local_data_migration_items enable row level security;

alter table public.experiences force row level security;
alter table public.tracked_activities force row level security;
alter table public.daily_logs force row level security;
alter table public.experience_synthesis_drafts force row level security;
alter table public.experience_analyses force row level security;
alter table public.recommendations force row level security;
alter table public.local_data_migration_batches force row level security;
alter table public.local_data_migration_items force row level security;

grant select, insert, update, delete on public.experiences to authenticated;
grant select, insert, update, delete on public.tracked_activities to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.experience_synthesis_drafts to authenticated;
grant select, insert, update, delete on public.experience_analyses to authenticated;
grant select, insert, update, delete on public.recommendations to authenticated;
grant select, insert, update, delete on public.local_data_migration_batches to authenticated;
grant select, insert, update, delete on public.local_data_migration_items to authenticated;

create policy "experiences_select_own"
  on public.experiences for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "experiences_insert_own"
  on public.experiences for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "experiences_update_own"
  on public.experiences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "experiences_delete_own"
  on public.experiences for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "tracked_activities_select_own"
  on public.tracked_activities for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "tracked_activities_insert_own"
  on public.tracked_activities for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "tracked_activities_update_own"
  on public.tracked_activities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tracked_activities_delete_own"
  on public.tracked_activities for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_logs_select_own"
  on public.daily_logs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_logs_insert_own"
  on public.daily_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "daily_logs_update_own"
  on public.daily_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "daily_logs_delete_own"
  on public.daily_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "experience_synthesis_drafts_select_own"
  on public.experience_synthesis_drafts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "experience_synthesis_drafts_insert_own"
  on public.experience_synthesis_drafts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "experience_synthesis_drafts_update_own"
  on public.experience_synthesis_drafts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "experience_synthesis_drafts_delete_own"
  on public.experience_synthesis_drafts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "experience_analyses_select_own"
  on public.experience_analyses for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "experience_analyses_insert_own"
  on public.experience_analyses for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "experience_analyses_update_own"
  on public.experience_analyses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "experience_analyses_delete_own"
  on public.experience_analyses for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "recommendations_select_own"
  on public.recommendations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "recommendations_insert_own"
  on public.recommendations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "recommendations_update_own"
  on public.recommendations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "recommendations_delete_own"
  on public.recommendations for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "local_data_migration_batches_select_own"
  on public.local_data_migration_batches for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "local_data_migration_batches_insert_own"
  on public.local_data_migration_batches for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "local_data_migration_batches_update_own"
  on public.local_data_migration_batches for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "local_data_migration_batches_delete_own"
  on public.local_data_migration_batches for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "local_data_migration_items_select_own"
  on public.local_data_migration_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "local_data_migration_items_insert_own"
  on public.local_data_migration_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "local_data_migration_items_update_own"
  on public.local_data_migration_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "local_data_migration_items_delete_own"
  on public.local_data_migration_items for delete to authenticated
  using ((select auth.uid()) = user_id);
