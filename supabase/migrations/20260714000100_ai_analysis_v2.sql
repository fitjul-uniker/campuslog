-- CampusLog AI experience analysis v2.
-- Existing analysis rows remain readable as schema_version = 'v1' with empty v2 fields.

alter table public.experience_analyses
  add column if not exists schema_version text not null default 'v1' check (
    schema_version in ('v1', 'v2')
  ),
  add column if not exists prompt_version text not null default '',
  add column if not exists model text not null default '',
  add column if not exists star jsonb not null default
    '{"situation":"","task":"","action":"","result":""}'::jsonb check (
      jsonb_typeof(star) = 'object'
    ),
  add column if not exists evidence jsonb not null default '[]'::jsonb check (
    jsonb_typeof(evidence) = 'array'
  ),
  add column if not exists evidence_gaps jsonb not null default '[]'::jsonb check (
    jsonb_typeof(evidence_gaps) = 'array'
  ),
  add column if not exists cover_letter_angles jsonb not null default '[]'::jsonb check (
    jsonb_typeof(cover_letter_angles) = 'array'
  ),
  add column if not exists competency_evidence jsonb not null default '[]'::jsonb check (
    jsonb_typeof(competency_evidence) = 'array'
  );
