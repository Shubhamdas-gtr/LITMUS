-- ============================================================
-- Phase E — Repository URL persistence
-- github_repositories previously stored only `name`, losing
-- `full_name` / `html_url` / `latest_commit` built in-memory by
-- github_service. Re-generation via POST /leads/generate loads
-- from DB, so leads had null repo URLs when event payload lacked url.
-- Additive only, idempotent.
-- ============================================================

alter table public.github_repositories
  add column if not exists full_name text;

alter table public.github_repositories
  add column if not exists html_url text;

alter table public.github_repositories
  add column if not exists latest_commit jsonb default '{}'::jsonb;
