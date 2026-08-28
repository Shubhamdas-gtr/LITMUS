-- ============================================================
-- Phase D2-D7 - Leads, Drafts, and Dedup Receipts
-- Additive only. Does not modify Phase C or D1 tables.
-- No credential storage.
-- ============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  github_profile_id uuid not null references public.github_profiles(id) on delete cascade,
  detected_event_id uuid null references public.github_detected_events(id) on delete set null,
  title text not null,
  angle text not null,
  relevant_skills text[] not null default '{}'::text[],
  confidence numeric,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'dismissed', 'converted', 'deleted')),
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  dedup_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leads_profile_dedup_idx
  on public.leads (profile_id, dedup_key);

create index if not exists leads_profile_generated_at_idx
  on public.leads (profile_id, generated_at desc);

create index if not exists leads_github_profile_idx
  on public.leads (github_profile_id);

create index if not exists leads_detected_event_idx
  on public.leads (detected_event_id);

create index if not exists leads_status_idx
  on public.leads (profile_id, status);

create table if not exists public.lead_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel = 'linkedin_post'),
  subject text,
  body text not null,
  citations jsonb not null default '[]'::jsonb,
  prompt_version text not null,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'edited', 'approved', 'rejected', 'deleted'))
);

create unique index if not exists lead_drafts_lead_id_idx
  on public.lead_drafts (lead_id);

create index if not exists lead_drafts_status_idx
  on public.lead_drafts (status);

create table if not exists public.lead_generation_receipts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  github_profile_id uuid not null references public.github_profiles(id) on delete cascade,
  detected_event_id uuid not null references public.github_detected_events(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  dedup_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists lead_generation_receipts_profile_event_idx
  on public.lead_generation_receipts (profile_id, detected_event_id);

create unique index if not exists lead_generation_receipts_profile_dedup_idx
  on public.lead_generation_receipts (profile_id, dedup_key);

create index if not exists lead_generation_receipts_profile_idx
  on public.lead_generation_receipts (profile_id);

alter table public.leads enable row level security;
alter table public.lead_drafts enable row level security;
alter table public.lead_generation_receipts enable row level security;

create policy "leads_owner_select"
  on public.leads for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = leads.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "lead_drafts_owner_select"
  on public.lead_drafts for select
  to authenticated
  using (
    exists (
      select 1
      from public.leads l
      join public.profiles p on p.id = l.profile_id
      where l.id = lead_drafts.lead_id
        and p.auth_user_id = auth.uid()
    )
  );

create policy "lead_generation_receipts_owner_select"
  on public.lead_generation_receipts for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = lead_generation_receipts.profile_id
        and p.auth_user_id = auth.uid()
    )
  );
