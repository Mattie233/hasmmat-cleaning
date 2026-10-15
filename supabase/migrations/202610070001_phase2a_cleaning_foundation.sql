begin;

-- Phase 2A is additive. The Phase 1 profiles, audit_events, enums, triggers,
-- RLS policies, and authentication helpers are intentionally left untouched.

create type public.client_kind as enum ('business', 'individual', 'internal');
create type public.record_status as enum ('active', 'inactive', 'archived');
create type public.site_type as enum (
  'serviced_accommodation',
  'holiday_let',
  'office',
  'gym',
  'residential',
  'communal_area',
  'commercial',
  'end_of_tenancy',
  'other'
);
create type public.template_version_status as enum ('draft', 'published', 'retired');
create type public.job_status as enum (
  'draft',
  'scheduled',
  'in_progress',
  'awaiting_review',
  'approved',
  'reclean_required',
  'cancelled'
);
create type public.assignment_status as enum (
  'assigned',
  'acknowledged',
  'in_progress',
  'completed',
  'unable_to_attend',
  'removed'
);
create type public.job_attempt_status as enum (
  'scheduled',
  'in_progress',
  'awaiting_review',
  'approved',
  'reclean_required',
  'cancelled'
);
create type public.checklist_progress_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'not_applicable'
);
create type public.photo_category as enum (
  'before',
  'completion',
  'final_completion',
  'issue',
  'inspection'
);
create type public.issue_category as enum (
  'damage',
  'missing_item',
  'maintenance',
  'low_stock',
  'guest_belongings',
  'safety',
  'other'
);
create type public.issue_severity as enum ('low', 'normal', 'high', 'urgent');
create type public.issue_status as enum (
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'dismissed'
);
create type public.review_decision as enum ('approved', 'reclean_required');
create type public.job_event_type as enum (
  'client_created',
  'client_updated',
  'site_created',
  'site_updated',
  'template_created',
  'template_version_published',
  'job_created',
  'job_scheduled',
  'attempt_created',
  'attempt_started',
  'attempt_closed',
  'assignment_prepared_for_reclean',
  'job_status_changed',
  'assignment_added',
  'assignment_removed',
  'assignment_acknowledged',
  'assignment_unable_to_attend',
  'cleaner_started',
  'cleaner_paused',
  'cleaner_resumed',
  'cleaner_finished',
  'checklist_item_updated',
  'checklist_item_waived',
  'waiver_revoked',
  'photo_reserved',
  'photo_uploaded',
  'issue_reported',
  'issue_resolved',
  'admin_reviewed',
  'reclean_requested',
  'job_cancelled'
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 200),
  kind public.client_kind not null,
  status public.record_status not null default 'active',
  admin_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  phone text check (phone is null or char_length(phone) <= 32),
  role_label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_contacts_client_idx on public.client_contacts(client_id);
create unique index one_primary_contact_per_client
  on public.client_contacts(client_id) where is_primary;

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 200),
  type public.site_type not null,
  status public.record_status not null default 'active',
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  region text,
  postcode text,
  country_code text not null default 'GB'
    check (country_code ~ '^[A-Z]{2}$'),
  access_instructions text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, client_id)
);
create index sites_client_idx on public.sites(client_id);
create index sites_status_idx on public.sites(status);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 200),
  description text,
  status public.record_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null
    references public.checklist_templates(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  status public.template_version_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (template_id, version_number),
  unique (template_id, id),
  check (
    (status = 'draft' and published_at is null)
    or (status <> 'draft' and published_at is not null)
  )
);

create table public.checklist_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null
    references public.checklist_template_versions(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 200),
  instructions text,
  sort_order integer not null check (sort_order >= 0),
  unique (template_version_id, sort_order),
  unique (template_version_id, id)
);

create table public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null,
  section_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 300),
  instructions text,
  is_required boolean not null default true,
  requires_photo boolean not null default false,
  sort_order integer not null check (sort_order >= 0),
  foreign key (template_version_id, section_id)
    references public.checklist_template_sections(template_version_id, id)
    on delete restrict,
  unique (section_id, sort_order),
  unique (template_version_id, id)
);
create index checklist_template_items_version_idx
  on public.checklist_template_items(template_version_id);

create table public.site_checklist_item_overrides (
  site_id uuid not null references public.sites(id) on delete restrict,
  template_item_id uuid not null
    references public.checklist_template_items(id) on delete restrict,
  is_enabled boolean not null default true,
  title_override text,
  instructions_override text,
  is_required_override boolean,
  requires_photo_override boolean,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (site_id, template_item_id)
);
create index site_checklist_overrides_item_idx
  on public.site_checklist_item_overrides(template_item_id);

create table public.cleaning_jobs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  template_version_id uuid not null
    references public.checklist_template_versions(id) on delete restrict,
  status public.job_status not null default 'draft',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  scheduled_timezone text,
  scheduled_at timestamptz,
  site_name_snapshot text,
  address_snapshot jsonb,
  admin_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, site_id),
  unique (id, template_version_id),
  check (scheduled_end is null or scheduled_start is not null),
  check (scheduled_end is null or scheduled_end > scheduled_start),
  check (
    (status = 'draft' and scheduled_at is null)
    or status = 'cancelled'
    or (status not in ('draft', 'cancelled') and scheduled_at is not null)
  ),
  check (
    status in ('draft', 'cancelled')
    or (
      scheduled_start is not null
      and site_name_snapshot is not null
      and address_snapshot is not null
      and jsonb_typeof(address_snapshot) = 'object'
    )
  )
);
comment on column public.cleaning_jobs.status is
  'Overall job state. reclean_required means the prior attempt was rejected and the next attempt is scheduled; job state is advanced atomically with attempt state.';
create index cleaning_jobs_site_schedule_idx
  on public.cleaning_jobs(site_id, scheduled_start desc);
create index cleaning_jobs_status_schedule_idx
  on public.cleaning_jobs(status, scheduled_start);

create table public.job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.cleaning_jobs(id) on delete restrict,
  cleaner_id uuid not null references public.profiles(id) on delete restrict,
  status public.assignment_status not null default 'assigned',
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references public.profiles(id) on delete set null,
  removal_reason text,
  cleaner_notes text,
  unique (job_id, cleaner_id, id),
  unique (job_id, id),
  check ((status = 'removed') = (removed_at is not null)),
  check ((status = 'removed') = (removed_by is not null)),
  check ((status = 'removed') = (removal_reason is not null))
);
comment on column public.job_assignments.status is
  'Current job-level cleaner assignment state. Per-attempt start/end history is held in immutable assignment_work_sessions.';
create unique index one_current_assignment_per_cleaner_job
  on public.job_assignments(job_id, cleaner_id)
  where status <> 'removed'::public.assignment_status;
create index job_assignments_cleaner_status_idx
  on public.job_assignments(cleaner_id, status, assigned_at desc);
create index job_assignments_job_status_idx
  on public.job_assignments(job_id, status);

create table public.job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.cleaning_jobs(id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0),
  status public.job_attempt_status not null default 'scheduled',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  closed_at timestamptz,
  unique (job_id, attempt_number),
  unique (job_id, id),
  check (
    (status in ('scheduled', 'in_progress', 'awaiting_review')
      and closed_at is null)
    or (status in ('approved', 'reclean_required', 'cancelled')
      and closed_at is not null)
  ),
  check (
    (status = 'scheduled' and started_at is null)
    or (status = 'cancelled')
    or (status not in ('scheduled', 'cancelled') and started_at is not null)
  ),
  check (
    (status in (
      'awaiting_review', 'approved', 'reclean_required'
    ) and submitted_at is not null)
    or (status in ('scheduled', 'in_progress', 'cancelled')
        and submitted_at is null)
  )
);
create unique index one_active_attempt_per_job
  on public.job_attempts(job_id)
  where status in (
    'scheduled'::public.job_attempt_status,
    'in_progress'::public.job_attempt_status,
    'awaiting_review'::public.job_attempt_status
  );
create index job_attempts_job_order_idx
  on public.job_attempts(job_id, attempt_number desc);

comment on table public.job_attempts is
  'One execution cycle of a job. Attempt 1 is created at scheduling; each re-clean creates the next attempt without changing prior attempt data.';
comment on column public.job_attempts.status is
  'Attempt state: scheduled -> in_progress -> awaiting_review -> approved or reclean_required; only admin review creates the next scheduled attempt.';
comment on column public.job_attempts.submitted_at is
  'Timestamp when all current-attempt work was submitted for admin review.';

create table public.assignment_work_sessions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  attempt_id uuid not null,
  cleaner_id uuid not null,
  assignment_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('paused', 'completed')),
  foreign key (job_id, cleaner_id, assignment_id)
    references public.job_assignments(job_id, cleaner_id, id) on delete restrict,
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict,
  check ((ended_at is null) = (end_reason is null)),
  check (ended_at is null or ended_at > started_at)
);
create unique index one_open_work_session_per_assignment
  on public.assignment_work_sessions(assignment_id)
  where ended_at is null;
create index assignment_sessions_cleaner_time_idx
  on public.assignment_work_sessions(cleaner_id, started_at desc);
create index assignment_sessions_attempt_idx
  on public.assignment_work_sessions(attempt_id, started_at);

create table public.job_checklist_sections (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.cleaning_jobs(id) on delete restrict,
  template_version_id uuid not null,
  source_section_id uuid not null,
  title text not null,
  instructions text,
  sort_order integer not null check (sort_order >= 0),
  foreign key (job_id, template_version_id)
    references public.cleaning_jobs(id, template_version_id) on delete restrict,
  foreign key (template_version_id, source_section_id)
    references public.checklist_template_sections(template_version_id, id)
    on delete restrict,
  unique (job_id, sort_order),
  unique (job_id, id)
);

create table public.job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  section_id uuid not null,
  template_version_id uuid not null,
  source_item_id uuid not null,
  title text not null,
  instructions text,
  is_required boolean not null,
  requires_photo boolean not null,
  sort_order integer not null check (sort_order >= 0),
  foreign key (job_id, section_id)
    references public.job_checklist_sections(job_id, id) on delete restrict,
  foreign key (job_id, template_version_id)
    references public.cleaning_jobs(id, template_version_id) on delete restrict,
  foreign key (template_version_id, source_item_id)
    references public.checklist_template_items(template_version_id, id)
    on delete restrict,
  unique (job_id, source_item_id),
  unique (job_id, id)
);

create table public.job_checklist_progress (
  job_id uuid not null,
  attempt_id uuid not null,
  item_id uuid not null,
  status public.checklist_progress_status not null default 'not_started',
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  not_applicable_reason text,
  notes text,
  version integer not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  primary key (attempt_id, item_id),
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict,
  foreign key (job_id, item_id)
    references public.job_checklist_items(job_id, id) on delete restrict,
  check ((status = 'completed') = (completed_at is not null)),
  check (status = 'not_applicable' or not_applicable_reason is null)
);

create table public.job_checklist_waivers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  attempt_id uuid not null,
  item_id uuid not null,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  reason text not null check (char_length(trim(reason)) between 1 and 4000),
  revoked_by uuid references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  revocation_reason text,
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict,
  foreign key (job_id, item_id)
    references public.job_checklist_items(job_id, id) on delete restrict,
  check (
    (revoked_at is null and revoked_by is null and revocation_reason is null)
    or (
      revoked_at is not null
      and revoked_by is not null
      and char_length(trim(coalesce(revocation_reason, ''))) > 0
    )
  )
);
create unique index one_active_waiver_per_job_item
  on public.job_checklist_waivers(attempt_id, item_id)
  where revoked_at is null;
create index job_waivers_attempt_idx
  on public.job_checklist_waivers(attempt_id, item_id);

create table public.job_issues (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  site_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  attempt_id uuid,
  category public.issue_category not null,
  severity public.issue_severity not null default 'normal',
  description text not null
    check (char_length(trim(description)) between 1 and 10000),
  status public.issue_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, id),
  unique (job_id, attempt_id, id),
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict,
  foreign key (job_id, site_id)
    references public.cleaning_jobs(id, site_id) on delete restrict,
  check (
    (status in ('resolved', 'dismissed')) = (resolved_at is not null)
  )
);
create index job_issues_job_status_idx on public.job_issues(job_id, status);
create index job_issues_reporter_created_idx
  on public.job_issues(reporter_id, created_at desc);
create index job_issues_attempt_idx on public.job_issues(attempt_id, created_at);

create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.cleaning_jobs(id) on delete restrict,
  attempt_id uuid not null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  assignment_id uuid,
  checklist_item_id uuid,
  issue_id uuid,
  category public.photo_category not null,
  bucket_id text not null default 'cleaning-job-photos'
    check (bucket_id = 'cleaning-job-photos'),
  object_path text not null unique,
  mime_type text not null
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size between 1 and 10485760),
  uploaded_at timestamptz,
  caption text,
  created_at timestamptz not null default now(),
  unique (job_id, id),
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict,
  foreign key (job_id, uploaded_by, assignment_id)
    references public.job_assignments(job_id, cleaner_id, id) on delete restrict,
  foreign key (job_id, checklist_item_id)
    references public.job_checklist_items(job_id, id) on delete restrict,
  foreign key (job_id, issue_id)
    references public.job_issues(job_id, id) on delete restrict,
  check (object_path = job_id::text || '/' || id::text),
  check ((category = 'issue') = (issue_id is not null)),
  check (
    category <> 'final_completion'
    or (checklist_item_id is null and issue_id is null)
  )
);
create index job_photos_job_category_idx
  on public.job_photos(job_id, attempt_id, category, created_at);
