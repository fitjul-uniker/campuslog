-- CampusLog evidence followup loop.
-- Followup answers are stored separately from the original experience text.

create table if not exists public.experience_followups (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  experience_id text not null,
  schema_version text not null default 'v1' check (
    schema_version in ('v1')
  ),
  source text not null check (
    source in (
      'analysis_gap',
      'recommendation_missing_evidence',
      'recommendation_overclaim_risk',
      'answer_draft_missing_evidence',
      'answer_draft_caution',
      'manual'
    )
  ),
  source_recommendation_id text,
  source_answer_draft_type text check (
    source_answer_draft_type is null
    or source_answer_draft_type in (
      'cover_letter_500',
      'cover_letter_800',
      'cover_letter_1000',
      'interview',
      'portfolio'
    )
  ),
  questions jsonb not null default '[]'::jsonb check (
    jsonb_typeof(questions) = 'array'
  ),
  answers jsonb not null default '[]'::jsonb check (
    jsonb_typeof(answers) = 'array'
  ),
  status text not null default 'open' check (
    status in ('open', 'answered', 'dismissed')
  ),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, experience_id)
    references public.experiences (user_id, id)
    on update cascade
    on delete cascade
);

create index if not exists experience_followups_user_experience_updated_at_idx
  on public.experience_followups (user_id, experience_id, updated_at desc);

create index if not exists experience_followups_user_source_idx
  on public.experience_followups (user_id, source, status);

drop trigger if exists set_experience_followups_updated_at
  on public.experience_followups;
create trigger set_experience_followups_updated_at
  before update on public.experience_followups
  for each row execute function public.set_updated_at();

alter table public.experience_followups enable row level security;
alter table public.experience_followups force row level security;

grant select, insert, update, delete on public.experience_followups to authenticated;

drop policy if exists "experience_followups_select_own"
  on public.experience_followups;
create policy "experience_followups_select_own"
  on public.experience_followups for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "experience_followups_insert_own"
  on public.experience_followups;
create policy "experience_followups_insert_own"
  on public.experience_followups for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "experience_followups_update_own"
  on public.experience_followups;
create policy "experience_followups_update_own"
  on public.experience_followups for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "experience_followups_delete_own"
  on public.experience_followups;
create policy "experience_followups_delete_own"
  on public.experience_followups for delete to authenticated
  using ((select auth.uid()) = user_id);
