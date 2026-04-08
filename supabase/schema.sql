create extension if not exists pgcrypto;

create table if not exists public.client_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'Client',
  company text not null default 'Client account',
  role text not null default 'Client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_company text not null,
  client_email text not null,
  title text not null,
  summary text not null default '',
  status text not null default 'Awaiting approval',
  valid_until date,
  timeline text not null default 'TBC',
  notes text not null default '',
  contact_email text not null default 'hello@noventisdigital.co.uk',
  scope text[] not null default '{}',
  line_items jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  subject_user_id uuid references auth.users(id) on delete set null,
  scope text not null check (scope in ('client_portal', 'admin_console')),
  event_type text not null,
  route text,
  quote_id uuid references public.quotes(id) on delete set null,
  document_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists portal_audit_logs_actor_created_at_idx
on public.portal_audit_logs (actor_user_id, created_at desc);

create index if not exists portal_audit_logs_scope_created_at_idx
on public.portal_audit_logs (scope, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin_user(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = coalesce(target_user_id, auth.uid())
  );
$$;

grant execute on function public.is_admin_user(uuid) to authenticated, service_role;

drop trigger if exists client_profiles_set_updated_at on public.client_profiles;

create trigger client_profiles_set_updated_at
before update on public.client_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;

create trigger quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_updated_at();

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.client_profiles (
    id,
    email,
    full_name,
    company,
    role
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'client'), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'company', new.raw_user_meta_data ->> 'organisation', 'Client account'),
    coalesce(new.raw_user_meta_data ->> 'role', 'Client')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    company = excluded.company,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_profile();

insert into public.client_profiles (
  id,
  email,
  full_name,
  company,
  role
)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', split_part(coalesce(users.email, 'client'), '@', 1)),
  coalesce(users.raw_user_meta_data ->> 'company', users.raw_user_meta_data ->> 'organisation', 'Client account'),
  coalesce(users.raw_user_meta_data ->> 'role', 'Client')
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  company = excluded.company,
  role = excluded.role;

alter table public.client_profiles enable row level security;
alter table public.quotes enable row level security;
alter table public.admin_users enable row level security;
alter table public.portal_audit_logs enable row level security;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'client-documents',
  'client-documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clients can view own profile" on public.client_profiles;
drop policy if exists "Clients can update own profile" on public.client_profiles;
drop policy if exists "Service role can manage profiles" on public.client_profiles;
drop policy if exists "Admins can view own admin record" on public.admin_users;
drop policy if exists "Service role can manage admin records" on public.admin_users;
drop policy if exists "Admins can view audit logs" on public.portal_audit_logs;
drop policy if exists "Authenticated users can insert own audit logs" on public.portal_audit_logs;
drop policy if exists "Service role can manage audit logs" on public.portal_audit_logs;

create policy "Clients can view own profile"
on public.client_profiles
for select
using (auth.uid() = id);

create policy "Clients can update own profile"
on public.client_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Service role can manage profiles"
on public.client_profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Admins can view own admin record"
on public.admin_users
for select
using (auth.uid() = id);

create policy "Service role can manage admin records"
on public.admin_users
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Clients can view own quotes" on public.quotes;
drop policy if exists "Service role can manage quotes" on public.quotes;
drop policy if exists "Clients can view own storage documents" on storage.objects;
drop policy if exists "Service role can manage storage documents" on storage.objects;

create policy "Clients can view own quotes"
on public.quotes
for select
using (auth.uid() = auth_user_id);

create policy "Service role can manage quotes"
on public.quotes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Admins can view audit logs"
on public.portal_audit_logs
for select
using (public.is_admin_user());

create policy "Authenticated users can insert own audit logs"
on public.portal_audit_logs
for insert
to authenticated
with check (
  auth.uid() = actor_user_id
  and (
    scope = 'client_portal'
    or public.is_admin_user()
  )
  and (
    subject_user_id is null
    or subject_user_id = actor_user_id
    or public.is_admin_user()
  )
);

create policy "Service role can manage audit logs"
on public.portal_audit_logs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Clients can view own storage documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Service role can manage storage documents"
on storage.objects
for all
to service_role
using (bucket_id = 'client-documents')
with check (bucket_id = 'client-documents');

comment on table public.client_profiles is 'Client directory rows used by the Noventis Digital portal.';
comment on table public.quotes is 'Client-facing quote records surfaced in the Noventis Digital portal.';
comment on table public.admin_users is 'Users allowed to access the Noventis admin console.';
comment on table public.portal_audit_logs is 'Audit trail for client portal activity and admin console actions.';
