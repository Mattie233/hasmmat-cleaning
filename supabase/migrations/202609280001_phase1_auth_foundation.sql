begin;

create type public.app_role as enum ('admin', 'cleaner');
create type public.profile_status as enum ('active', 'inactive');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  email text not null check (
    char_length(email) <= 320
    and position('@' in email) > 1
  ),
  role public.app_role not null default 'cleaner',
  status public.profile_status not null default 'inactive',
  phone text check (phone is null or char_length(phone) <= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_timestamps_valid check (updated_at >= created_at)
);

create unique index profiles_email_lower_idx
  on public.profiles (lower(email));
create index profiles_role_status_idx
  on public.profiles (role, status);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 100),
  target_type text not null check (char_length(target_type) between 1 and 100),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index audit_events_created_at_idx
  on public.audit_events (created_at desc);
create index audit_events_target_idx
  on public.audit_events (target_type, target_id);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.current_user_is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'::public.app_role
      and status = 'active'::public.profile_status
  );
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  derived_name text;
  derived_email text;
begin
  derived_email := coalesce(
    new.email,
    new.id::text || '@invalid.local'
  );
  derived_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(derived_email, '@', 1), ''),
    'Staff member'
  );

  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    derived_name,
    lower(derived_email),
    'cleaner'::public.app_role,
    'inactive'::public.profile_status
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create function private.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(coalesce(new.email, new.id::text || '@invalid.local'))
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_auth_user_email();

create function private.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (
      actor_user_id,
      event_type,
      target_type,
      target_id,
      metadata
    ) values (
      (select auth.uid()),
      'profile.created',
      'profile',
      new.id,
      jsonb_build_object('role', new.role, 'status', new.status)
    );
  elsif row(old.role, old.status, old.full_name, old.email, old.phone)
      is distinct from
      row(new.role, new.status, new.full_name, new.email, new.phone) then
    insert into public.audit_events (
      actor_user_id,
      event_type,
      target_type,
      target_id,
      metadata
    ) values (
      (select auth.uid()),
      'profile.updated',
      'profile',
      new.id,
      jsonb_build_object(
        'old_role', old.role,
        'new_role', new.role,
        'old_status', old.status,
        'new_status', new.status
      )
    );
  end if;

  return new;
end;
$$;

create trigger profiles_audit_changes
after insert or update on public.profiles
for each row execute function private.audit_profile_change();

-- Fail closed for any Auth users that existed before this migration.
insert into public.profiles (id, full_name, email, role, status)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'Staff member'
  ),
  lower(coalesce(users.email, users.id::text || '@invalid.local')),
  'cleaner'::public.app_role,
  'inactive'::public.profile_status
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;
revoke all on sequence public.audit_events_id_seq from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, phone, role, status)
  on table public.profiles to authenticated;
grant select on table public.audit_events to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.audit_events to service_role;
grant usage, select on sequence public.audit_events_id_seq to service_role;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_select_active_admin
on public.profiles
for select
to authenticated
using ((select private.current_user_is_active_admin()));

create policy profiles_update_active_admin
on public.profiles
for update
to authenticated
using ((select private.current_user_is_active_admin()))
with check ((select private.current_user_is_active_admin()));

create policy audit_events_select_active_admin
on public.audit_events
for select
to authenticated
using ((select private.current_user_is_active_admin()));

revoke all on function private.current_user_is_active_admin() from public;
revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_new_auth_user() from public;
revoke all on function private.sync_auth_user_email() from public;
revoke all on function private.audit_profile_change() from public;
grant execute on function private.current_user_is_active_admin()
  to authenticated;

comment on table public.profiles is
  'Application identity and authorization state linked one-to-one with auth.users.';
comment on column public.profiles.email is
  'Read model copied from auth.users and maintained by an Auth trigger; passwords are never stored here.';
comment on table public.audit_events is
  'Append-only application audit foundation. Direct client inserts, updates and deletes are not granted.';

commit;
