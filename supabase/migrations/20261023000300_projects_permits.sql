-- Projects and permits.
-- Composite foreign keys (child.parent_id, child.org_id) -> parent(id, org_id) keep every
-- child in its parent's org, and (org_id, user_id) references to organization_members mean
-- only current members can be assigned. Removing a member unassigns them.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  address text not null default '' check (char_length(address) <= 200),
  city text not null default '' check (char_length(city) <= 100),
  jurisdiction text not null default '' check (char_length(jurisdiction) <= 120),
  project_type public.project_type not null default 'residential',
  manager_id uuid,
  status public.project_status not null default 'active',
  start_date date,
  target_completion_date date,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  constraint projects_dates_ordered check (
    start_date is null or target_completion_date is null or target_completion_date >= start_date
  ),
  constraint projects_manager_is_member foreign key (org_id, manager_id)
    references public.organization_members (org_id, user_id) on delete set null (manager_id)
);

create index projects_org_id_status_idx on public.projects (org_id, status);
create index projects_manager_id_idx on public.projects (manager_id);

create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.permits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  permit_type public.permit_type not null default 'building',
  jurisdiction text not null default '' check (char_length(jurisdiction) <= 120),
  application_number text check (char_length(application_number) <= 80),
  status public.permit_status not null default 'draft',
  submitted_at date,
  approved_at date,
  expires_at date,
  status_changed_at timestamptz not null default now(),
  assignee_id uuid,
  notes text not null default '' check (char_length(notes) <= 10000),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  constraint permits_project_fk foreign key (project_id, org_id)
    references public.projects (id, org_id) on delete cascade,
  constraint permits_assignee_is_member foreign key (org_id, assignee_id)
    references public.organization_members (org_id, user_id) on delete set null (assignee_id),
  constraint permits_approved_requires_date check (status <> 'approved' or approved_at is not null)
);

create index permits_org_id_status_idx on public.permits (org_id, status);
create index permits_org_id_expires_at_idx on public.permits (org_id, expires_at);
create index permits_project_id_idx on public.permits (project_id);
create index permits_assignee_id_idx on public.permits (assignee_id);

create trigger permits_set_updated_at before update on public.permits
  for each row execute function public.set_updated_at();

-- Status bookkeeping: track when the status last changed (for "stalled in review"), and fill
-- in submission/approval dates when a status implies them and none was given.
create function public.permits_apply_status_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only a status transition fills dates. Clearing approved_at on an already-approved
  -- permit is left to the permits_approved_requires_date check, which rejects it.
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.status_changed_at = now();
    if new.status in ('submitted', 'under_review') and new.submitted_at is null then
      new.submitted_at = current_date;
    end if;
    if new.status = 'approved' and new.approved_at is null then
      new.approved_at = current_date;
    end if;
  end if;
  return new;
end;
$$;

create trigger permits_status_dates before insert or update of status on public.permits
  for each row execute function public.permits_apply_status_dates();
