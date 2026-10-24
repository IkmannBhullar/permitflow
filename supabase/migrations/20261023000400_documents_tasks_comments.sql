-- Documents with immutable versions, tasks (including correction tasks), and comments.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  permit_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 200),
  current_version integer not null default 1 check (current_version >= 1),
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  constraint documents_project_fk foreign key (project_id, org_id)
    references public.projects (id, org_id) on delete cascade,
  constraint documents_permit_fk foreign key (permit_id, org_id)
    references public.permits (id, org_id) on delete set null (permit_id)
);

create index documents_org_id_idx on public.documents (org_id);
create index documents_project_id_idx on public.documents (project_id);
create index documents_permit_id_idx on public.documents (permit_id);

create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  org_id uuid not null references public.organizations (id) on delete cascade,
  version integer not null check (version >= 1),
  storage_path text not null unique,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  mime_type text not null,
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version),
  constraint document_versions_document_fk foreign key (document_id, org_id)
    references public.documents (id, org_id) on delete cascade,
  -- Storage policies authorize by the first path segment, so it must be this row's org.
  constraint document_versions_path_in_org check (storage_path like org_id::text || '/%')
);

create index document_versions_org_id_idx on public.document_versions (org_id);

create function public.documents_bump_current_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.documents
  set current_version = greatest(current_version, new.version)
  where id = new.document_id;
  return new;
end;
$$;

create trigger document_versions_bump after insert on public.document_versions
  for each row execute function public.documents_bump_current_version();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  permit_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  assignee_id uuid,
  due_date date,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  is_correction boolean not null default false,
  completed_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  constraint tasks_project_fk foreign key (project_id, org_id)
    references public.projects (id, org_id) on delete cascade,
  -- Tasks linked to a permit belong to it; deleting the permit deletes them.
  constraint tasks_permit_fk foreign key (permit_id, org_id)
    references public.permits (id, org_id) on delete cascade,
  constraint tasks_assignee_is_member foreign key (org_id, assignee_id)
    references public.organization_members (org_id, user_id) on delete set null (assignee_id),
  constraint tasks_correction_needs_permit check (not is_correction or permit_id is not null),
  constraint tasks_completed_at_matches_status check ((status = 'done') = (completed_at is not null))
);

create index tasks_org_id_due_date_open_idx on public.tasks (org_id, due_date) where status <> 'done';
create index tasks_org_id_status_idx on public.tasks (org_id, status);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_permit_id_idx on public.tasks (permit_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create function public.tasks_sync_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_completed_at before insert or update of status, completed_at on public.tasks
  for each row execute function public.tasks_sync_completed_at();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  entity_type public.entity_type not null check (entity_type in ('project', 'permit', 'task')),
  entity_id uuid not null,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_org_id_idx on public.comments (org_id);
create index comments_entity_idx on public.comments (entity_type, entity_id, created_at);

create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- The entity reference is polymorphic (no FK), so check it exists in the same org.
create function public.comments_check_entity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  v_ok := case new.entity_type
    when 'project' then exists (select 1 from public.projects where id = new.entity_id and org_id = new.org_id)
    when 'permit' then exists (select 1 from public.permits where id = new.entity_id and org_id = new.org_id)
    when 'task' then exists (select 1 from public.tasks where id = new.entity_id and org_id = new.org_id)
    else false
  end;
  if not v_ok then
    raise exception 'comment_entity_not_found' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger comments_check_entity before insert or update of entity_type, entity_id, org_id
  on public.comments
  for each row execute function public.comments_check_entity();

-- Remove comments when the entity they hang off is deleted.
create function public.delete_entity_comments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.comments
  where entity_type = tg_argv[0]::public.entity_type and entity_id = old.id;
  return old;
end;
$$;

create trigger projects_delete_comments after delete on public.projects
  for each row execute function public.delete_entity_comments('project');
create trigger permits_delete_comments after delete on public.permits
  for each row execute function public.delete_entity_comments('permit');
create trigger tasks_delete_comments after delete on public.tasks
  for each row execute function public.delete_entity_comments('task');
