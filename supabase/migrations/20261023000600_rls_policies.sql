-- Row level security. The database is the authority; the UI only mirrors these rules.
--   viewer           read everything in the org
--   project_manager  + create/edit projects, permits, tasks, documents, comments
--   admin            + members, invites, org settings, and deletes

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.invites enable row level security;
alter table public.projects enable row level security;
alter table public.permits enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;

-- Anonymous visitors never touch tenant data directly.
revoke all on all tables in schema public from anon;

-- Profiles ---------------------------------------------------------------------

create policy "profiles: read self and org-mates" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_org_with(id));

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Organizations (created only through create_organization) ---------------------

create policy "organizations: members read" on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

create policy "organizations: admins update" on public.organizations
  for update to authenticated
  using (public.has_org_role(id, array['admin']::public.org_role[]))
  with check (public.has_org_role(id, array['admin']::public.org_role[]));

revoke insert, delete on public.organizations from authenticated;
revoke update on public.organizations from authenticated;
grant update (name, slug) on public.organizations to authenticated;

-- Members (joining happens through create_organization / accept_invite) ---------

create policy "members: members read" on public.organization_members
  for select to authenticated
  using (public.is_org_member(org_id));

create policy "members: admins update" on public.organization_members
  for update to authenticated
  using (public.has_org_role(org_id, array['admin']::public.org_role[]))
  with check (public.has_org_role(org_id, array['admin']::public.org_role[]));

create policy "members: admins remove" on public.organization_members
  for delete to authenticated
  using (public.has_org_role(org_id, array['admin']::public.org_role[]));

revoke insert, update on public.organization_members from authenticated;
grant update (role) on public.organization_members to authenticated;

-- Invites ----------------------------------------------------------------------

create policy "invites: admins read" on public.invites
  for select to authenticated
  using (public.has_org_role(org_id, array['admin']::public.org_role[]));

create policy "invites: admins create" on public.invites
  for insert to authenticated
  with check (
    public.has_org_role(org_id, array['admin']::public.org_role[])
    and created_by = (select auth.uid())
    and accepted_at is null and accepted_by is null and revoked_at is null
  );

create policy "invites: admins revoke" on public.invites
  for update to authenticated
  using (public.has_org_role(org_id, array['admin']::public.org_role[]))
  with check (public.has_org_role(org_id, array['admin']::public.org_role[]));

revoke update, delete on public.invites from authenticated;
grant update (revoked_at) on public.invites to authenticated;

-- Org content: projects, permits, documents, tasks ------------------------------

create policy "projects: members read" on public.projects
  for select to authenticated using (public.is_org_member(org_id));
create policy "projects: editors create" on public.projects
  for insert to authenticated with check (public.can_edit_org(org_id));
create policy "projects: editors update" on public.projects
  for update to authenticated
  using (public.can_edit_org(org_id)) with check (public.can_edit_org(org_id));
create policy "projects: admins delete" on public.projects
  for delete to authenticated using (public.has_org_role(org_id, array['admin']::public.org_role[]));

create policy "permits: members read" on public.permits
  for select to authenticated using (public.is_org_member(org_id));
create policy "permits: editors create" on public.permits
  for insert to authenticated with check (public.can_edit_org(org_id));
create policy "permits: editors update" on public.permits
  for update to authenticated
  using (public.can_edit_org(org_id)) with check (public.can_edit_org(org_id));
create policy "permits: admins delete" on public.permits
  for delete to authenticated using (public.has_org_role(org_id, array['admin']::public.org_role[]));

create policy "documents: members read" on public.documents
  for select to authenticated using (public.is_org_member(org_id));
create policy "documents: editors create" on public.documents
  for insert to authenticated with check (public.can_edit_org(org_id));
create policy "documents: editors update" on public.documents
  for update to authenticated
  using (public.can_edit_org(org_id)) with check (public.can_edit_org(org_id));
create policy "documents: admins delete" on public.documents
  for delete to authenticated using (public.has_org_role(org_id, array['admin']::public.org_role[]));

-- Versions are immutable: no update policy.
create policy "document_versions: members read" on public.document_versions
  for select to authenticated using (public.is_org_member(org_id));
create policy "document_versions: editors create" on public.document_versions
  for insert to authenticated with check (public.can_edit_org(org_id));
create policy "document_versions: admins delete" on public.document_versions
  for delete to authenticated using (public.has_org_role(org_id, array['admin']::public.org_role[]));
revoke update on public.document_versions from authenticated;

create policy "tasks: members read" on public.tasks
  for select to authenticated using (public.is_org_member(org_id));
create policy "tasks: editors create" on public.tasks
  for insert to authenticated with check (public.can_edit_org(org_id));
create policy "tasks: editors update" on public.tasks
  for update to authenticated
  using (public.can_edit_org(org_id)) with check (public.can_edit_org(org_id));
create policy "tasks: admins delete" on public.tasks
  for delete to authenticated using (public.has_org_role(org_id, array['admin']::public.org_role[]));

-- Comments ---------------------------------------------------------------------

create policy "comments: members read" on public.comments
  for select to authenticated using (public.is_org_member(org_id));
create policy "comments: editors create as themselves" on public.comments
  for insert to authenticated
  with check (public.can_edit_org(org_id) and author_id = (select auth.uid()));
create policy "comments: authors edit" on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()) and public.can_edit_org(org_id))
  with check (author_id = (select auth.uid()) and public.can_edit_org(org_id));
create policy "comments: authors or admins delete" on public.comments
  for delete to authenticated
  using (
    (author_id = (select auth.uid()) and public.can_edit_org(org_id))
    or public.has_org_role(org_id, array['admin']::public.org_role[])
  );
revoke update on public.comments from authenticated;
grant update (body) on public.comments to authenticated;

-- Activity log and notifications (written only by triggers / cron) --------------

create policy "activity: members read" on public.activity_log
  for select to authenticated using (public.is_org_member(org_id));
revoke insert, update, delete on public.activity_log from authenticated;

create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: mark own read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Row ownership ------------------------------------------------------------------
-- RLS decides who may write; this trigger stops writers from forging authorship or moving a
-- row to another org they also belong to. The actor column is passed as the trigger argument.

create function public.enforce_row_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_col text := tg_argv[0];
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new := jsonb_populate_record(new, jsonb_build_object(v_col, auth.uid()));
    end if;
    return new;
  end if;
  if new.org_id is distinct from old.org_id then
    raise exception 'org_id_immutable' using errcode = 'P0001';
  end if;
  new := jsonb_populate_record(new, jsonb_build_object(v_col, to_jsonb(old) -> v_col));
  return new;
end;
$$;

create trigger projects_ownership before insert or update on public.projects
  for each row execute function public.enforce_row_ownership('created_by');
create trigger permits_ownership before insert or update on public.permits
  for each row execute function public.enforce_row_ownership('created_by');
create trigger tasks_ownership before insert or update on public.tasks
  for each row execute function public.enforce_row_ownership('created_by');
create trigger documents_ownership before insert or update on public.documents
  for each row execute function public.enforce_row_ownership('uploaded_by');
create trigger document_versions_ownership before insert on public.document_versions
  for each row execute function public.enforce_row_ownership('uploaded_by');
create trigger comments_ownership before insert or update on public.comments
  for each row execute function public.enforce_row_ownership('author_id');
create trigger invites_ownership before insert or update on public.invites
  for each row execute function public.enforce_row_ownership('created_by');
