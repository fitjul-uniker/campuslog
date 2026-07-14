-- CampusLog answer draft generation.
-- Drafts are stored separately from recommendations so v1/v2 recommendation rows remain compatible.

create table if not exists public.answer_drafts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recommendation_id text not null,
  experience_id text not null,
  schema_version text not null default 'v1' check (
    schema_version in ('v1')
  ),
  prompt_version text not null default '',
  model text not null default '',
  source_match_rank integer not null check (source_match_rank >= 1),
  drafts jsonb not null default '[]'::jsonb check (
    jsonb_typeof(drafts) = 'array'
  ),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, recommendation_id, experience_id),
  foreign key (user_id, recommendation_id)
    references public.recommendations (user_id, id)
    on update cascade
    on delete cascade,
  foreign key (user_id, experience_id)
    references public.experiences (user_id, id)
    on update cascade
    on delete cascade
);

create index if not exists answer_drafts_user_recommendation_generated_at_idx
  on public.answer_drafts (user_id, recommendation_id, generated_at desc);

drop trigger if exists set_answer_drafts_updated_at on public.answer_drafts;
create trigger set_answer_drafts_updated_at
  before update on public.answer_drafts
  for each row execute function public.set_updated_at();

alter table public.answer_drafts enable row level security;
alter table public.answer_drafts force row level security;

grant select, insert, update, delete on public.answer_drafts to authenticated;

drop policy if exists "answer_drafts_select_own" on public.answer_drafts;
create policy "answer_drafts_select_own"
  on public.answer_drafts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "answer_drafts_insert_own" on public.answer_drafts;
create policy "answer_drafts_insert_own"
  on public.answer_drafts for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "answer_drafts_update_own" on public.answer_drafts;
create policy "answer_drafts_update_own"
  on public.answer_drafts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "answer_drafts_delete_own" on public.answer_drafts;
create policy "answer_drafts_delete_own"
  on public.answer_drafts for delete to authenticated
  using ((select auth.uid()) = user_id);