create index job_photos_task_category_uploaded_idx
  on public.job_photos(job_id, checklist_item_id, category, uploaded_at);

create table public.job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.cleaning_jobs(id) on delete restrict,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type public.job_event_type not null,
  attempt_id uuid,
  assignment_id uuid,
  checklist_item_id uuid,
  issue_id uuid,
  idempotency_key uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (job_id, assignment_id)
    references public.job_assignments(job_id, id) on delete restrict,
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict,
  foreign key (job_id, checklist_item_id)
    references public.job_checklist_items(job_id, id) on delete restrict,
  foreign key (job_id, issue_id)
    references public.job_issues(job_id, id) on delete restrict
);
revoke all on sequence public.job_events_id_seq
from public, anon, authenticated, service_role;
create unique index job_events_actor_idempotency_idx
  on public.job_events(actor_user_id, idempotency_key)
  where idempotency_key is not null;
create index job_events_job_time_idx on public.job_events(job_id, created_at);
create index job_events_attempt_time_idx
  on public.job_events(attempt_id, created_at);

create table public.job_reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.cleaning_jobs(id) on delete restrict,
  attempt_id uuid not null,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision public.review_decision not null,
  cleaner_instructions text,
  created_at timestamptz not null default now(),
  unique (job_id, attempt_id),
  foreign key (job_id, attempt_id)
    references public.job_attempts(job_id, id) on delete restrict
);
create index job_reviews_job_time_idx
  on public.job_reviews(job_id, created_at desc);
create index job_reviews_attempt_time_idx
  on public.job_reviews(attempt_id, created_at desc);

create table public.job_review_admin_notes (
  review_id uuid primary key
    references public.job_reviews(id) on delete restrict,
  admin_notes text not null,
  created_at timestamptz not null default now()
);

insert into public.clients(display_name, kind)
select 'Hasmmat Residence', 'internal'::public.client_kind
where not exists (
  select 1 from public.clients
  where lower(display_name) = lower('Hasmmat Residence')
);

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.current_user_is_active_cleaner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'cleaner'::public.app_role
      and p.status = 'active'::public.profile_status
  );
$$;

create function private.can_access_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.current_user_is_active_admin()
    or (
      private.current_user_is_active_cleaner()
      and exists (
        select 1
        from public.job_assignments as a
        where a.job_id = p_job_id
          and a.cleaner_id = (select auth.uid())
          and a.status <> 'removed'::public.assignment_status
          and exists (
            select 1 from public.cleaning_jobs as j
            where j.id = p_job_id
              and j.status not in (
                'draft'::public.job_status,
                'cancelled'::public.job_status
              )
          )
      )
    );
$$;

