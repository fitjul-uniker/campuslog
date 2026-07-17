-- Allow JD to be stored as a first-class recommendation purpose.
-- Existing recommendation purpose values and rows remain unchanged.

alter table public.recommendations
  drop constraint if exists recommendations_purpose_check;

alter table public.recommendations
  add constraint recommendations_purpose_check check (
    purpose in (
      'cover_letter',
      'portfolio',
      'interview',
      'jd',
      'activity_application',
      'other'
    )
  );
