-- Private user-owned attachments for completed experiences.
-- Attachment contents stay outside Experience and are never sent to AI routes.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'experience-attachments',
  'experience-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.experience_attachments (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null default extensions.gen_random_uuid(),
  experience_id text not null,
  storage_path text not null check (char_length(btrim(storage_path)) > 0),
  file_name text not null check (char_length(btrim(file_name)) > 0),
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  attachment_kind text not null check (
    attachment_kind in ('photo', 'material')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, storage_path),
  foreign key (user_id, experience_id)
    references public.experiences (user_id, id)
    on update cascade
    on delete cascade
);

create index if not exists experience_attachments_user_experience_created_at_idx
  on public.experience_attachments (user_id, experience_id, created_at);

create or replace function public.enforce_experience_attachment_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.experience_attachments
    where user_id = new.user_id
      and experience_id = new.experience_id
  ) >= 3 then
    raise exception 'An experience can have at most 3 attachments.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_experience_attachment_limit
  on public.experience_attachments;
create trigger enforce_experience_attachment_limit
  before insert on public.experience_attachments
  for each row execute function public.enforce_experience_attachment_limit();

alter table public.experience_attachments enable row level security;
alter table public.experience_attachments force row level security;

grant select, insert, delete on public.experience_attachments to authenticated;

drop policy if exists "experience_attachments_select_own"
  on public.experience_attachments;
create policy "experience_attachments_select_own"
  on public.experience_attachments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "experience_attachments_insert_own"
  on public.experience_attachments;
create policy "experience_attachments_insert_own"
  on public.experience_attachments for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.experiences
      where experiences.user_id = auth.uid()
        and experiences.id = experience_attachments.experience_id
    )
  );

drop policy if exists "experience_attachments_delete_own"
  on public.experience_attachments;
create policy "experience_attachments_delete_own"
  on public.experience_attachments for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "experience_attachment_objects_select_own"
  on storage.objects;
create policy "experience_attachment_objects_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'experience-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "experience_attachment_objects_insert_own"
  on storage.objects;
create policy "experience_attachment_objects_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'experience-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "experience_attachment_objects_delete_own"
  on storage.objects;
create policy "experience_attachment_objects_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'experience-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