create function private.current_active_attempt_id(p_job_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id
  from public.job_attempts as a
  where a.job_id = p_job_id
    and a.status in (
      'scheduled'::public.job_attempt_status,
      'in_progress'::public.job_attempt_status,
      'awaiting_review'::public.job_attempt_status
    );
$$;

create function private.can_work_assignment(
  p_job_id uuid,
  p_attempt_id uuid,
  p_assignment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.current_user_is_active_cleaner()
    and exists (
      select 1
      from public.job_assignments as a
      join public.cleaning_jobs as j on j.id = a.job_id
      where a.id = p_assignment_id
        and a.job_id = p_job_id
        and a.status = 'in_progress'::public.assignment_status
        and private.current_active_attempt_id(p_job_id) = p_attempt_id
        and exists (
          select 1 from public.job_attempts as ja
          where ja.id = p_attempt_id
            and ja.job_id = p_job_id
            and ja.status = 'in_progress'::public.job_attempt_status
        )
        and a.cleaner_id = (select auth.uid())
        and j.status = 'in_progress'::public.job_status
        and exists (
          select 1
          from public.assignment_work_sessions as ws
          where ws.assignment_id = a.id
            and ws.attempt_id = p_attempt_id
            and ws.ended_at is null
        )
    );
$$;

create function private.can_read_issue(p_issue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.current_user_is_active_admin()
    or exists (
      select 1
      from public.job_issues as i
      where i.id = p_issue_id
        and private.current_user_is_active_cleaner()
        and (
          i.reporter_id = (select auth.uid())
          or private.can_access_job(i.job_id)
        )
    );
$$;

create function private.can_upload_reserved_photo(p_photo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.job_photos as p
    where p.id = p_photo_id
      and p.uploaded_by = (select auth.uid())
      and p.uploaded_at is null
      and (
        (
          private.current_user_is_active_admin()
          and p.assignment_id is null
          and p.category = 'inspection'::public.photo_category
          and private.current_active_attempt_id(p.job_id) = p.attempt_id
          and exists (
            select 1 from public.cleaning_jobs as j
            where j.id = p.job_id
              and j.status not in (
                'draft'::public.job_status,
                'cancelled'::public.job_status
              )
          )
        )
        or (
          private.current_user_is_active_cleaner()
          and p.assignment_id is not null
          and p.category <> 'inspection'::public.photo_category
          and private.can_work_assignment(p.job_id, p.attempt_id, p.assignment_id)
        )
      )
  );
$$;

create function private.job_completion_requirements_met(
  p_job_id uuid,
  p_attempt_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_attempt_id = private.current_active_attempt_id(p_job_id)
    and exists (
      select 1 from public.job_attempts as a
      where a.id = p_attempt_id and a.job_id = p_job_id
        and a.status = 'in_progress'::public.job_attempt_status
    )
    and
    not exists (
      select 1
      from public.job_checklist_items as i
      left join public.job_checklist_progress as p
        on p.job_id = i.job_id and p.item_id = i.id
          and p.attempt_id = p_attempt_id
      where i.job_id = p_job_id
        and p_attempt_id = private.current_active_attempt_id(p_job_id)
        and i.is_required
        and (p.item_id is null
             or p.status <> 'completed'::public.checklist_progress_status)
        and not exists (
          select 1 from public.job_checklist_waivers as w
          where w.job_id = i.job_id and w.attempt_id = p_attempt_id
            and w.item_id = i.id
            and w.revoked_at is null
        )
    )
    and not exists (
      select 1
      from public.job_checklist_items as i
      left join public.job_checklist_progress as p
        on p.job_id = i.job_id and p.item_id = i.id
          and p.attempt_id = p_attempt_id
      where i.job_id = p_job_id
        and p_attempt_id = private.current_active_attempt_id(p_job_id)
        and i.requires_photo
        and (p.item_id is null
             or p.status <> 'not_applicable'::public.checklist_progress_status)
        and not (
          i.is_required and exists (
            select 1 from public.job_checklist_waivers as w
            where w.job_id = i.job_id and w.attempt_id = p_attempt_id
              and w.item_id = i.id
              and w.revoked_at is null
          )
        )
        and not exists (
          select 1 from public.job_photos as ph
          where ph.job_id = i.job_id and ph.attempt_id = p_attempt_id
            and ph.checklist_item_id = i.id
            and ph.category = 'completion'::public.photo_category
            and ph.uploaded_at is not null
        )
    )
    and exists (
      select 1 from public.job_photos as ph
      where ph.job_id = p_job_id
        and ph.attempt_id = p_attempt_id
        and ph.category = 'final_completion'::public.photo_category
        and ph.uploaded_at is not null
    );
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.guard_template_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_id uuid;
  version_status public.template_version_status;
begin
  version_id := case when tg_op = 'DELETE'
    then old.template_version_id else new.template_version_id end;

  select v.status into version_status
  from public.checklist_template_versions as v
  where v.id = version_id
  for update;

  if version_status is distinct from 'draft'::public.template_version_status then
    raise exception using errcode = '55000',
      message = 'Published template versions are immutable';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function private.guard_template_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'retired'::public.template_version_status
     or (old.status = 'published'::public.template_version_status
         and new.status <> 'retired'::public.template_version_status) then
    raise exception using errcode = '55000',
      message = 'Published template versions cannot be changed';
  end if;
  if new.template_id is distinct from old.template_id
     or new.version_number is distinct from old.version_number
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = '55000',
      message = 'Template version identity is immutable';
  end if;
  if new.status = 'retired'::public.template_version_status
     and old.status <> 'published'::public.template_version_status then
    raise exception using errcode = '55000',
      message = 'Only a published template version can be retired';
  end if;
  if old.status = 'published'::public.template_version_status
     and row(new.published_at, new.status)
         is distinct from
         row(old.published_at, 'retired'::public.template_version_status) then
    raise exception using errcode = '55000',
      message = 'Published template content is immutable';
  end if;
  if old.status = 'draft'::public.template_version_status
     and new.status not in (
       'draft'::public.template_version_status,
       'published'::public.template_version_status
     ) then
    raise exception using errcode = '55000',
      message = 'Draft template versions must be published before retirement';
  end if;
  return new;
end;
$$;

create function private.guard_job_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_id_value uuid;
  job_status_value public.job_status;
begin
  job_id_value := case when tg_op = 'DELETE' then old.job_id else new.job_id end;
  select j.status into job_status_value
  from public.cleaning_jobs as j
  where j.id = job_id_value
  for update;

  if job_status_value is distinct from 'draft'::public.job_status then
    raise exception using errcode = '55000',
      message = 'Scheduled job checklist snapshots are immutable';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function private.guard_job_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not private.current_user_is_active_admin()
       or new.created_by is distinct from (select auth.uid())
       or new.status <> 'scheduled'::public.job_attempt_status
       or new.started_at is not null
       or new.submitted_at is not null
       or new.closed_at is not null then
      raise exception using errcode = '42501',
        message = 'Only an active administrator may create a scheduled attempt';
    end if;
    if new.attempt_number = 1 then
      if not exists (
        select 1 from public.cleaning_jobs
        where id = new.job_id and status = 'draft'::public.job_status
      ) or exists (
        select 1 from public.job_attempts where job_id = new.job_id
      ) then
        raise exception using errcode = '55000',
          message = 'Attempt 1 can only be created while scheduling a draft job';
      end if;
    elsif new.attempt_number <> (
      select coalesce(max(attempt_number), 0) + 1
      from public.job_attempts where job_id = new.job_id
    ) or not exists (
      select 1
      from public.job_attempts as prior
      join public.job_reviews as review
        on review.job_id = prior.job_id and review.attempt_id = prior.id
      join public.cleaning_jobs as job on job.id = prior.job_id
      where prior.job_id = new.job_id
        and prior.attempt_number = new.attempt_number - 1
        and prior.status = 'reclean_required'::public.job_attempt_status
        and review.decision = 'reclean_required'::public.review_decision
        and job.status = 'awaiting_review'::public.job_status
    ) then
      raise exception using errcode = '55000',
        message = 'A new attempt requires the preceding admin re-clean review';
    end if;
    return new;
  end if;
  if row(new.id, new.job_id, new.attempt_number, new.created_by, new.created_at)
     is distinct from
     row(old.id, old.job_id, old.attempt_number, old.created_by, old.created_at) then
    raise exception using errcode = '55000',
      message = 'Attempt identity and numbering are immutable';
  end if;
  if new.status is distinct from old.status then
    if not (
      (old.status = 'scheduled'::public.job_attempt_status
        and new.status = 'in_progress'::public.job_attempt_status
        and private.current_user_is_active_cleaner())
      or (old.status = 'in_progress'::public.job_attempt_status
        and new.status = 'awaiting_review'::public.job_attempt_status
        and (
          private.current_user_is_active_cleaner()
          or private.current_user_is_active_admin()
        ))
      or (old.status = 'awaiting_review'::public.job_attempt_status
        and new.status in (
          'approved'::public.job_attempt_status,
          'reclean_required'::public.job_attempt_status
        )
        and private.current_user_is_active_admin())
      or (old.status = 'scheduled'::public.job_attempt_status
        and new.status = 'cancelled'::public.job_attempt_status
        and private.current_user_is_active_admin())
    ) then
      raise exception using errcode = '42501',
        message = 'Unauthorized attempt status transition';
    end if;
    if new.status = 'awaiting_review'::public.job_attempt_status
       and (
         exists (
           select 1 from public.job_assignments
           where job_id = new.job_id
             and status not in (
               'removed'::public.assignment_status,
               'completed'::public.assignment_status
             )
         )
         or not private.job_completion_requirements_met(new.job_id, new.id)
       ) then
      raise exception using errcode = '55000',
        message = 'Attempt completion requirements are not satisfied';
    end if;
    if new.status in (
      'approved'::public.job_attempt_status,
      'reclean_required'::public.job_attempt_status
    ) and not exists (
      select 1 from public.job_reviews as r
      where r.job_id = new.job_id and r.attempt_id = new.id
        and r.decision = case new.status
          when 'approved'::public.job_attempt_status
            then 'approved'::public.review_decision
          else 'reclean_required'::public.review_decision
        end
    ) then
      raise exception using errcode = '55000',
        message = 'Attempt closure requires its matching administrator review';
    end if;
  elsif row(new.started_at, new.submitted_at, new.closed_at)
        is distinct from row(old.started_at, old.submitted_at, old.closed_at) then
    raise exception using errcode = '55000',
      message = 'Attempt timestamps may change only during a state transition';
  end if;
  if new.status = 'awaiting_review'::public.job_attempt_status
     and new.submitted_at is null then
    raise exception using errcode = '23514',
      message = 'Attempt submission timestamp is required';
  end if;
  return new;
end;
$$;

create function private.guard_work_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501',
      message = 'Work-session history cannot be deleted';
  end if;
  if tg_op = 'INSERT' then
    if not private.current_user_is_active_cleaner()
       or new.cleaner_id <> (select auth.uid())
       or new.ended_at is not null
       or not exists (
         select 1
         from public.job_attempts as a
         join public.job_assignments as ja on ja.job_id = a.job_id
         where a.id = new.attempt_id and a.job_id = new.job_id
           and a.status = 'in_progress'::public.job_attempt_status
           and ja.id = new.assignment_id and ja.cleaner_id = new.cleaner_id
           and ja.status = 'in_progress'::public.assignment_status
       ) then
      raise exception using errcode = '42501',
        message = 'Active cleaner assignment on the active attempt required';
    end if;
    return new;
  end if;
  if row(new.id, new.job_id, new.attempt_id, new.cleaner_id,
         new.assignment_id, new.started_at)
     is distinct from
     row(old.id, old.job_id, old.attempt_id, old.cleaner_id,
         old.assignment_id, old.started_at)
     or old.ended_at is not null
     or new.ended_at is null
     or new.end_reason is null
     or not private.current_user_is_active_cleaner()
     or old.cleaner_id <> (select auth.uid()) then
    raise exception using errcode = '42501',
      message = 'Work-session history is immutable except for its single close';
  end if;
  return new;
end;
$$;

create function private.guard_checklist_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_status_value public.job_attempt_status;
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501',
      message = 'Attempt checklist history cannot be deleted';
  end if;
  select status into attempt_status_value
  from public.job_attempts
  where id = new.attempt_id and job_id = new.job_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Checklist attempt not found';
  end if;
  if tg_op = 'INSERT' then
    if attempt_status_value <> 'scheduled'::public.job_attempt_status
       or not private.current_user_is_active_admin() then
      raise exception using errcode = '42501',
        message = 'Only an administrator may initialize a scheduled attempt checklist';
    end if;
    return new;
  end if;
  if row(new.job_id, new.attempt_id, new.item_id)
       is distinct from row(old.job_id, old.attempt_id, old.item_id)
     or attempt_status_value <> 'in_progress'::public.job_attempt_status
     or not private.current_user_is_active_cleaner()
     or not exists (
       select 1
       from public.job_assignments as a
       join public.assignment_work_sessions as ws
         on ws.assignment_id = a.id
       where a.job_id = new.job_id
         and a.cleaner_id = (select auth.uid())
         and a.status = 'in_progress'::public.assignment_status
         and ws.attempt_id = new.attempt_id
         and ws.ended_at is null
     ) then
    raise exception using errcode = '42501',
      message = 'Active cleaner work on this attempt is required';
  end if;
  return new;
end;
$$;

create function private.guard_checklist_waiver()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_status_value public.job_attempt_status;
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501',
      message = 'Waiver history cannot be deleted';
  end if;
  select status into attempt_status_value from public.job_attempts
  where id = new.attempt_id and job_id = new.job_id
  for update;
  if not found or attempt_status_value not in (
    'scheduled'::public.job_attempt_status,
    'in_progress'::public.job_attempt_status
  ) or not private.current_user_is_active_admin() then
    raise exception using errcode = '42501',
      message = 'Active administrator and attempt required for waiver changes';
  end if;
  if tg_op = 'INSERT' then
    if new.approved_by is distinct from (select auth.uid()) then
      raise exception using errcode = '42501',
        message = 'Waiver approver must be the authenticated administrator';
    end if;
    if not exists (
      select 1 from public.job_checklist_items
      where job_id = new.job_id and id = new.item_id and is_required
    ) then
      raise exception using errcode = '22023',
        message = 'Only required checklist items can be waived';
    end if;
  elsif row(new.id, new.job_id, new.attempt_id, new.item_id, new.approved_by,
            new.approved_at, new.reason)
        is distinct from
        row(old.id, old.job_id, old.attempt_id, old.item_id, old.approved_by,
            old.approved_at, old.reason)
     or old.revoked_at is not null
     or new.revoked_at is null
     or new.revoked_by is distinct from (select auth.uid())
     or char_length(trim(coalesce(new.revocation_reason, ''))) = 0 then
    raise exception using errcode = '42501',
      message = 'Waivers are append-preserved; only one revocation is allowed';
  end if;
  return new;
end;
$$;

create function private.guard_photo_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501',
      message = 'Historical job photo metadata cannot be deleted';
  end if;
  if tg_op = 'UPDATE' then
    if row(new.id, new.job_id, new.attempt_id, new.uploaded_by, new.assignment_id,
           new.checklist_item_id, new.issue_id, new.category, new.bucket_id,
           new.object_path, new.mime_type, new.byte_size, new.caption, new.created_at)
       is distinct from
       row(old.id, old.job_id, old.attempt_id, old.uploaded_by, old.assignment_id,
           old.checklist_item_id, old.issue_id, old.category, old.bucket_id,
           old.object_path, old.mime_type, old.byte_size, old.caption, old.created_at)
       or old.uploaded_at is not null
       or new.uploaded_at is null then
      raise exception using errcode = '42501',
        message = 'Photo metadata is immutable after reservation or upload';
    end if;
  end if;
  return new;
end;
$$;

create function private.guard_append_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '42501',
    message = 'This record is append-only';
end;
$$;

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();
create trigger client_contacts_set_updated_at
before update on public.client_contacts
for each row execute function private.set_updated_at();
create trigger sites_set_updated_at
before update on public.sites
for each row execute function private.set_updated_at();
create trigger checklist_templates_set_updated_at
before update on public.checklist_templates
for each row execute function private.set_updated_at();
create trigger cleaning_jobs_set_updated_at
before update on public.cleaning_jobs
for each row execute function private.set_updated_at();
create trigger job_issues_set_updated_at
before update on public.job_issues
for each row execute function private.set_updated_at();

create trigger job_attempts_guard
before insert or update on public.job_attempts
for each row execute function private.guard_job_attempt();
create trigger work_sessions_guard
before insert or update or delete on public.assignment_work_sessions
for each row execute function private.guard_work_session();
create trigger checklist_progress_guard
before insert or update or delete on public.job_checklist_progress
for each row execute function private.guard_checklist_progress();
create trigger checklist_waiver_guard
before insert or update or delete on public.job_checklist_waivers
for each row execute function private.guard_checklist_waiver();
create trigger template_versions_guard
before update on public.checklist_template_versions
for each row execute function private.guard_template_version();
create trigger template_sections_guard
before insert or update or delete on public.checklist_template_sections
for each row execute function private.guard_template_content();
create trigger template_items_guard
before insert or update or delete on public.checklist_template_items
for each row execute function private.guard_template_content();
create trigger job_snapshot_sections_guard
before insert or update or delete on public.job_checklist_sections
for each row execute function private.guard_job_snapshot();
create trigger job_snapshot_items_guard
before insert or update or delete on public.job_checklist_items
for each row execute function private.guard_job_snapshot();
create trigger photos_metadata_guard
before update or delete on public.job_photos
for each row execute function private.guard_photo_metadata();
create trigger job_events_append_only
before update or delete on public.job_events
for each row execute function private.guard_append_only();
create trigger job_reviews_append_only
before update or delete on public.job_reviews
for each row execute function private.guard_append_only();
create trigger job_review_admin_notes_append_only
before update or delete on public.job_review_admin_notes
for each row execute function private.guard_append_only();
create trigger job_waivers_no_delete
before delete on public.job_checklist_waivers
for each row execute function private.guard_append_only();

create function public.admin_create_client(
  p_display_name text,
  p_kind public.client_kind,
  p_admin_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_id uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  insert into public.clients(display_name, kind, admin_notes, created_by)
  values (trim(p_display_name), p_kind, p_admin_notes, actor_id)
  returning id into new_id;
  return new_id;
end;
$$;

create function public.admin_update_client(
  p_client_id uuid,
  p_display_name text,
  p_kind public.client_kind,
  p_status public.record_status,
  p_admin_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  update public.clients
  set display_name = trim(p_display_name), kind = p_kind,
      status = p_status, admin_notes = p_admin_notes
  where id = p_client_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Client not found';
  end if;
end;
$$;

create function public.admin_create_client_contact(
  p_client_id uuid,
  p_name text,
  p_email text default null,
  p_phone text default null,
  p_role_label text default null,
  p_is_primary boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  perform 1 from public.clients where id = p_client_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Client not found';
  end if;
  if p_is_primary then
    update public.client_contacts set is_primary = false
    where client_id = p_client_id;
  end if;
  insert into public.client_contacts(client_id, name, email, phone, role_label, is_primary)
  values (p_client_id, trim(p_name), p_email, p_phone, p_role_label, p_is_primary)
  returning id into new_id;
  return new_id;
end;
$$;

create function public.admin_update_client_contact(
  p_contact_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_role_label text,
  p_is_primary boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare client_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  select client_id into client_id_value from public.client_contacts
  where id = p_contact_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Contact not found';
  end if;
  perform 1 from public.clients where id = client_id_value for update;
  perform 1 from public.client_contacts
  where id = p_contact_id and client_id = client_id_value for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Contact not found';
  end if;
  if p_is_primary then
    update public.client_contacts set is_primary = false
    where client_id = client_id_value and id <> p_contact_id;
  end if;
  update public.client_contacts
  set name = trim(p_name), email = p_email, phone = p_phone,
      role_label = p_role_label, is_primary = p_is_primary
  where id = p_contact_id;
end;
$$;

create function public.admin_create_site(
  p_client_id uuid,
  p_name text,
  p_type public.site_type,
  p_address_line_1 text,
  p_address_line_2 text,
  p_city text,
  p_region text,
  p_postcode text,
  p_country_code text default 'GB',
  p_access_instructions text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := (select auth.uid()); new_id uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if not exists (
    select 1 from public.clients
    where id = p_client_id and status = 'active'::public.record_status
  ) then
    raise exception using errcode = 'P0002', message = 'Active client not found';
  end if;
  insert into public.sites(
    client_id, name, type, address_line_1, address_line_2, city,
    region, postcode, country_code, access_instructions, created_by
  ) values (
    p_client_id, trim(p_name), p_type, trim(p_address_line_1),
    p_address_line_2, trim(p_city), p_region, p_postcode,
    upper(p_country_code), p_access_instructions, actor_id
  ) returning id into new_id;
  return new_id;
end;
$$;

create function public.admin_update_site(
  p_site_id uuid,
  p_name text,
  p_type public.site_type,
  p_status public.record_status,
  p_address_line_1 text,
  p_address_line_2 text,
  p_city text,
  p_region text,
  p_postcode text,
  p_country_code text,
  p_access_instructions text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  update public.sites
  set name = trim(p_name), type = p_type, status = p_status,
      address_line_1 = trim(p_address_line_1), address_line_2 = p_address_line_2,
      city = trim(p_city), region = p_region, postcode = p_postcode,
      country_code = upper(p_country_code), access_instructions = p_access_instructions
  where id = p_site_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Site not found';
  end if;
end;
$$;

create function public.admin_create_checklist_template(
  p_name text,
  p_description text,
  p_version_number integer default 1
)
returns table(created_template_id uuid, created_version_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_version_number <> 1 then
    raise exception using errcode = '22023', message = 'Initial template version must be version 1';
  end if;
  insert into public.checklist_templates(name, description, created_by)
  values (trim(p_name), p_description, actor_id)
  returning id into created_template_id;
  insert into public.checklist_template_versions(
    template_id, version_number, created_by
  ) values (created_template_id, 1, actor_id)
  returning id into created_version_id;
  return next;
end;
$$;

create function public.admin_create_checklist_version(
  p_template_id uuid,
  p_version_number integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := (select auth.uid()); new_id uuid; expected_version integer;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  perform 1 from public.checklist_templates
  where id = p_template_id and status = 'active'::public.record_status
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Active template not found';
  end if;
  select coalesce(max(version_number), 0) + 1 into expected_version
  from public.checklist_template_versions where template_id = p_template_id;
  if p_version_number <> expected_version then
    raise exception using errcode = '22023', message = 'Template version must be the next version number';
  end if;
  insert into public.checklist_template_versions(template_id, version_number, created_by)
  values (p_template_id, p_version_number, actor_id)
  returning id into new_id;
  return new_id;
end;
$$;

create function public.admin_add_template_section(
  p_version_id uuid,
  p_title text,
  p_instructions text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if not exists (
    select 1 from public.checklist_template_versions
    where id = p_version_id and status = 'draft'::public.template_version_status
  ) then
    raise exception using errcode = '55000', message = 'Draft template version required';
  end if;
  insert into public.checklist_template_sections(
    template_version_id, title, instructions, sort_order
  ) values (p_version_id, trim(p_title), p_instructions, p_sort_order)
  returning id into new_id;
  return new_id;
end;
$$;

create function public.admin_add_template_item(
  p_version_id uuid,
  p_section_id uuid,
  p_title text,
  p_instructions text,
  p_is_required boolean,
  p_requires_photo boolean,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if not exists (
    select 1 from public.checklist_template_sections as s
    join public.checklist_template_versions as v on v.id = s.template_version_id
    where s.id = p_section_id and s.template_version_id = p_version_id
      and v.status = 'draft'::public.template_version_status
  ) then
    raise exception using errcode = '55000', message = 'Section in draft template version required';
  end if;
  insert into public.checklist_template_items(
    template_version_id, section_id, title, instructions,
    is_required, requires_photo, sort_order
  ) values (
    p_version_id, p_section_id, trim(p_title), p_instructions,
    p_is_required, p_requires_photo, p_sort_order
  ) returning id into new_id;
  return new_id;
end;
$$;

create function public.admin_publish_checklist_version(p_version_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare template_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  select template_id into template_id_value
  from public.checklist_template_versions
  where id = p_version_id and status = 'draft'::public.template_version_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Draft template version required';
  end if;
  if not exists (
    select 1 from public.checklist_template_sections
    where template_version_id = p_version_id
  ) or not exists (
    select 1 from public.checklist_template_items
    where template_version_id = p_version_id
  ) then
    raise exception using errcode = '23514', message = 'Template requires at least one section and item';
  end if;
  update public.checklist_template_versions
  set status = 'published'::public.template_version_status,
      published_at = now()
  where id = p_version_id;
  update public.checklist_template_versions
  set status = 'retired'::public.template_version_status
  where template_id = template_id_value
    and id <> p_version_id
    and status = 'published'::public.template_version_status;
end;
$$;

create function public.admin_set_site_item_override(
  p_site_id uuid,
  p_template_item_id uuid,
  p_is_enabled boolean,
  p_title_override text default null,
  p_instructions_override text default null,
  p_is_required_override boolean default null,
  p_requires_photo_override boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := (select auth.uid());
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  perform 1 from public.sites where id = p_site_id for update;
  if not found or not exists (
    select 1
    from public.checklist_template_items as i
    join public.checklist_template_versions as v on v.id = i.template_version_id
    where i.id = p_template_item_id
      and v.status in (
        'published'::public.template_version_status,
        'retired'::public.template_version_status
      )
  ) then
    raise exception using errcode = '22023', message = 'Site and published template item required';
  end if;
  insert into public.site_checklist_item_overrides(
    site_id, template_item_id, is_enabled, title_override,
    instructions_override, is_required_override,
    requires_photo_override, updated_by, updated_at
  ) values (
    p_site_id, p_template_item_id, p_is_enabled, p_title_override,
    p_instructions_override, p_is_required_override,
    p_requires_photo_override, actor_id, now()
  )
  on conflict (site_id, template_item_id) do update
  set is_enabled = excluded.is_enabled,
      title_override = excluded.title_override,
      instructions_override = excluded.instructions_override,
      is_required_override = excluded.is_required_override,
      requires_photo_override = excluded.requires_photo_override,
      updated_by = actor_id,
      updated_at = now();
end;
$$;

create function public.admin_create_job(
  p_site_id uuid,
  p_template_version_id uuid,
  p_admin_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid; actor_id uuid := (select auth.uid());
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if not exists (
    select 1 from public.sites
    where id = p_site_id and status = 'active'::public.record_status
  ) then
    raise exception using errcode = 'P0002', message = 'Active site not found';
  end if;
  if not exists (
    select 1 from public.checklist_template_versions as v
    join public.checklist_templates as t on t.id = v.template_id
    where v.id = p_template_version_id
      and v.status = 'published'::public.template_version_status
      and t.status = 'active'::public.record_status
  ) then
    raise exception using errcode = 'P0002', message = 'Published active checklist template required';
  end if;
  insert into public.cleaning_jobs(site_id, template_version_id, admin_notes, created_by)
  values (p_site_id, p_template_version_id, p_admin_notes, actor_id)
  returning id into new_id;
  insert into public.job_events(job_id, actor_user_id, event_type)
  values (new_id, actor_id, 'job_created'::public.job_event_type);
  return new_id;
end;
$$;

create function public.admin_assign_cleaner(p_job_id uuid, p_cleaner_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := (select auth.uid()); new_id uuid; job_status_value public.job_status;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  select status into job_status_value
  from public.cleaning_jobs where id = p_job_id for update;
  if not found or job_status_value not in (
    'draft'::public.job_status,
    'scheduled'::public.job_status,
    'in_progress'::public.job_status,
    'reclean_required'::public.job_status
  ) then
    raise exception using errcode = '55000', message = 'Job cannot accept assignments';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_cleaner_id
      and role = 'cleaner'::public.app_role
      and status = 'active'::public.profile_status
  ) then
    raise exception using errcode = '42501', message = 'Active cleaner profile required';
  end if;
  insert into public.job_assignments(job_id, cleaner_id, assigned_by)
  values (p_job_id, p_cleaner_id, actor_id)
  returning id into new_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id
  )
  values (
    p_job_id, actor_id, 'assignment_added'::public.job_event_type,
    private.current_active_attempt_id(p_job_id), new_id
  );
  return new_id;
end;
$$;

create function public.admin_remove_assignment(
  p_assignment_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Removal reason is required';
  end if;
  select job_id into job_id_value
  from public.job_assignments where id = p_assignment_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Assignment not found';
  end if;
  perform 1 from public.cleaning_jobs where id = job_id_value for update;
  perform 1 from public.job_assignments
  where id = p_assignment_id and status <> 'removed'::public.assignment_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Assignment is already removed';
  end if;
  if exists (
    select 1 from public.assignment_work_sessions
    where assignment_id = p_assignment_id and ended_at is null
  ) then
    raise exception using errcode = '55000', message = 'Pause or finish the cleaner work session first';
  end if;
  update public.job_assignments
  set status = 'removed'::public.assignment_status,
      removed_at = now(), removed_by = actor_id,
      removal_reason = trim(p_reason)
  where id = p_assignment_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id, metadata
  )
  values (
    job_id_value, actor_id, 'assignment_removed'::public.job_event_type,
    private.current_active_attempt_id(job_id_value), p_assignment_id,
    jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;

create function public.admin_set_assignment_status(
  p_assignment_id uuid,
  p_status public.assignment_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_status <> 'unable_to_attend'::public.assignment_status
     or p_reason is null
     or char_length(trim(p_reason)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Unable-to-attend status and reason required';
  end if;
  select job_id into job_id_value from public.job_assignments
  where id = p_assignment_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Current assignment not found';
  end if;
  perform 1 from public.cleaning_jobs where id = job_id_value for update;
  perform 1 from public.job_assignments
  where id = p_assignment_id and status in (
    'assigned'::public.assignment_status,
    'acknowledged'::public.assignment_status,
    'in_progress'::public.assignment_status
  )
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Assignment cannot be marked unable to attend';
  end if;
  if not exists (
    select 1 from public.cleaning_jobs
    where id = job_id_value and status in (
      'draft'::public.job_status,
      'scheduled'::public.job_status,
      'in_progress'::public.job_status,
      'reclean_required'::public.job_status
    )
  ) then
    raise exception using errcode = '55000', message = 'Job cannot accept assignment status changes';
  end if;
  if exists (
    select 1 from public.assignment_work_sessions
    where assignment_id = p_assignment_id and ended_at is null
  ) then
    raise exception using errcode = '55000', message = 'Cannot mark an active work session unable to attend';
  end if;
  update public.job_assignments set status = p_status where id = p_assignment_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id, metadata
  )
  values (
    job_id_value, actor_id, 'assignment_unable_to_attend'::public.job_event_type,
    private.current_active_attempt_id(job_id_value), p_assignment_id,
    jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;

create function public.admin_schedule_job(
  p_job_id uuid,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_timezone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_row public.cleaning_jobs%rowtype;
  site_row public.sites%rowtype;
  section_row record;
  item_row record;
  new_section_id uuid;
  new_item_id uuid;
  attempt_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  select * into job_row from public.cleaning_jobs
  where id = p_job_id for update;
  if not found or job_row.status <> 'draft'::public.job_status then
    raise exception using errcode = '55000', message = 'Draft job required';
  end if;
  if p_scheduled_start is null or p_scheduled_end is null
     or nullif(trim(p_timezone), '') is null then
    raise exception using errcode = '22023',
      message = 'Schedule start, end, and timezone are required';
  end if;
  if p_scheduled_end <= p_scheduled_start then
    raise exception using errcode = '22023', message = 'Scheduled end must follow start';
  end if;
  if not exists (
    select 1 from public.checklist_template_versions as v
    join public.checklist_templates as t on t.id = v.template_id
    where v.id = job_row.template_version_id
      and v.status = 'published'::public.template_version_status
      and t.status = 'active'::public.record_status
  ) then
    raise exception using errcode = '55000',
      message = 'Published version of an active checklist template required';
  end if;
  if not exists (
    select 1 from public.job_assignments as a
    where a.job_id = p_job_id and a.status <> 'removed'::public.assignment_status
  ) then
    raise exception using errcode = '23514', message = 'At least one cleaner assignment is required';
  end if;
  if exists (
    select 1 from public.job_assignments as a
    where a.job_id = p_job_id
      and a.status = 'unable_to_attend'::public.assignment_status
  ) then
    raise exception using errcode = '23514', message = 'Resolve unable-to-attend assignments before scheduling';
  end if;
  if exists (
    select 1 from public.job_assignments as a
    left join public.profiles as p on p.id = a.cleaner_id
    where a.job_id = p_job_id
      and a.status <> 'removed'::public.assignment_status
      and (p.id is null or p.role <> 'cleaner'::public.app_role
           or p.status <> 'active'::public.profile_status)
  ) then
    raise exception using errcode = '23514',
      message = 'Every scheduled assignment must belong to an active cleaner';
  end if;
  if exists (select 1 from public.job_checklist_sections where job_id = p_job_id)
     or exists (select 1 from public.job_checklist_items where job_id = p_job_id) then
    raise exception using errcode = '55000', message = 'Draft job already has checklist snapshot rows';
  end if;

  select * into site_row from public.sites
  where id = job_row.site_id and status = 'active'::public.record_status
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Active job site not found';
  end if;
  perform 1
  from public.checklist_template_versions as v
  join public.checklist_templates as t on t.id = v.template_id
  where v.id = job_row.template_version_id
    and v.status = 'published'::public.template_version_status
    and t.status = 'active'::public.record_status
  for share of v, t;
  if not found then
    raise exception using errcode = '55000', message = 'Active published checklist version required';
  end if;

  insert into public.job_attempts(
    job_id, attempt_number, status, created_by
  ) values (
    p_job_id, 1, 'scheduled'::public.job_attempt_status, actor_id
  )
  returning id into attempt_id_value;

  for section_row in
    select s.id, s.title, s.instructions, s.sort_order
    from public.checklist_template_sections as s
    where s.template_version_id = job_row.template_version_id
    order by s.sort_order
  loop
    insert into public.job_checklist_sections(
      job_id, template_version_id, source_section_id, title, instructions, sort_order
    )
    values (
      p_job_id, job_row.template_version_id, section_row.id,
      section_row.title, section_row.instructions, section_row.sort_order
    )
    returning id into new_section_id;

    for item_row in
      select
        i.id, i.title, i.instructions, i.is_required, i.requires_photo, i.sort_order,
        o.is_enabled, o.title_override, o.instructions_override,
        o.is_required_override, o.requires_photo_override
      from public.checklist_template_items as i
      left join public.site_checklist_item_overrides as o
        on o.site_id = job_row.site_id and o.template_item_id = i.id
      where i.section_id = section_row.id
      order by i.sort_order
    loop
      if coalesce(item_row.is_enabled, true) then
        insert into public.job_checklist_items(
          job_id, section_id, template_version_id, source_item_id, title, instructions,
          is_required, requires_photo, sort_order
        ) values (
          p_job_id, new_section_id, job_row.template_version_id, item_row.id,
          coalesce(item_row.title_override, item_row.title),
          coalesce(item_row.instructions_override, item_row.instructions),
          coalesce(item_row.is_required_override, item_row.is_required),
          coalesce(item_row.requires_photo_override, item_row.requires_photo),
          item_row.sort_order
        ) returning id into new_item_id;

        insert into public.job_checklist_progress(job_id, attempt_id, item_id)
        values (p_job_id, attempt_id_value, new_item_id);
      end if;
    end loop;
  end loop;

  if not exists (select 1 from public.job_checklist_items where job_id = p_job_id) then
    raise exception using errcode = '23514', message = 'Scheduled job snapshot must contain checklist items';
  end if;

  update public.cleaning_jobs
  set status = 'scheduled'::public.job_status,
      scheduled_start = p_scheduled_start,
      scheduled_end = p_scheduled_end,
      scheduled_timezone = trim(p_timezone),
      scheduled_at = now(),
      site_name_snapshot = site_row.name,
      address_snapshot = jsonb_build_object(
        'address_line_1', site_row.address_line_1,
        'address_line_2', site_row.address_line_2,
        'city', site_row.city,
        'region', site_row.region,
        'postcode', site_row.postcode,
        'country_code', site_row.country_code
      )
  where id = p_job_id;

  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, metadata
  )
  values (
    p_job_id, actor_id, 'job_scheduled'::public.job_event_type,
    attempt_id_value,
    jsonb_build_object('template_version_id', job_row.template_version_id)
  );
  insert into public.job_events(job_id, actor_user_id, event_type, attempt_id, metadata)
  values (
    p_job_id, actor_id, 'attempt_created'::public.job_event_type,
    attempt_id_value, jsonb_build_object('attempt_number', 1)
  );
end;
$$;

create function public.cleaner_acknowledge_assignment(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare actor_id uuid := (select auth.uid()); job_id_value uuid;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  select job_id into job_id_value from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id
    and status = 'assigned'::public.assignment_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Assigned job not found';
  end if;
  update public.job_assignments
  set status = 'acknowledged'::public.assignment_status, acknowledged_at = now()
  where id = p_assignment_id
    and status in (
      'assigned'::public.assignment_status,
      'acknowledged'::public.assignment_status
    );
  if not found then
    raise exception using errcode = '55000', message = 'Assignment cannot be acknowledged';
  end if;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id
  )
  values (
    job_id_value, actor_id, 'assignment_acknowledged'::public.job_event_type,
    private.current_active_attempt_id(job_id_value), p_assignment_id
  );
end;
$$;

create function public.cleaner_start_assignment(p_assignment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
  attempt_id_value uuid;
  attempt_status_value public.job_attempt_status;
  job_status_value public.job_status;
  assignment_status_value public.assignment_status;
  session_id uuid;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  select job_id into job_id_value
  from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Assignment not found';
  end if;
  perform 1 from public.cleaning_jobs where id = job_id_value for update;
  select status into job_status_value from public.cleaning_jobs where id = job_id_value;
  select id, status into attempt_id_value, attempt_status_value
  from public.job_attempts
  where job_id = job_id_value
    and status in (
      'scheduled'::public.job_attempt_status,
      'in_progress'::public.job_attempt_status
    )
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Active attempt not found';
  end if;
  select status into assignment_status_value from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id for update;

  if job_status_value not in (
    'scheduled'::public.job_status,
    'in_progress'::public.job_status,
    'reclean_required'::public.job_status
  ) then
    raise exception using errcode = '55000', message = 'Job cannot be started';
  end if;
  if assignment_status_value not in (
    'assigned'::public.assignment_status,
    'acknowledged'::public.assignment_status
  ) then
    raise exception using errcode = '55000', message = 'Assignment cannot be started';
  end if;
  if (job_status_value = 'scheduled'
      and attempt_status_value <> 'scheduled'::public.job_attempt_status)
     or (job_status_value in (
          'in_progress'::public.job_status,
          'reclean_required'::public.job_status
        )
        and attempt_status_value not in (
          'scheduled'::public.job_attempt_status,
          'in_progress'::public.job_attempt_status
        )) then
    raise exception using errcode = '55000', message = 'Job and attempt states are inconsistent';
  end if;
  if exists (
    select 1 from public.assignment_work_sessions
    where assignment_id = p_assignment_id
      and attempt_id = attempt_id_value
      and ended_at is null
  ) then
    raise exception using errcode = '23505', message = 'Assignment already has an open work session';
  end if;

  if attempt_status_value = 'scheduled'::public.job_attempt_status then
    update public.job_attempts
    set status = 'in_progress'::public.job_attempt_status,
        started_at = now()
    where id = attempt_id_value;
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, metadata
    ) values (
      job_id_value, actor_id, 'attempt_started'::public.job_event_type,
      attempt_id_value,
      jsonb_build_object('attempt_number', (
        select attempt_number from public.job_attempts where id = attempt_id_value
      ))
    );
  end if;
  if job_status_value in (
    'scheduled'::public.job_status,
    'reclean_required'::public.job_status
  ) then
    update public.cleaning_jobs
    set status = 'in_progress'::public.job_status
    where id = job_id_value;
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id
    ) values (
      job_id_value, actor_id, 'job_status_changed'::public.job_event_type,
      attempt_id_value
    );
  end if;
  update public.job_assignments
  set status = 'in_progress'::public.assignment_status,
      started_at = coalesce(started_at, now()),
      completed_at = null
  where id = p_assignment_id;
  insert into public.assignment_work_sessions(
    job_id, attempt_id, cleaner_id, assignment_id
  )
  values (job_id_value, attempt_id_value, actor_id, p_assignment_id)
  returning id into session_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id
  )
  values (
    job_id_value, actor_id, 'cleaner_started'::public.job_event_type,
    attempt_id_value, p_assignment_id
  );
  return session_id;
end;
$$;

create function public.cleaner_pause_assignment(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
  attempt_id_value uuid;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  select job_id into job_id_value from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Assignment not found';
  end if;
  perform 1 from public.cleaning_jobs
  where id = job_id_value and status = 'in_progress'::public.job_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress job required';
  end if;
  select id into attempt_id_value from public.job_attempts
  where job_id = job_id_value
    and status = 'in_progress'::public.job_attempt_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress attempt required';
  end if;
  perform 1 from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id
    and status = 'in_progress'::public.assignment_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Active assignment required';
  end if;
  update public.assignment_work_sessions
  set ended_at = now(), end_reason = 'paused'
  where assignment_id = p_assignment_id
    and attempt_id = attempt_id_value and ended_at is null;
  if not found then
    raise exception using errcode = '55000', message = 'Open work session not found';
  end if;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id
  ) values (
    job_id_value, actor_id, 'cleaner_paused'::public.job_event_type,
    attempt_id_value, p_assignment_id
  );
end;
$$;

create function public.cleaner_resume_assignment(p_assignment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
  attempt_id_value uuid;
  session_id uuid;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  select job_id into job_id_value from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Assignment not found';
  end if;
  perform 1 from public.cleaning_jobs
  where id = job_id_value and status = 'in_progress'::public.job_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress job required';
  end if;
  select id into attempt_id_value from public.job_attempts
  where job_id = job_id_value
    and status = 'in_progress'::public.job_attempt_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress attempt required';
  end if;
  perform 1 from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id
    and status = 'in_progress'::public.assignment_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress assignment required';
  end if;
  if exists (
    select 1 from public.assignment_work_sessions
    where assignment_id = p_assignment_id
      and attempt_id = attempt_id_value and ended_at is null
  ) then
    raise exception using errcode = '23505', message = 'Assignment already has an open work session';
  end if;
  insert into public.assignment_work_sessions(
    job_id, attempt_id, cleaner_id, assignment_id
  ) values (job_id_value, attempt_id_value, actor_id, p_assignment_id)
  returning id into session_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id
  ) values (
    job_id_value, actor_id, 'cleaner_resumed'::public.job_event_type,
    attempt_id_value, p_assignment_id
  );
  return session_id;
end;
$$;

create function public.cleaner_update_checklist_progress(
  p_job_id uuid,
  p_item_id uuid,
  p_status public.checklist_progress_status,
  p_reason text default null,
  p_notes text default null,
  p_expected_version integer default null,
  p_idempotency_key uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  attempt_id_value uuid;
  required_value boolean;
  old_version integer;
  next_version integer;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  if p_notes is not null and char_length(p_notes) > 4000 then
    raise exception using errcode = '22023', message = 'Checklist notes are too long';
  end if;
  perform 1 from public.cleaning_jobs
  where id = p_job_id and status = 'in_progress'::public.job_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress job required';
  end if;
  select id into attempt_id_value from public.job_attempts
  where job_id = p_job_id
    and status = 'in_progress'::public.job_attempt_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress attempt required';
  end if;
  if not exists (
    select 1 from public.job_assignments as a
    join public.assignment_work_sessions as ws
      on ws.assignment_id = a.id and ws.ended_at is null
    join public.cleaning_jobs as j on j.id = a.job_id
    where a.job_id = p_job_id and a.cleaner_id = actor_id
      and a.status = 'in_progress'::public.assignment_status
      and ws.attempt_id = attempt_id_value
      and j.status = 'in_progress'::public.job_status
  ) then
    raise exception using errcode = '42501', message = 'Active job assignment required';
  end if;
  select i.is_required into required_value
  from public.job_checklist_items as i
  where i.job_id = p_job_id and i.id = p_item_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Checklist item not found';
  end if;
  if p_status = 'not_applicable'::public.checklist_progress_status
     and required_value then
    raise exception using errcode = '42501', message = 'Required checklist items cannot be waived by cleaners';
  end if;
  if p_status = 'not_applicable'::public.checklist_progress_status
     and p_reason is not null and char_length(p_reason) > 4000 then
    raise exception using errcode = '22023', message = 'Reason is too long';
  end if;
  select version into old_version
  from public.job_checklist_progress
  where job_id = p_job_id and attempt_id = attempt_id_value
    and item_id = p_item_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Checklist progress not found';
  end if;
  if p_expected_version is null or old_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Checklist state changed; refresh and retry';
  end if;

  update public.job_checklist_progress
  set status = p_status,
      completed_by = case when p_status = 'completed'::public.checklist_progress_status then actor_id else null end,
      completed_at = case when p_status = 'completed'::public.checklist_progress_status then now() else null end,
      not_applicable_reason = case when p_status = 'not_applicable'::public.checklist_progress_status then nullif(trim(p_reason), '') else null end,
      notes = p_notes,
      version = version + 1,
      updated_at = now()
  where job_id = p_job_id and attempt_id = attempt_id_value
    and item_id = p_item_id
  returning version into next_version;

  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, checklist_item_id,
    idempotency_key, metadata
  ) values (
    p_job_id, actor_id, 'checklist_item_updated'::public.job_event_type,
    attempt_id_value,
    p_item_id, p_idempotency_key,
    jsonb_build_object(
      'status', p_status,
      'reason', nullif(trim(p_reason), ''),
      'version', next_version
    )
  );
  return next_version;
end;
$$;

create function public.admin_waive_required_item(
  p_job_id uuid,
  p_item_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  attempt_id_value uuid;
  waiver_id uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Waiver reason is required';
  end if;
  perform 1 from public.cleaning_jobs where id = p_job_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Job not found';
  end if;
  select id into attempt_id_value from public.job_attempts
  where job_id = p_job_id
    and status in (
      'scheduled'::public.job_attempt_status,
      'in_progress'::public.job_attempt_status
    )
  for update;
  if not found then
    raise exception using errcode = '55000',
      message = 'Active attempt is not eligible for checklist waivers';
  end if;
  if not exists (
    select 1 from public.job_checklist_items
    where job_id = p_job_id and id = p_item_id and is_required
  ) then
    raise exception using errcode = '22023', message = 'Required job checklist item required';
  end if;
  insert into public.job_checklist_waivers(
    job_id, attempt_id, item_id, approved_by, reason
  )
  values (p_job_id, attempt_id_value, p_item_id, actor_id, trim(p_reason))
  returning id into waiver_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, checklist_item_id, metadata
  )
  values (
    p_job_id, actor_id, 'checklist_item_waived'::public.job_event_type,
    attempt_id_value,
    p_item_id, jsonb_build_object('waiver_id', waiver_id, 'reason', trim(p_reason))
  );
  return waiver_id;
end;
$$;

create function public.admin_revoke_item_waiver(
  p_waiver_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
  attempt_id_value uuid;
  item_id_value uuid;
  attempt_status_value public.job_attempt_status;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Revocation reason is required';
  end if;
  select job_id, attempt_id, item_id
  into job_id_value, attempt_id_value, item_id_value
  from public.job_checklist_waivers
  where id = p_waiver_id and revoked_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Active waiver not found';
  end if;
  perform 1 from public.cleaning_jobs where id = job_id_value for update;
  select status into attempt_status_value
  from public.job_attempts
  where id = attempt_id_value and job_id = job_id_value
  for update;
  if not found or attempt_status_value not in (
    'scheduled'::public.job_attempt_status,
    'in_progress'::public.job_attempt_status
  ) or private.current_active_attempt_id(job_id_value)
       is distinct from attempt_id_value then
    raise exception using errcode = '55000',
      message = 'Waiver does not belong to the active attempt';
  end if;
  perform 1 from public.job_checklist_waivers
  where id = p_waiver_id and revoked_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Active waiver not found';
  end if;
  update public.job_checklist_waivers
  set revoked_by = actor_id, revoked_at = now(),
      revocation_reason = trim(p_reason)
  where id = p_waiver_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, checklist_item_id, metadata
  )
  values (
    job_id_value, actor_id, 'waiver_revoked'::public.job_event_type,
    attempt_id_value,
    item_id_value, jsonb_build_object('waiver_id', p_waiver_id, 'reason', trim(p_reason))
  );
end;
$$;

create function public.reserve_job_photo(
  p_job_id uuid,
  p_category public.photo_category,
  p_assignment_id uuid,
  p_checklist_item_id uuid,
  p_issue_id uuid,
  p_mime_type text,
  p_byte_size bigint,
  p_caption text default null
)
returns table(photo_id uuid, bucket_id text, object_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  photo_id_value uuid := gen_random_uuid();
  attempt_id_value uuid;
  attempt_status_value public.job_attempt_status;
  job_status_value public.job_status;
  is_admin boolean := private.current_user_is_active_admin();
  is_cleaner boolean := private.current_user_is_active_cleaner();
begin
  if not is_admin and not is_cleaner then
    raise exception using errcode = '42501', message = 'Active staff profile required';
  end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
     or p_byte_size not between 1 and 10485760 then
    raise exception using errcode = '22023', message = 'Unsupported photo type or size';
  end if;
  select status into job_status_value from public.cleaning_jobs
  where id = p_job_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Job not found';
  end if;
  select id, status into attempt_id_value, attempt_status_value
  from public.job_attempts
  where job_id = p_job_id
    and status in (
      'scheduled'::public.job_attempt_status,
      'in_progress'::public.job_attempt_status,
      'awaiting_review'::public.job_attempt_status
    )
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Active attempt not found';
  end if;
  if is_admin then
    if p_assignment_id is not null
       or p_category <> 'inspection'::public.photo_category
       or attempt_status_value not in (
         'scheduled'::public.job_attempt_status,
         'in_progress'::public.job_attempt_status,
         'awaiting_review'::public.job_attempt_status
       ) then
      raise exception using errcode = '42501', message = 'Admin photos must be unassigned inspection photos';
    end if;
  else
    if p_assignment_id is null
       or p_category = 'inspection'::public.photo_category
       or job_status_value <> 'in_progress'::public.job_status
       or attempt_status_value <> 'in_progress'::public.job_attempt_status
       or not private.can_work_assignment(
         p_job_id, attempt_id_value, p_assignment_id
       ) then
      raise exception using errcode = '42501', message = 'Active cleaner assignment required for photo upload';
    end if;
  end if;
  if p_category = 'issue'::public.photo_category then
    if p_issue_id is null or not exists (
      select 1 from public.job_issues
      where id = p_issue_id and job_id = p_job_id
    ) then
      raise exception using errcode = '22023', message = 'Issue photo must reference an issue on this job';
    end if;
  elsif p_issue_id is not null then
    raise exception using errcode = '22023', message = 'Only issue photos may reference an issue';
  end if;
  if p_checklist_item_id is not null and not exists (
    select 1 from public.job_checklist_items
    where id = p_checklist_item_id and job_id = p_job_id
  ) then
    raise exception using errcode = '22023', message = 'Checklist item must belong to this job';
  end if;
  if p_category = 'completion'::public.photo_category
     and p_checklist_item_id is null then
    raise exception using errcode = '22023', message = 'Task completion photos require a checklist item';
  end if;
  if p_category = 'final_completion'::public.photo_category
     and (p_checklist_item_id is not null or p_issue_id is not null) then
    raise exception using errcode = '22023', message = 'Final completion photo cannot reference a task or issue';
  end if;
  if p_category in (
    'before'::public.photo_category,
    'completion'::public.photo_category,
    'final_completion'::public.photo_category,
    'issue'::public.photo_category
  ) and job_status_value <> 'in_progress'::public.job_status then
    raise exception using errcode = '55000', message = 'Cleaner photos require an in-progress job';
  end if;

  insert into public.job_photos(
    id, job_id, attempt_id, uploaded_by, assignment_id,
    checklist_item_id, issue_id, category, bucket_id, object_path,
    mime_type, byte_size, caption
  ) values (
    photo_id_value, p_job_id, attempt_id_value, actor_id, p_assignment_id,
    p_checklist_item_id, p_issue_id, p_category, 'cleaning-job-photos',
    p_job_id::text || '/' || photo_id_value::text,
    p_mime_type, p_byte_size, p_caption
  );
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id, metadata
  )
  values (
    p_job_id, actor_id, 'photo_reserved'::public.job_event_type,
    attempt_id_value, p_assignment_id,
    jsonb_build_object('photo_id', photo_id_value, 'category', p_category)
  );
  return query select photo_id_value, 'cleaning-job-photos'::text,
    p_job_id::text || '/' || photo_id_value::text;
end;
$$;

create function public.confirm_job_photo_upload(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  photo_row public.job_photos%rowtype;
  photo_job_id uuid;
  photo_attempt_id uuid;
begin
  select job_id, attempt_id into photo_job_id, photo_attempt_id
  from public.job_photos
  where id = p_photo_id and uploaded_by = actor_id;
  if not found then
    raise exception using errcode = '42501', message = 'Reserved photo not found for this user';
  end if;
  perform 1 from public.cleaning_jobs where id = photo_job_id for update;
  perform 1 from public.job_attempts
  where id = photo_attempt_id and job_id = photo_job_id
    and status in (
      'scheduled'::public.job_attempt_status,
      'in_progress'::public.job_attempt_status,
      'awaiting_review'::public.job_attempt_status
    )
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Photo attempt is no longer active';
  end if;
  select * into photo_row from public.job_photos
  where id = p_photo_id for update;
  if not found or photo_row.uploaded_by <> actor_id then
    raise exception using errcode = '42501', message = 'Reserved photo not found for this user';
  end if;
  if photo_row.uploaded_at is not null then
    return;
  end if;
  if not private.can_upload_reserved_photo(p_photo_id) then
    raise exception using errcode = '42501', message = 'Photo upload is no longer authorized';
  end if;
  if not exists (
    select 1 from storage.objects as o
    where o.bucket_id = photo_row.bucket_id and o.name = photo_row.object_path
      and jsonb_typeof(o.metadata) = 'object'
      and o.metadata->>'mimetype' = photo_row.mime_type
      and case
        when coalesce((o.metadata->>'size') ~ '^[0-9]{1,8}$', false) then
          (o.metadata->>'size')::bigint between 1 and 10485760
          and (o.metadata->>'size')::bigint = photo_row.byte_size
        else false
      end
  ) then
    raise exception using errcode = 'P0002', message = 'Uploaded object not found';
  end if;
  update public.job_photos set uploaded_at = now() where id = p_photo_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id, metadata
  )
  values (
    photo_row.job_id, actor_id, 'photo_uploaded'::public.job_event_type,
    photo_row.attempt_id, photo_row.assignment_id,
    jsonb_build_object('photo_id', p_photo_id, 'category', photo_row.category)
  );
end;
$$;

create function public.cleaner_report_issue(
  p_job_id uuid,
  p_category public.issue_category,
  p_severity public.issue_severity,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  site_id_value uuid;
  attempt_id_value uuid;
  issue_id_value uuid;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  if p_description is null or char_length(trim(p_description)) not between 1 and 10000 then
    raise exception using errcode = '22023', message = 'Issue description is required';
  end if;
  select j.site_id into site_id_value
  from public.cleaning_jobs as j
  where j.id = p_job_id and j.status = 'in_progress'::public.job_status
    and exists (
      select 1 from public.job_assignments as a
      join public.assignment_work_sessions as ws
        on ws.assignment_id = a.id and ws.ended_at is null
      where a.job_id = j.id and a.cleaner_id = actor_id
        and a.status = 'in_progress'::public.assignment_status
    )
  for update of j;
  if not found then
    raise exception using errcode = '42501', message = 'Active assigned work session required';
  end if;
  select id into attempt_id_value
  from public.job_attempts
  where job_id = p_job_id
    and status = 'in_progress'::public.job_attempt_status
  for update;
  if not found or not exists (
    select 1 from public.job_assignments as a
    join public.assignment_work_sessions as ws
      on ws.assignment_id = a.id and ws.ended_at is null
    where a.job_id = p_job_id and a.cleaner_id = actor_id
      and a.status = 'in_progress'::public.assignment_status
      and ws.attempt_id = attempt_id_value
  ) then
    raise exception using errcode = '42501', message = 'Active attempt work session required';
  end if;
  insert into public.job_issues(
    job_id, site_id, attempt_id, reporter_id, category, severity, description
  ) values (
    p_job_id, site_id_value, attempt_id_value, actor_id, p_category,
    p_severity, trim(p_description)
  ) returning id into issue_id_value;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, issue_id
  ) values (
    p_job_id, actor_id, 'issue_reported'::public.job_event_type,
    attempt_id_value, issue_id_value
  );
  return issue_id_value;
end;
$$;

create function public.admin_resolve_issue(
  p_issue_id uuid,
  p_status public.issue_status,
  p_resolution_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
  attempt_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_status not in (
    'resolved'::public.issue_status,
    'dismissed'::public.issue_status
  ) or p_resolution_notes is null
     or char_length(trim(p_resolution_notes)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Terminal issue status and resolution notes required';
  end if;
  select job_id, attempt_id into job_id_value, attempt_id_value
  from public.job_issues
  where id = p_issue_id and status not in (
    'resolved'::public.issue_status, 'dismissed'::public.issue_status
  ) for update;
  if not found then
    raise exception using errcode = '55000', message = 'Open issue not found';
  end if;
  update public.job_issues
  set status = p_status, resolution_notes = trim(p_resolution_notes),
      resolved_by = actor_id, resolved_at = now()
  where id = p_issue_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, issue_id, metadata
  )
  values (
    job_id_value, actor_id, 'issue_resolved'::public.job_event_type,
    attempt_id_value, p_issue_id, jsonb_build_object('status', p_status)
  );
end;
$$;

create function public.cleaner_finish_assignment(p_assignment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_id_value uuid;
  attempt_id_value uuid;
  assignment_status_value public.assignment_status;
  all_assignments_done boolean;
  requirements_done boolean;
begin
  if not private.current_user_is_active_cleaner() then
    raise exception using errcode = '42501', message = 'Active cleaner required';
  end if;
  select job_id into job_id_value from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Assignment not found';
  end if;
  perform 1 from public.cleaning_jobs
  where id = job_id_value and status = 'in_progress'::public.job_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress job required';
  end if;
  select id into attempt_id_value
  from public.job_attempts
  where job_id = job_id_value
    and status = 'in_progress'::public.job_attempt_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress attempt required';
  end if;
  select status into assignment_status_value from public.job_assignments
  where id = p_assignment_id and cleaner_id = actor_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Assignment not found';
  end if;
  if assignment_status_value <> 'in_progress'::public.assignment_status then
    raise exception using errcode = '55000', message = 'In-progress assignment required';
  end if;
  if not exists (
    select 1 from public.assignment_work_sessions
    where assignment_id = p_assignment_id
      and attempt_id = attempt_id_value
      and cleaner_id = actor_id
      and ended_at is null
  ) then
    raise exception using errcode = '55000', message = 'Open work session required';
  end if;
  select not exists (
    select 1 from public.job_assignments as a
    where a.job_id = job_id_value
      and a.id <> p_assignment_id
      and a.status not in (
        'removed'::public.assignment_status,
        'completed'::public.assignment_status
      )
  )
  into all_assignments_done;
  select private.job_completion_requirements_met(job_id_value, attempt_id_value)
  into requirements_done;

  if all_assignments_done and not requirements_done then
    raise exception using errcode = '55000',
      message = 'Complete all required checklist and photo requirements before finishing the final assignment';
  end if;

  update public.assignment_work_sessions
  set ended_at = now(), end_reason = 'completed'
  where assignment_id = p_assignment_id
    and attempt_id = attempt_id_value and ended_at is null;
  if not found then
    raise exception using errcode = '55000', message = 'Open work session required';
  end if;
  update public.job_assignments
  set status = 'completed'::public.assignment_status, completed_at = now()
  where id = p_assignment_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, assignment_id
  ) values (
    job_id_value, actor_id, 'cleaner_finished'::public.job_event_type,
    attempt_id_value, p_assignment_id
  );

  if all_assignments_done and requirements_done then
    update public.job_attempts
    set status = 'awaiting_review'::public.job_attempt_status,
        submitted_at = now(),
        closed_at = null
    where id = attempt_id_value;
    update public.cleaning_jobs
    set status = 'awaiting_review'::public.job_status
    where id = job_id_value
      and status = 'in_progress'::public.job_status;
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id
    ) values (
      job_id_value, actor_id, 'job_status_changed'::public.job_event_type,
      attempt_id_value
    );
    return true;
  end if;
  return false;
end;
$$;

create function public.admin_review_job(
  p_job_id uuid,
  p_decision public.review_decision,
  p_cleaner_instructions text default null,
  p_admin_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  attempt_id_value uuid;
  attempt_number_value integer;
  next_attempt_id uuid;
  review_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  perform 1 from public.cleaning_jobs
  where id = p_job_id and status = 'awaiting_review'::public.job_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Job awaiting review required';
  end if;
  select id, attempt_number
  into attempt_id_value, attempt_number_value
  from public.job_attempts
  where job_id = p_job_id
    and status = 'awaiting_review'::public.job_attempt_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Attempt awaiting review required';
  end if;
  insert into public.job_reviews(
    job_id, attempt_id, reviewer_id, decision, cleaner_instructions
  )
  values (p_job_id, attempt_id_value, actor_id, p_decision, p_cleaner_instructions)
  returning id into review_id_value;
  if p_admin_notes is not null and char_length(trim(p_admin_notes)) > 0 then
    insert into public.job_review_admin_notes(review_id, admin_notes)
    values (review_id_value, trim(p_admin_notes));
  end if;
  if p_decision = 'approved'::public.review_decision then
    update public.job_attempts
    set status = 'approved'::public.job_attempt_status, closed_at = now()
    where id = attempt_id_value;
    update public.cleaning_jobs
    set status = 'approved'::public.job_status
    where id = p_job_id;
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, metadata
    )
    values (
      p_job_id, actor_id, 'admin_reviewed'::public.job_event_type,
      attempt_id_value,
      jsonb_build_object('decision', p_decision, 'review_id', review_id_value)
    );
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, metadata
    )
    values (
      p_job_id, actor_id, 'attempt_closed'::public.job_event_type,
      attempt_id_value,
      jsonb_build_object('decision', p_decision, 'review_id', review_id_value)
    );
  else
    update public.job_attempts
    set status = 'reclean_required'::public.job_attempt_status,
        closed_at = now()
    where id = attempt_id_value;
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, metadata
    )
    values (
      p_job_id, actor_id, 'attempt_closed'::public.job_event_type,
      attempt_id_value,
      jsonb_build_object('decision', p_decision, 'review_id', review_id_value)
    );

    insert into public.job_attempts(
      job_id, attempt_number, status, created_by
    )
    values (
      p_job_id, attempt_number_value + 1,
      'scheduled'::public.job_attempt_status, actor_id
    )
    returning id into next_attempt_id;

    insert into public.job_checklist_progress(job_id, attempt_id, item_id)
    select p_job_id, next_attempt_id, i.id
    from public.job_checklist_items as i
    where i.job_id = p_job_id;

    with prepared as (
      update public.job_assignments
      set status = 'acknowledged'::public.assignment_status,
          acknowledged_at = coalesce(acknowledged_at, now()),
          completed_at = null
      where job_id = p_job_id
        and status = 'completed'::public.assignment_status
      returning id
    )
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, assignment_id, metadata
    )
    select
      p_job_id, actor_id,
      'assignment_prepared_for_reclean'::public.job_event_type,
      next_attempt_id, prepared.id,
      jsonb_build_object(
        'closed_attempt_id', attempt_id_value,
        'next_attempt_id', next_attempt_id
      )
    from prepared;

    /*
     * Per-attempt work-session rows retain all historical start/end times;
     * this status is only the current job-level assignment state.
     */
    /* assignment status was updated in the CTE immediately above */

    update public.cleaning_jobs
    set status = 'reclean_required'::public.job_status
    where id = p_job_id;

    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, metadata
    )
    values (
      p_job_id, actor_id, 'reclean_requested'::public.job_event_type,
      attempt_id_value,
      jsonb_build_object(
        'decision', p_decision,
        'review_id', review_id_value,
        'next_attempt_id', next_attempt_id,
        'next_attempt_number', attempt_number_value + 1
      )
    );
    insert into public.job_events(
      job_id, actor_user_id, event_type, attempt_id, metadata
    )
    values (
      p_job_id, actor_id, 'attempt_created'::public.job_event_type,
      next_attempt_id,
      jsonb_build_object('attempt_number', attempt_number_value + 1)
    );
  end if;
  return review_id_value;
end;
$$;

create function public.admin_finalize_job(p_job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  attempt_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  perform 1 from public.cleaning_jobs
  where id = p_job_id and status = 'in_progress'::public.job_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress job required';
  end if;
  select id into attempt_id_value from public.job_attempts
  where job_id = p_job_id
    and status = 'in_progress'::public.job_attempt_status
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'In-progress attempt required';
  end if;
  if exists (
    select 1 from public.job_assignments
    where job_id = p_job_id
      and status not in (
        'removed'::public.assignment_status,
        'completed'::public.assignment_status
      )
  ) or not private.job_completion_requirements_met(p_job_id, attempt_id_value) then
    return false;
  end if;
  update public.job_attempts
  set status = 'awaiting_review'::public.job_attempt_status,
      submitted_at = now()
  where id = attempt_id_value;
  update public.cleaning_jobs
  set status = 'awaiting_review'::public.job_status
  where id = p_job_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id
  ) values (
    p_job_id, actor_id, 'job_status_changed'::public.job_event_type,
    attempt_id_value
  );
  return true;
end;
$$;

create function public.admin_cancel_job(p_job_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  attempt_id_value uuid;
begin
  if not private.current_user_is_active_admin() then
    raise exception using errcode = '42501', message = 'Active administrator required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Cancellation reason is required';
  end if;
  perform 1 from public.cleaning_jobs
  where id = p_job_id
    and status in (
      'draft'::public.job_status,
      'scheduled'::public.job_status,
      'reclean_required'::public.job_status
    )
  for update;
  if not found then
    raise exception using errcode = '55000', message = 'Job cannot be cancelled';
  end if;
  select id into attempt_id_value from public.job_attempts
  where job_id = p_job_id
    and status = 'scheduled'::public.job_attempt_status
  for update;
  if exists (
    select 1 from public.assignment_work_sessions
    where job_id = p_job_id and ended_at is null
  ) then
    raise exception using errcode = '55000',
      message = 'Open work sessions must be closed before cancellation';
  end if;
  if attempt_id_value is not null then
    update public.job_attempts
    set status = 'cancelled'::public.job_attempt_status,
        closed_at = now()
    where id = attempt_id_value;
  end if;
  update public.cleaning_jobs
  set status = 'cancelled'::public.job_status
  where id = p_job_id;
  insert into public.job_events(
    job_id, actor_user_id, event_type, attempt_id, metadata
  )
  values (
    p_job_id, actor_id, 'job_cancelled'::public.job_event_type,
    attempt_id_value,
    jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;

-- Guard transitions after the helper trigger is installed. The transaction owner
-- still uses ordinary UPDATE statements; RPCs explicitly authorize transitions.
create function private.guard_job_status_rpc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft'::public.job_status
        and new.status = 'scheduled'::public.job_status
        and private.current_user_is_active_admin())
      or (old.status in (
          'scheduled'::public.job_status, 'reclean_required'::public.job_status
        )
        and new.status = 'in_progress'::public.job_status
        and private.current_user_is_active_cleaner())
      or (old.status = 'in_progress'::public.job_status
        and new.status = 'awaiting_review'::public.job_status
        and (
          private.current_user_is_active_cleaner()
          or private.current_user_is_active_admin()
        ))
      or (old.status = 'awaiting_review'::public.job_status
        and new.status in (
          'approved'::public.job_status, 'reclean_required'::public.job_status
        )
        and private.current_user_is_active_admin())
      or (old.status in (
          'draft'::public.job_status, 'scheduled'::public.job_status,
          'reclean_required'::public.job_status
        )
        and new.status = 'cancelled'::public.job_status
        and private.current_user_is_active_admin())
    ) then
      raise exception using errcode = '42501',
        message = 'Unauthorized job status transition';
    end if;
    if (
      new.status = 'scheduled'::public.job_status
      and not exists (
        select 1 from public.job_attempts
        where job_id = new.id and attempt_number = 1
          and status = 'scheduled'::public.job_attempt_status
      )
      or new.status = 'scheduled'::public.job_status
      and exists (
        select 1 from public.job_attempts
        where job_id = new.id and attempt_number <> 1
      )
    ) or (
      new.status = 'in_progress'::public.job_status
      and not exists (
        select 1 from public.job_attempts
        where job_id = new.id
          and attempt_number = (
            select max(attempt_number) from public.job_attempts
            where job_id = new.id
          )
          and status = 'in_progress'::public.job_attempt_status
      )
    ) or (
      new.status = 'awaiting_review'::public.job_status
      and not exists (
        select 1 from public.job_attempts
        where job_id = new.id
          and attempt_number = (
            select max(attempt_number) from public.job_attempts
            where job_id = new.id
          )
          and status = 'awaiting_review'::public.job_attempt_status
      )
    ) or (
      new.status = 'approved'::public.job_status
      and (
        not exists (
        select 1 from public.job_attempts
        where job_id = new.id
          and attempt_number = (
            select max(attempt_number) from public.job_attempts
            where job_id = new.id
          )
          and status = 'approved'::public.job_attempt_status
          and closed_at is not null
        )
        or exists (
          select 1 from public.job_attempts
          where job_id = new.id
            and status in (
              'scheduled'::public.job_attempt_status,
              'in_progress'::public.job_attempt_status,
              'awaiting_review'::public.job_attempt_status
            )
        )
      )
    ) or (
      new.status = 'reclean_required'::public.job_status
      and (
        not exists (
          select 1 from public.job_attempts as next_attempt
          where next_attempt.job_id = new.id
            and next_attempt.status = 'scheduled'::public.job_attempt_status
            and next_attempt.attempt_number = (
              select max(attempt_number) from public.job_attempts
              where job_id = new.id
            )
            and exists (
              select 1 from public.job_attempts as prior_attempt
              where prior_attempt.job_id = next_attempt.job_id
                and prior_attempt.attempt_number = next_attempt.attempt_number - 1
                and prior_attempt.status = 'reclean_required'::public.job_attempt_status
                and prior_attempt.closed_at is not null
            )
        )
      )
    ) or (
      new.status = 'cancelled'::public.job_status
      and (
        exists (
          select 1 from public.job_attempts
          where job_id = new.id
            and status in (
              'scheduled'::public.job_attempt_status,
              'in_progress'::public.job_attempt_status,
              'awaiting_review'::public.job_attempt_status
            )
        )
        or exists (
          select 1 from public.job_attempts as latest
          where latest.job_id = new.id
            and latest.attempt_number = (
              select max(attempt_number) from public.job_attempts
              where job_id = new.id
            )
            and latest.status <> 'cancelled'::public.job_attempt_status
        )
      )
    ) then
      raise exception using errcode = '55000',
        message = 'Job and active-attempt states are inconsistent';
    end if;
  end if;
  if old.status <> 'draft'::public.job_status
     and row(new.site_id, new.template_version_id, new.site_name_snapshot,
             new.address_snapshot)
         is distinct from
         row(old.site_id, old.template_version_id, old.site_name_snapshot,
             old.address_snapshot) then
    raise exception using errcode = '55000',
      message = 'Scheduled job identity and checklist source are immutable';
  end if;
  return new;
end;
$$;

create trigger job_status_guard
before update on public.cleaning_jobs
for each row execute function private.guard_job_status_rpc();

-- Every application table is closed to anonymous users and direct DML.
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.sites enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_versions enable row level security;
alter table public.checklist_template_sections enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.site_checklist_item_overrides enable row level security;
alter table public.cleaning_jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.job_attempts enable row level security;
alter table public.assignment_work_sessions enable row level security;
alter table public.job_checklist_sections enable row level security;
alter table public.job_checklist_items enable row level security;
alter table public.job_checklist_progress enable row level security;
alter table public.job_checklist_waivers enable row level security;
alter table public.job_issues enable row level security;
alter table public.job_photos enable row level security;
alter table public.job_events enable row level security;
alter table public.job_reviews enable row level security;
alter table public.job_review_admin_notes enable row level security;

revoke all on table
  public.clients, public.client_contacts, public.sites,
  public.checklist_templates, public.checklist_template_versions,
  public.checklist_template_sections, public.checklist_template_items,
  public.site_checklist_item_overrides, public.cleaning_jobs,
  public.job_assignments, public.job_attempts, public.assignment_work_sessions,
  public.job_checklist_sections, public.job_checklist_items,
  public.job_checklist_progress, public.job_checklist_waivers,
  public.job_issues, public.job_photos, public.job_events,
  public.job_reviews, public.job_review_admin_notes
from public, anon, authenticated, service_role;

grant select on table
  public.clients, public.client_contacts, public.sites,
  public.checklist_templates, public.checklist_template_versions,
  public.checklist_template_sections, public.checklist_template_items,
  public.site_checklist_item_overrides, public.cleaning_jobs,
  public.job_assignments, public.job_attempts, public.assignment_work_sessions,
  public.job_checklist_sections, public.job_checklist_items,
  public.job_checklist_progress, public.job_checklist_waivers,
  public.job_issues, public.job_photos, public.job_events,
  public.job_reviews, public.job_review_admin_notes
to authenticated;

create policy clients_admin_select on public.clients
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy client_contacts_admin_select on public.client_contacts
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy sites_access_select on public.sites
for select to authenticated
using (
  (select private.current_user_is_active_admin())
  or exists (
    select 1 from public.cleaning_jobs as j
    where j.site_id = sites.id and private.can_access_job(j.id)
  )
);
create policy templates_admin_select on public.checklist_templates
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy template_versions_admin_select on public.checklist_template_versions
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy template_sections_admin_select on public.checklist_template_sections
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy template_items_admin_select on public.checklist_template_items
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy site_overrides_admin_select on public.site_checklist_item_overrides
for select to authenticated
using ((select private.current_user_is_active_admin()));
create policy jobs_access_select on public.cleaning_jobs
for select to authenticated
using ((select private.can_access_job(id)));
create policy assignments_access_select on public.job_assignments
for select to authenticated
using (
  (select private.current_user_is_active_admin())
  or (
    cleaner_id = (select auth.uid())
    and status <> 'removed'::public.assignment_status
    and (select private.can_access_job(job_id))
  )
);
create policy attempts_access_select on public.job_attempts
for select to authenticated
using ((select private.can_access_job(job_id)));
create policy work_sessions_access_select on public.assignment_work_sessions
for select to authenticated
using (
  (select private.current_user_is_active_admin())
  or (
    cleaner_id = (select auth.uid())
    and (select private.can_access_job(job_id))
  )
);
create policy job_sections_access_select on public.job_checklist_sections
for select to authenticated
using ((select private.can_access_job(job_id)));
create policy job_items_access_select on public.job_checklist_items
for select to authenticated
using ((select private.can_access_job(job_id)));
create policy job_progress_access_select on public.job_checklist_progress
for select to authenticated
using ((select private.can_access_job(job_id)));
create policy job_waivers_access_select on public.job_checklist_waivers
for select to authenticated
using ((select private.can_access_job(job_id)));
create policy issues_access_select on public.job_issues
for select to authenticated
using ((select private.can_read_issue(id)));
create policy photos_access_select on public.job_photos
for select to authenticated
using (
  (select private.current_user_is_active_admin())
  or (select private.can_access_job(job_id))
  or (
    category = 'issue'::public.photo_category
    and issue_id is not null
    and (select private.can_read_issue(issue_id))
  )
);
create policy events_access_select on public.job_events
for select to authenticated
using (
  (select private.current_user_is_active_admin())
  or (select private.can_access_job(job_id))
);
create policy reviews_access_select on public.job_reviews
for select to authenticated
using (
  (select private.current_user_is_active_admin())
  or (select private.can_access_job(job_id))
);
create policy review_admin_notes_admin_select on public.job_review_admin_notes
for select to authenticated
using ((select private.current_user_is_active_admin()));

-- Storage policies are scoped to the future private bucket ID. This migration
-- deliberately does not create the bucket.
do $$
begin
  if exists (
    select 1 from storage.buckets as b
    where b.id = 'cleaning-job-photos' and b."public"
  ) then
    raise exception 'cleaning-job-photos must be a private Storage bucket';
  end if;
end;
$$;

create policy cleaning_job_photos_authorized_read
on storage.objects
for select to authenticated
using (
  bucket_id = 'cleaning-job-photos'
  and exists (
    select 1 from public.job_photos as p
    where p.bucket_id = storage.objects.bucket_id
      and p.object_path = storage.objects.name
      and p.uploaded_at is not null
      and (
        private.current_user_is_active_admin()
        or private.can_access_job(p.job_id)
        or (
          p.category = 'issue'::public.photo_category
          and p.issue_id is not null
          and private.can_read_issue(p.issue_id)
        )
      )
  )
);

create policy cleaning_job_photos_authorized_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'cleaning-job-photos'
  and exists (
    select 1 from public.job_photos as p
    where p.bucket_id = storage.objects.bucket_id
      and p.object_path = storage.objects.name
      and private.can_upload_reserved_photo(p.id)
  )
);

create policy cleaning_job_photos_enforce_read
on storage.objects
as restrictive
for select to authenticated
using (
  bucket_id <> 'cleaning-job-photos'
  or (
    exists (
      select 1 from public.job_photos as p
      where p.bucket_id = storage.objects.bucket_id
        and p.object_path = storage.objects.name
        and p.uploaded_at is not null
        and (
          private.current_user_is_active_admin()
          or private.can_access_job(p.job_id)
          or (
            p.category = 'issue'::public.photo_category
            and p.issue_id is not null
            and private.can_read_issue(p.issue_id)
          )
        )
    )
  )
);

create policy cleaning_job_photos_enforce_insert
on storage.objects
as restrictive
for insert to authenticated
with check (
  bucket_id <> 'cleaning-job-photos'
  or exists (
    select 1 from public.job_photos as p
    where p.bucket_id = storage.objects.bucket_id
      and p.object_path = storage.objects.name
      and private.can_upload_reserved_photo(p.id)
  )
);

create policy cleaning_job_photos_enforce_no_update
on storage.objects
as restrictive
for update to authenticated
using (bucket_id <> 'cleaning-job-photos')
with check (bucket_id <> 'cleaning-job-photos');

create policy cleaning_job_photos_enforce_no_delete
on storage.objects
as restrictive
for delete to authenticated
using (bucket_id <> 'cleaning-job-photos');

create policy cleaning_job_photos_block_anon_read
on storage.objects
as restrictive
for select to anon
using (bucket_id <> 'cleaning-job-photos');

create policy cleaning_job_photos_block_anon_insert
on storage.objects
as restrictive
for insert to anon
with check (bucket_id <> 'cleaning-job-photos');

create policy cleaning_job_photos_block_anon_update
on storage.objects
as restrictive
for update to anon
using (bucket_id <> 'cleaning-job-photos')
with check (bucket_id <> 'cleaning-job-photos');

create policy cleaning_job_photos_block_anon_delete
on storage.objects
as restrictive
for delete to anon
using (bucket_id <> 'cleaning-job-photos');

revoke all on function private.current_user_is_active_cleaner() from public, anon;
revoke all on function private.can_access_job(uuid) from public, anon;
revoke all on function private.current_active_attempt_id(uuid) from public, anon, authenticated;
revoke all on function private.can_work_assignment(uuid, uuid, uuid) from public, anon;
revoke all on function private.can_read_issue(uuid) from public, anon;
revoke all on function private.can_upload_reserved_photo(uuid) from public, anon;
revoke all on function private.job_completion_requirements_met(uuid, uuid) from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.guard_job_attempt() from public, anon, authenticated;
revoke all on function private.guard_work_session() from public, anon, authenticated;
revoke all on function private.guard_checklist_progress() from public, anon, authenticated;
revoke all on function private.guard_checklist_waiver() from public, anon, authenticated;
revoke all on function private.guard_template_content() from public, anon, authenticated;
revoke all on function private.guard_template_version() from public, anon, authenticated;
revoke all on function private.guard_job_snapshot() from public, anon, authenticated;
revoke all on function private.guard_photo_metadata() from public, anon, authenticated;
revoke all on function private.guard_append_only() from public, anon, authenticated;
revoke all on function private.guard_job_status_rpc() from public, anon, authenticated;
grant execute on function private.current_user_is_active_cleaner() to authenticated;
grant execute on function private.can_access_job(uuid) to authenticated;
grant execute on function private.can_work_assignment(uuid, uuid, uuid) to authenticated;
grant execute on function private.can_read_issue(uuid) to authenticated;
grant execute on function private.can_upload_reserved_photo(uuid) to authenticated;

revoke all on function public.admin_create_client(text, public.client_kind, text) from public, anon;
revoke all on function public.admin_update_client(uuid, text, public.client_kind, public.record_status, text) from public, anon;
revoke all on function public.admin_create_client_contact(uuid, text, text, text, text, boolean) from public, anon;
revoke all on function public.admin_update_client_contact(uuid, text, text, text, text, boolean) from public, anon;
revoke all on function public.admin_create_site(uuid, text, public.site_type, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.admin_update_site(uuid, text, public.site_type, public.record_status, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.admin_create_checklist_template(text, text, integer) from public, anon;
revoke all on function public.admin_create_checklist_version(uuid, integer) from public, anon;
revoke all on function public.admin_add_template_section(uuid, text, text, integer) from public, anon;
revoke all on function public.admin_add_template_item(uuid, uuid, text, text, boolean, boolean, integer) from public, anon;
revoke all on function public.admin_publish_checklist_version(uuid) from public, anon;
revoke all on function public.admin_set_site_item_override(uuid, uuid, boolean, text, text, boolean, boolean) from public, anon;
revoke all on function public.admin_create_job(uuid, uuid, text) from public, anon;
revoke all on function public.admin_assign_cleaner(uuid, uuid) from public, anon;
revoke all on function public.admin_remove_assignment(uuid, text) from public, anon;
revoke all on function public.admin_set_assignment_status(uuid, public.assignment_status, text) from public, anon;
revoke all on function public.admin_schedule_job(uuid, timestamptz, timestamptz, text) from public, anon;
revoke all on function public.cleaner_acknowledge_assignment(uuid) from public, anon;
revoke all on function public.cleaner_start_assignment(uuid) from public, anon;
revoke all on function public.cleaner_pause_assignment(uuid) from public, anon;
revoke all on function public.cleaner_resume_assignment(uuid) from public, anon;
revoke all on function public.cleaner_update_checklist_progress(uuid, uuid, public.checklist_progress_status, text, text, integer, uuid) from public, anon;
revoke all on function public.admin_waive_required_item(uuid, uuid, text) from public, anon;
revoke all on function public.admin_revoke_item_waiver(uuid, text) from public, anon;
revoke all on function public.reserve_job_photo(uuid, public.photo_category, uuid, uuid, uuid, text, bigint, text) from public, anon;
revoke all on function public.confirm_job_photo_upload(uuid) from public, anon;
revoke all on function public.cleaner_report_issue(uuid, public.issue_category, public.issue_severity, text) from public, anon;
revoke all on function public.admin_resolve_issue(uuid, public.issue_status, text) from public, anon;
revoke all on function public.cleaner_finish_assignment(uuid) from public, anon;
revoke all on function public.admin_review_job(uuid, public.review_decision, text, text) from public, anon;
revoke all on function public.admin_finalize_job(uuid) from public, anon;
revoke all on function public.admin_cancel_job(uuid, text) from public, anon;

grant execute on function public.admin_create_client(text, public.client_kind, text) to authenticated;
grant execute on function public.admin_update_client(uuid, text, public.client_kind, public.record_status, text) to authenticated;
grant execute on function public.admin_create_client_contact(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.admin_update_client_contact(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.admin_create_site(uuid, text, public.site_type, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_update_site(uuid, text, public.site_type, public.record_status, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_create_checklist_template(text, text, integer) to authenticated;
grant execute on function public.admin_create_checklist_version(uuid, integer) to authenticated;
grant execute on function public.admin_add_template_section(uuid, text, text, integer) to authenticated;
grant execute on function public.admin_add_template_item(uuid, uuid, text, text, boolean, boolean, integer) to authenticated;
grant execute on function public.admin_publish_checklist_version(uuid) to authenticated;
grant execute on function public.admin_set_site_item_override(uuid, uuid, boolean, text, text, boolean, boolean) to authenticated;
grant execute on function public.admin_create_job(uuid, uuid, text) to authenticated;
grant execute on function public.admin_assign_cleaner(uuid, uuid) to authenticated;
grant execute on function public.admin_remove_assignment(uuid, text) to authenticated;
grant execute on function public.admin_set_assignment_status(uuid, public.assignment_status, text) to authenticated;
grant execute on function public.admin_schedule_job(uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.cleaner_acknowledge_assignment(uuid) to authenticated;
grant execute on function public.cleaner_start_assignment(uuid) to authenticated;
grant execute on function public.cleaner_pause_assignment(uuid) to authenticated;
grant execute on function public.cleaner_resume_assignment(uuid) to authenticated;
grant execute on function public.cleaner_update_checklist_progress(uuid, uuid, public.checklist_progress_status, text, text, integer, uuid) to authenticated;
grant execute on function public.admin_waive_required_item(uuid, uuid, text) to authenticated;
grant execute on function public.admin_revoke_item_waiver(uuid, text) to authenticated;
grant execute on function public.reserve_job_photo(uuid, public.photo_category, uuid, uuid, uuid, text, bigint, text) to authenticated;
grant execute on function public.confirm_job_photo_upload(uuid) to authenticated;
grant execute on function public.cleaner_report_issue(uuid, public.issue_category, public.issue_severity, text) to authenticated;
grant execute on function public.admin_resolve_issue(uuid, public.issue_status, text) to authenticated;
grant execute on function public.cleaner_finish_assignment(uuid) to authenticated;
grant execute on function public.admin_review_job(uuid, public.review_decision, text, text) to authenticated;
grant execute on function public.admin_finalize_job(uuid) to authenticated;
grant execute on function public.admin_cancel_job(uuid, text) to authenticated;

comment on table public.job_checklist_items is
  'Immutable task snapshot copied from the selected published template when its job is scheduled.';
comment on table public.job_checklist_waivers is
  'Append-preserved administrator approval records for waiving required job checklist items.';
comment on table public.job_photos is
  'Private Storage metadata. uploaded_by is the authenticated profile; assignment_id is null for admin inspection uploads.';
comment on table public.job_events is
  'Append-only operational event history for a cleaning job.';

commit;
