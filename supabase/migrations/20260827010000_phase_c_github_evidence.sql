-- ============================================================
-- Phase C — GitHub Intelligence Ingestion schema
-- Adds GitHub evidence tables for LITMUS career intelligence.
-- These tables supplement (never replace) existing tables.
-- No existing tables are modified.
-- ============================================================

-- One GitHub-linked profile per LITMUS profile.
create table if not exists public.github_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  github_user_id bigint not null,
  username text not null,
  profile_bio text,
  avatar_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists github_profiles_profile_id_idx
  on public.github_profiles (profile_id);

create unique index if not exists github_profiles_github_user_id_idx
  on public.github_profiles (github_user_id);

-- One row per discovered repository, normalized.
create table if not exists public.github_repositories (
  id uuid primary key default gen_random_uuid(),
  github_profile_id uuid not null references public.github_profiles(id) on delete cascade,
  github_repo_id bigint not null,
  name text not null,
  description text,
  languages jsonb default '{}'::jsonb,
  topics text[] default '{}',
  stars integer not null default 0,
  forks integer not null default 0,
  is_fork boolean not null default false,
  is_private boolean not null default false,
  repo_created_at timestamptz,
  repo_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists github_repositories_profile_repo_idx
  on public.github_repositories (github_profile_id, github_repo_id);

create index if not exists github_repositories_profile_idx
  on public.github_repositories (github_profile_id);

-- Time-bucketed activity aggregates per profile.
create table if not exists public.github_activity (
  id uuid primary key default gen_random_uuid(),
  github_profile_id uuid not null references public.github_profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  commits_count integer not null default 0,
  prs_count integer not null default 0,
  issues_count integer not null default 0,
  active_days integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists github_activity_profile_period_idx
  on public.github_activity (github_profile_id, period_start);

-- NOTE: GitHub OAuth provider tokens are NEVER stored in the database.
-- They are passed ephemerally from the authenticated frontend to the
-- backend for a single sync operation and then discarded.

-- Enable Row Level Security on GitHub evidence tables.
alter table public.github_profiles enable row level security;
alter table public.github_repositories enable row level security;
alter table public.github_activity enable row level security;

-- Owner SELECT policies: authenticated users can read only their own evidence.
-- Ownership chain: auth.uid() -> profiles.auth_user_id -> github_profiles.profile_id
-- Repositories and activity are scoped transitively via github_profiles.

create policy "github_profiles_owner_select"
  on public.github_profiles for select
  to authenticated
  using (
    profile_id in (
      select id
      from public.profiles
      where auth_user_id = auth.uid()
    )
  );

create policy "github_repositories_owner_select"
  on public.github_repositories for select
  to authenticated
  using (
    exists (
      select 1
      from public.github_profiles gp
      join public.profiles p
        on p.id = gp.profile_id
      where gp.id = github_repositories.github_profile_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "github_activity_owner_select"
  on public.github_activity for select
  to authenticated
  using (
    exists (
      select 1
      from public.github_profiles gp
      join public.profiles p
        on p.id = gp.profile_id
      where gp.id = github_activity.github_profile_id
        and p.auth_user_id = auth.uid()
    )
  );
