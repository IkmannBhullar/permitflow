-- Enums and shared utilities used by every later migration.

create type public.org_role as enum ('admin', 'project_manager', 'viewer');
create type public.project_type as enum ('residential', 'commercial', 'renovation', 'other');
create type public.project_status as enum ('active', 'on_hold', 'completed', 'archived');
create type public.permit_type as enum (
  'building', 'electrical', 'plumbing', 'mechanical', 'demolition', 'grading', 'fire', 'signage', 'other'
);
create type public.permit_status as enum (
  'draft', 'submitted', 'under_review', 'corrections_required', 'approved', 'rejected', 'expired', 'closed'
);
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.entity_type as enum ('organization', 'member', 'project', 'permit', 'task', 'document');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
