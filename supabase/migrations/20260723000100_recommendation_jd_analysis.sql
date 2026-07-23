-- Store structured JD analysis alongside recommendation v2 results.
-- Existing rows stay compatible because the field is nullable.

alter table public.recommendations
  add column if not exists jd_analysis jsonb null check (
    jd_analysis is null or jsonb_typeof(jd_analysis) = 'object'
  );
