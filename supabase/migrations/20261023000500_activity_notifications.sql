-- Activity log and in-app notifications.
--
-- Both are written by triggers rather than application code:
--   * nothing can forget to log, and the log captures exact before/after values;
--   * clients get no INSERT policy on either table, so entries cannot be forged.
-- Triggers skip writes when there is no authenticated user (auth.uid() is null), which is
-- the case for the seed script and the cron job; those write their own rows explicitly.

create table public.activity_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in (
    'created', 'updated', 'status_changed', 'assigned', 'completed', 'reopened', 'uploaded',
    'commented', 'archived', 'deleted', 'member_added', 'member_role_changed', 'member_removed'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_org_created_idx on public.activity_log (org_id, created_at desc);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id, created_at desc);
create index activity_log_project_idx on public.activity_log (project_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid not null,
  type text not null check (type in (
    'task_assigned', 'permit_assigned', 'permit_status_changed', 'permit_expiring', 'task_overdue'
  )),
  title text not null,
  body text not null default '',
  -- Path inside the org, e.g. 'permits/<id>'. The UI prefixes /app/<current slug>/.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  dedupe_key text unique,
  -- Leaving an org removes that org's notifications.
  constraint notifications_member_fk foreign key (org_id, user_id)
    references public.organization_members (org_id, user_id) on delete cascade
);

create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index notifications_org_id_idx on public.notifications (org_id);

-- Helpers ----------------------------------------------------------------------

