-- CampusLog AI recommendation v2.
-- Existing recommendation rows remain readable as schema_version = 'v1' with empty v2 fields.

alter table public.recommendations
  add column if not exists schema_version text not null default 'v1' check (
    schema_version in ('v1', 'v2')
  ),
  add column if not exists prompt_version text not null default '',
  add column if not exists model text not null default '',
  add column if not exists extracted_requirements jsonb not null default
    '{
      "requiredCompetencies": [],
      "preferredCompetencies": [],
      "keywords": [],
      "intent": "",
      "constraints": []
    }'::jsonb check (
      jsonb_typeof(extracted_requirements) = 'object'
    ),
  add column if not exists matches jsonb not null default '[]'::jsonb check (
    jsonb_typeof(matches) = 'array'
  );
