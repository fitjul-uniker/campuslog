-- Persist only whether a recommendation used image input.
-- Original image bytes remain one-time AI request data and are never stored.

alter table public.recommendations
  add column if not exists input_source text not null default 'text' check (
    input_source in ('text', 'image', 'text_and_image')
  );