create function public.log_activity(
  p_org_id uuid,
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  -- Children deleted by an org/project cascade must not reference the vanishing parent.
  if not exists (select 1 from public.organizations where id = p_org_id)
     or (p_project_id is not null and not exists (select 1 from public.projects where id = p_project_id)) then
    return;
  end if;
  insert into public.activity_log (org_id, project_id, entity_type, entity_id, actor_id, action, metadata)
  values (p_org_id, p_project_id, p_entity_type, p_entity_id, auth.uid(), p_action, p_metadata);
end;
$$;

create function public.notify(
  p_org_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Never notify people about their own actions.
  if auth.uid() is null or p_user_id is null or p_user_id = auth.uid() then
    return;
  end if;
  insert into public.notifications (org_id, user_id, type, title, body, link)
  values (p_org_id, p_user_id, p_type, p_title, p_body, p_link);
end;
$$;

-- Names of columns whose values differ between two rows, ignoring bookkeeping columns.
create function public.changed_fields(p_old jsonb, p_new jsonb, p_ignore text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(key order by key), '{}')
  from jsonb_each(p_new) as n(key, value)
  where not (key = any (p_ignore)) and n.value is distinct from (p_old -> key);
$$;

create function public.humanize(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select initcap(replace(p_value, '_', ' '));
$$;

revoke execute on function public.log_activity(uuid, uuid, public.entity_type, uuid, text, jsonb)
  from public, anon, authenticated;
revoke execute on function public.notify(uuid, uuid, text, text, text, text)
  from public, anon, authenticated;

-- Projects ---------------------------------------------------------------------

create function public.projects_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fields text[];
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.org_id, new.id, 'project', new.id, 'created',
      jsonb_build_object('name', new.name));
    return new;
  end if;

  if new.status is distinct from old.status then
    perform public.log_activity(new.org_id, new.id, 'project', new.id,
      case when new.status = 'archived' then 'archived' else 'status_changed' end,
      jsonb_build_object('name', new.name, 'from', old.status, 'to', new.status));
  end if;
  if new.manager_id is distinct from old.manager_id then
    perform public.log_activity(new.org_id, new.id, 'project', new.id, 'assigned',
      jsonb_build_object('name', new.name, 'role', 'manager', 'from', old.manager_id, 'to', new.manager_id));
  end if;
  v_fields := public.changed_fields(to_jsonb(old), to_jsonb(new),
    array['status', 'manager_id', 'updated_at', 'created_at']);
  if cardinality(v_fields) > 0 then
    perform public.log_activity(new.org_id, new.id, 'project', new.id, 'updated',
      jsonb_build_object('name', new.name, 'fields', v_fields));
  end if;
  return new;
end;
$$;

create trigger projects_activity after insert or update on public.projects
  for each row execute function public.projects_activity();

-- Permits ----------------------------------------------------------------------

create function public.permits_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fields text[];
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.org_id, new.project_id, 'permit', new.id, 'created',
      jsonb_build_object('name', new.name, 'status', new.status));
    perform public.notify(new.org_id, new.assignee_id, 'permit_assigned',
      'You were assigned a permit', new.name, 'permits/' || new.id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.log_activity(old.org_id, old.project_id, 'permit', old.id, 'deleted',
      jsonb_build_object('name', old.name));
    return old;
  end if;

  if new.status is distinct from old.status then
    perform public.log_activity(new.org_id, new.project_id, 'permit', new.id, 'status_changed',
      jsonb_build_object('name', new.name, 'from', old.status, 'to', new.status));
    if new.assignee_id is not distinct from old.assignee_id then
      perform public.notify(new.org_id, new.assignee_id, 'permit_status_changed',
        new.name || ' is now ' || public.humanize(new.status::text),
        'Status changed from ' || public.humanize(old.status::text) || '.',
        'permits/' || new.id);
    end if;
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    perform public.log_activity(new.org_id, new.project_id, 'permit', new.id, 'assigned',
      jsonb_build_object('name', new.name, 'from', old.assignee_id, 'to', new.assignee_id));
    perform public.notify(new.org_id, new.assignee_id, 'permit_assigned',
      'You were assigned a permit', new.name, 'permits/' || new.id);
  end if;
  -- Dates stamped by a status change belong to the status_changed entry, not "updated".
  v_fields := public.changed_fields(to_jsonb(old), to_jsonb(new),
    array['status', 'assignee_id', 'status_changed_at', 'updated_at', 'created_at']
      || case when new.status is distinct from old.status
           then array['submitted_at', 'approved_at'] else '{}'::text[] end);
  if cardinality(v_fields) > 0 then
    perform public.log_activity(new.org_id, new.project_id, 'permit', new.id, 'updated',
      jsonb_build_object('name', new.name, 'fields', v_fields));
  end if;
  return new;
end;
$$;

create trigger permits_activity after insert or update or delete on public.permits
  for each row execute function public.permits_activity();

-- Tasks ------------------------------------------------------------------------

create function public.tasks_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fields text[];
  v_link text;
begin
  if tg_op = 'DELETE' then
    perform public.log_activity(old.org_id, old.project_id, 'task', old.id, 'deleted',
      jsonb_build_object('title', old.title));
    return old;
  end if;

  v_link := case when new.permit_id is not null then 'permits/' || new.permit_id
                 else 'projects/' || new.project_id end;

  if tg_op = 'INSERT' then
    perform public.log_activity(new.org_id, new.project_id, 'task', new.id, 'created',
      jsonb_build_object('title', new.title, 'permit_id', new.permit_id, 'is_correction', new.is_correction));
    perform public.notify(new.org_id, new.assignee_id, 'task_assigned',
      'You were assigned a task', new.title, v_link);
    return new;
  end if;

  if new.status is distinct from old.status then
    perform public.log_activity(new.org_id, new.project_id, 'task', new.id,
      case
        when new.status = 'done' then 'completed'
        when old.status = 'done' then 'reopened'
        else 'status_changed'
      end,
      jsonb_build_object('title', new.title, 'from', old.status, 'to', new.status, 'permit_id', new.permit_id));
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    perform public.log_activity(new.org_id, new.project_id, 'task', new.id, 'assigned',
      jsonb_build_object('title', new.title, 'from', old.assignee_id, 'to', new.assignee_id));
    perform public.notify(new.org_id, new.assignee_id, 'task_assigned',
      'You were assigned a task', new.title, v_link);
  end if;
  v_fields := public.changed_fields(to_jsonb(old), to_jsonb(new),
    array['status', 'assignee_id', 'completed_at', 'updated_at', 'created_at']);
  if cardinality(v_fields) > 0 then
    perform public.log_activity(new.org_id, new.project_id, 'task', new.id, 'updated',
      jsonb_build_object('title', new.title, 'fields', v_fields));
  end if;
  return new;
end;
$$;

create trigger tasks_activity after insert or update or delete on public.tasks
  for each row execute function public.tasks_activity();

-- Documents --------------------------------------------------------------------

create function public.document_versions_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc public.documents;
begin
  select * into v_doc from public.documents where id = new.document_id;
  perform public.log_activity(new.org_id, v_doc.project_id, 'document', new.document_id, 'uploaded',
    jsonb_build_object('name', v_doc.name, 'version', new.version, 'permit_id', v_doc.permit_id));
  return new;
end;
$$;

create trigger document_versions_activity after insert on public.document_versions
  for each row execute function public.document_versions_activity();

-- Comments ---------------------------------------------------------------------

create function public.comments_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
begin
  v_project_id := case new.entity_type
    when 'project' then new.entity_id
    when 'permit' then (select project_id from public.permits where id = new.entity_id)
    when 'task' then (select project_id from public.tasks where id = new.entity_id)
  end;
  perform public.log_activity(new.org_id, v_project_id, new.entity_type, new.entity_id, 'commented',
    jsonb_build_object('comment_id', new.id, 'excerpt', left(new.body, 140)));
  return new;
end;
$$;

create trigger comments_activity after insert on public.comments
  for each row execute function public.comments_activity();

-- Members ----------------------------------------------------------------------

create function public.members_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.org_id, null, 'member', new.user_id, 'member_added',
      jsonb_build_object('role', new.role));
    return new;
  end if;
  if tg_op = 'DELETE' then
    -- Skip when the whole org is being deleted.
    if exists (select 1 from public.organizations where id = old.org_id) then
      perform public.log_activity(old.org_id, null, 'member', old.user_id, 'member_removed',
        jsonb_build_object('role', old.role));
    end if;
    return old;
  end if;
  if new.role is distinct from old.role then
    perform public.log_activity(new.org_id, null, 'member', new.user_id, 'member_role_changed',
      jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  return new;
end;
$$;

create trigger members_activity after insert or update or delete on public.organization_members
  for each row execute function public.members_activity();
