-- ============================================================
-- Phase B — Base profile / assessment / analysis schema
-- Creates core LITMUS tables referenced by Phase C/D1/D2.
-- This migration was missing: Phase C references public.profiles(id)
-- but no tracked migration created it. Fresh `supabase db reset`
-- failed on FK without this file.
-- All statements idempotent (IF NOT EXISTS) for safe re-apply.
-- No credential storage.
-- ============================================================

-- Profiles: one row per Supabase auth user.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  career_goal text,
  target_role text,
  resume_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Interests collected by assessment wizard.
create table if not exists public.profile_interests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profile_interests_profile_interest_idx
  on public.profile_interests (profile_id, interest);

-- Skills + self-reported confidence from wizard.
create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  confidence text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists profile_skills_profile_skill_idx
  on public.profile_skills (profile_id, skill);

-- Assessment answers (question_id -> option index).
create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  selected_answer integer not null,
  created_at timestamptz not null default now()
);

create unique index if not exists assessment_answers_profile_question_idx
  on public.assessment_answers (profile_id, question_id);

-- Resume analysis (one current row per profile; upsert on profile_id).
create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  summary text not null default '',
  skills jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists resume_analyses_profile_id_idx
  on public.resume_analyses (profile_id);

-- Skill-gap analysis (one current row per profile).
create table if not exists public.skill_gap_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_role text,
  required_skills jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  weak_skills jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists skill_gap_analyses_profile_id_idx
  on public.skill_gap_analyses (profile_id);

-- Career roadmap (one current row per profile).
create table if not exists public.career_roadmaps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_role text,
  roadmap jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists career_roadmaps_profile_id_idx
  on public.career_roadmaps (profile_id);

-- Roadmap progress (per-skill completion toggle).
create table if not exists public.roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists roadmap_progress_profile_skill_idx
  on public.roadmap_progress (profile_id, skill);

-- Resumes metadata (storage bucket holds bytes; this table mirrors types).
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text,
  created_at timestamptz not null default now()
);

-- Resumes storage bucket (private). Bytes live in storage, not in tables.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Enable RLS on base tables.
alter table public.profiles enable row level security;
alter table public.profile_interests enable row level security;
alter table public.profile_skills enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.skill_gap_analyses enable row level security;
alter table public.career_roadmaps enable row level security;
alter table public.roadmap_progress enable row level security;
alter table public.resumes enable row level security;

-- Owner SELECT policies (idempotent via DROP IF EXISTS + CREATE).
-- Writes go via service_role (bypass RLS); anon/authenticated writes blocked.

drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select"
  on public.profiles for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "profile_interests_owner_select" on public.profile_interests;
create policy "profile_interests_owner_select"
  on public.profile_interests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_interests.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "profile_skills_owner_select" on public.profile_skills;
create policy "profile_skills_owner_select"
  on public.profile_skills for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_skills.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "assessment_answers_owner_select" on public.assessment_answers;
create policy "assessment_answers_owner_select"
  on public.assessment_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = assessment_answers.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "resume_analyses_owner_select" on public.resume_analyses;
create policy "resume_analyses_owner_select"
  on public.resume_analyses for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = resume_analyses.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "skill_gap_analyses_owner_select" on public.skill_gap_analyses;
create policy "skill_gap_analyses_owner_select"
  on public.skill_gap_analyses for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = skill_gap_analyses.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "career_roadmaps_owner_select" on public.career_roadmaps;
create policy "career_roadmaps_owner_select"
  on public.career_roadmaps for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = career_roadmaps.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "roadmap_progress_owner_select" on public.roadmap_progress;
create policy "roadmap_progress_owner_select"
  on public.roadmap_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = roadmap_progress.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "resumes_owner_select" on public.resumes;
create policy "resumes_owner_select"
  on public.resumes for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = resumes.profile_id
        and p.auth_user_id = auth.uid()
    )
  );
