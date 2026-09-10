-- ============================================================
-- Phase D3 — Non-GitHub Leads
-- Lets leads exist without a GitHub profile or detected event
-- (resume projects, roadmap milestones, manual entries).
-- Additive only — does not modify Phase C, D1, or D2 tables
-- beyond relaxing nullability and adding a source label.
-- No credential storage.
-- ============================================================

-- Non-GitHub leads have no github_profiles row.
alter table public.leads
  alter column github_profile_id drop not null;

-- Origin label for cards: 'github' | 'resume' | 'milestone' | 'manual'.
alter table public.leads
  add column if not exists source text not null default 'github';

create index if not exists leads_source_idx
  on public.leads (profile_id, source);

-- Backfill: existing rows predate the column default in some clients.
update public.leads set source = 'github' where source is null or source = '';
