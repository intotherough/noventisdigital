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
  total_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

drop policy if exists "Clients can view own profile" on public.client_profiles;
drop policy if exists "Clients can update own profile" on public.client_profiles;
drop policy if exists "Service role can manage profiles" on public.client_profiles;

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

drop policy if exists "Clients can view own quotes" on public.quotes;
drop policy if exists "Service role can manage quotes" on public.quotes;

create policy "Clients can view own quotes"
on public.quotes
for select
using (auth.uid() = auth_user_id);

create policy "Service role can manage quotes"
on public.quotes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

comment on table public.client_profiles is 'Client directory rows used by the Noventis Digital portal.';
comment on table public.quotes is 'Client-facing quote records surfaced in the Noventis Digital portal.';
