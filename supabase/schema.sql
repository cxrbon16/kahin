-- Kâhin — schema for World Cup 2026 prediction game.
-- Run this in the Supabase SQL editor (Project -> SQL -> New query).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id text primary key,            -- 3-letter code, e.g. 'TUR'
  name text not null,
  flag text not null default '',  -- emoji flag
  group_code text not null        -- 'A' .. 'L'
);

create table if not exists predictions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  groups jsonb not null default '{}'::jsonb,
  knockout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Singleton row (id = 1) holding the actual results entered by an admin.
create table if not exists results (
  id int primary key default 1,
  groups jsonb not null default '{}'::jsonb,
  knockout jsonb not null default '{}'::jsonb,
  locked boolean not null default false, -- when true, players can no longer edit predictions
  updated_at timestamptz not null default now(),
  constraint results_singleton check (id = 1)
);

insert into results (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user signs up
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table teams enable row level security;
alter table predictions enable row level security;
alter table results enable row level security;

-- profiles: anyone can read display names (public leaderboard);
-- users manage only their own row.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (true);

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- teams: public read; only admins write.
drop policy if exists teams_select on teams;
create policy teams_select on teams for select using (true);

drop policy if exists teams_write on teams;
create policy teams_write on teams for all to authenticated
  using (is_admin()) with check (is_admin());

-- predictions: public read (the leaderboard scores everyone); users write
-- only their own row.
drop policy if exists predictions_select on predictions;
create policy predictions_select on predictions for select using (true);

drop policy if exists predictions_write on predictions;
create policy predictions_write on predictions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- results: public read; only admins write.
drop policy if exists results_select on results;
create policy results_select on results for select using (true);

drop policy if exists results_write on results;
create policy results_write on results for all to authenticated
  using (is_admin()) with check (is_admin());
