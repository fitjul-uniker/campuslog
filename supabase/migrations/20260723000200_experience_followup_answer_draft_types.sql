-- Allow followup records to reference the updated answer draft types.
-- Legacy draft types stay valid for existing rows.

alter table public.experience_followups
  drop constraint if exists experience_followups_source_answer_draft_type_check;

alter table public.experience_followups
  add constraint experience_followups_source_answer_draft_type_check check (
    source_answer_draft_type is null
    or source_answer_draft_type in (
      'cover_letter_300',
      'cover_letter_500',
      'cover_letter_1000',
      'interview_30s',
      'interview_60s',
      'interview_followups',
      'jd_strategy',
      'custom',
      'cover_letter_800',
      'interview',
      'portfolio'
    )
  );
