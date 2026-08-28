-- ============================================================
-- Phase D1 — GitHub Change Detection
-- Adds deduplicated detected events and sync checkpoints.
-- Additive only — does not modify existing Phase C tables.
-- No credential storage.
-- ============================================================

-- Detected GitHub events (append-only, deduplicated)
create table if not exists public.github_detected_events (
  id uuid primary key default gen_random_uuid(),
  github_profile_id uuid not null references public.github_profiles(id) on delete cascade,
  github_repo_id bigint,
  event_type text not null check (event_type in ('commit', 'pr', 'issue', 'repo_pushed')),
  event_id text not null,
  event_timestamp timestamptz not null,
  observed_at timestamptz not null default now(),
  dedup_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists github_detected_events_dedup_idx
  on public.github_detected_events (github_profile_id, dedup_key);

create unique index if not exists github_detected_events_event_idx
  on public.github_detected_events (github_profile_id, event_type, event_id);

create index if not exists github_detected_events_profile_timestamp_idx
  on public.github_detected_events (github_profile_id, event_timestamp desc);

create index if not exists github_detected_events_profile_type_idx
  on public.github_detected_events (github_profile_id, event_type);

-- Sync checkpoints (per-profile watermark)
create table if not exists public.sync_checkpoints (
  id uuid primary key default gen_random_uuid(),
  github_profile_id uuid not null references public.github_profiles(id) on delete cascade,
  checkpoint_type text not null check (checkpoint_type in ('github_sync')),
  last_event_id text,
  last_event_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists sync_checkpoints_profile_type_idx
  on public.sync_checkpoints (github_profile_id, checkpoint_type);

create index if not exists sync_checkpoints_profile_idx
  on public.sync_checkpoints (github_profile_id);

-- Enable Row Level Security
alter table public.github_detected_events enable row level security;
alter table public.sync_checkpoints enable row level security;

-- Owner SELECT policies: authenticated users can read only their own records.
-- Ownership chain: auth.uid() -> profiles.auth_user_id -> profiles.id -> github_profiles.profile_id -> new tables.github_profile_id
-- No authenticated INSERT/UPDATE/DELETE; writes via service_role only (bypass RLS).

create policy "github_detected_events_owner_select"
  on public.github_detected_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.github_profiles gp
      join public.profiles p
        on p.id = gp.profile_id
      where gp.id = github_detected_events.github_profile_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "sync_checkpoints_owner_select"
  on public.sync_checkpoints for select
  to authenticated
  using (
    exists (
      select 1
      from public.github_profiles gp
      join public.profiles p
        on p.id = gp.profile_id
      where gp.id = sync_checkpoints.github_profile_id
        and p.auth_user_id = auth.uid()
    )
  );