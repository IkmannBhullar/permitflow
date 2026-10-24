-- Profiles, organizations, memberships, invites, and the RLS helper functions.

-- Profiles ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '' check (char_length(full_name) <= 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Organizations ----------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  is_demo boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.org_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

-- An org must always keep at least one admin. Skipped when the org itself is being deleted.
create function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'admin' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and new.role = 'admin' then
    return new;
  end if;
  if not exists (select 1 from public.organizations o where o.id = old.org_id) then
    return coalesce(new, old);
  end if;
  if not exists (
    select 1 from public.organization_members m
    where m.org_id = old.org_id and m.role = 'admin' and m.user_id <> old.user_id
  ) then
    raise exception 'last_admin' using errcode = 'P0001',
      hint = 'An organization must keep at least one admin.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger organization_members_keep_admin
  before update of role or delete on public.organization_members
  for each row execute function public.prevent_last_admin_removal();

-- Invites ----------------------------------------------------------------------

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.org_role not null default 'viewer',
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index invites_org_id_idx on public.invites (org_id);
create unique index invites_one_pending_per_email on public.invites (org_id, email)
  where accepted_at is null and revoked_at is null;

-- RLS helpers ------------------------------------------------------------------
-- SECURITY DEFINER so policies can consult organization_members without recursing
-- into that table's own RLS. They only ever answer questions about the caller.

create function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org_id and m.user_id = (select auth.uid())
  );
$$;

create function public.has_org_role(p_org_id uuid, p_roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org_id and m.user_id = (select auth.uid()) and m.role = any (p_roles)
  );
$$;

-- Admins and project managers may create and edit org content.
create function public.can_edit_org(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_org_role(p_org_id, array['admin', 'project_manager']::public.org_role[]);
$$;

create function public.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.org_id = mine.org_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

-- RPCs -------------------------------------------------------------------------

-- Creating an org and its first admin must be atomic, and the creator cannot pass the
-- members insert policy before they are a member, so this runs as definer.
create function public.create_organization(p_name text, p_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (trim(p_name), p_slug, v_uid)
  returning * into v_org;
  insert into public.organization_members (org_id, user_id, role) values (v_org.id, v_uid, 'admin');
  return v_org;
end;
$$;

create function public.hash_invite_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

-- Lets the invite page describe an invite before the visitor accepts it.
-- Possession of the raw token is the authorization.
create function public.get_invite(p_token text)
returns table (org_name text, org_slug text, email text, role public.org_role, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.name,
    o.slug,
    i.email,
    i.role,
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at <= now() then 'expired'
      else 'valid'
    end
  from public.invites i
  join public.organizations o on o.id = i.org_id
  where i.token_hash = public.hash_invite_token(p_token);
$$;

create function public.accept_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_invite public.invites;
  v_slug text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_invite from public.invites
  where token_hash = public.hash_invite_token(p_token)
  for update;

  if not found or v_invite.revoked_at is not null then
    raise exception 'invite_not_found' using errcode = 'P0001';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'invite_used' using errcode = 'P0001';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;

  select p.email into v_email from public.profiles p where p.id = v_uid;
  if v_email is distinct from v_invite.email then
    raise exception 'invite_email_mismatch' using errcode = 'P0001';
  end if;

  -- An existing member keeps their current role.
  insert into public.organization_members (org_id, user_id, role)
  values (v_invite.org_id, v_uid, v_invite.role)
  on conflict (org_id, user_id) do nothing;

  update public.invites set accepted_at = now(), accepted_by = v_uid where id = v_invite.id;

  select o.slug into v_slug from public.organizations o where o.id = v_invite.org_id;
  return v_slug;
end;
$$;

revoke execute on function public.create_organization(text, text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
