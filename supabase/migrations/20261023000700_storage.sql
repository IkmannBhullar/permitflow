-- Private document storage. Object paths are
--   {org_id}/{project_id}/{document_id}/v{version}/{filename}
-- and every policy authorizes on the first segment (the org).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  26214400, -- 25 MB
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The org id from an object path, or null when the first segment is not a uuid.
create function public.storage_object_org_id(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_first text := split_part(p_name, '/', 1);
begin
  if v_first ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

create policy "documents bucket: members read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.is_org_member(public.storage_object_org_id(name)));

create policy "documents bucket: editors upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.can_edit_org(public.storage_object_org_id(name)));

create policy "documents bucket: admins delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and public.has_org_role(public.storage_object_org_id(name), array['admin']::public.org_role[])
  );
