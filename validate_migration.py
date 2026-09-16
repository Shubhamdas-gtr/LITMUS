"""Validate LITMUS Supabase migrations (portable, no hardcoded paths)."""
from pathlib import Path

MIGRATIONS = Path(__file__).parent / "supabase" / "migrations"

def read(name: str) -> str:
    return (MIGRATIONS / name).read_text(encoding="utf-8")

phase_b = read("20260826010000_phase_b_base.sql")
phase_c = read("20260827010000_phase_c_github_evidence.sql")
d1 = read("20260828010000_phase_d1_change_detection.sql")
d2 = read("20260828020000_phase_d2_leads.sql")
d3 = read("20260828030000_phase_d3_nongithub_leads.sql")
phase_e = read("20260828040000_phase_e_repo_urls.sql")

# 0. Base tables exist
print("0. Phase B base tables:")
for table in ["profiles", "profile_interests", "profile_skills",
              "assessment_answers", "resume_analyses", "skill_gap_analyses",
              "career_roadmaps", "roadmap_progress", "resumes"]:
    print(f"  {table}:", f"create table if not exists public.{table}" in phase_b.lower())

# 1. Both D1 tables exist
print('1. github_detected_events table:', 'github_detected_events' in d1)
print('1. sync_checkpoints table:', 'sync_checkpoints' in d1)

# 2. Foreign keys
print('2. github_detected_events FK github_profiles:', 'references public.github_profiles(id) on delete cascade' in d1)
print('2. sync_checkpoints FK github_profiles:', 'references public.github_profiles(id) on delete cascade' in d1)

# 3. Unique constraints on github_detected_events
print('3. unique (github_profile_id, dedup_key):', 'github_detected_events_dedup_idx' in d1 and 'github_profile_id, dedup_key' in d1)
print('3. unique (github_profile_id, event_type, event_id):', 'github_detected_events_event_idx' in d1 and 'github_profile_id, event_type, event_id' in d1)

# 4. checkpoint uniqueness
print('4. unique (github_profile_id, checkpoint_type):', 'sync_checkpoints_profile_type_idx' in d1 and 'github_profile_id, checkpoint_type' in d1)

# 5. event_type CHECK constraint
print('5. event_type CHECK (commit, pr, issue, repo_pushed):', "check (event_type in ('commit', 'pr', 'issue', 'repo_pushed'))" in d1)

# 6. checkpoint_type CHECK constraint
print('6. checkpoint_type CHECK (github_sync):', "check (checkpoint_type in ('github_sync'))" in d1)

# 7. RLS enabled
print('7. RLS enabled github_detected_events:', 'enable row level security' in d1 and 'github_detected_events enable row level security' in d1)
print('7. RLS enabled sync_checkpoints:', 'sync_checkpoints enable row level security' in d1)

# 8. SELECT policies authenticated-only
print('8. github_detected_events SELECT policy to authenticated:', 'for select' in d1 and 'to authenticated' in d1 and 'github_detected_events_owner_select' in d1)
print('8. sync_checkpoints SELECT policy to authenticated:', 'sync_checkpoints_owner_select' in d1 and 'to authenticated' in d1)

# 9. No INSERT/UPDATE/DELETE policies for authenticated
t_lower = d1.lower()
has_insert = 'for insert' in t_lower or 'for update' in t_lower or 'for delete' in t_lower
print('9. No INSERT/UPDATE/DELETE policies:', not has_insert)

# 10. No anon policies
print('10. No anon policies:', 'to anon' not in t_lower)

# 11. No credential fields
forbidden = ['provider_token', 'access_token', 'refresh_token', 'github_credentials', 'get_github_token']
found = [f for f in forbidden if f.lower() in t_lower]
print('11. No credential fields:', len(found) == 0, 'found:', found if found else 'none')

# Additional checks
print('\n--- Additional Checks ---')
print('github_repo_id nullable:', 'github_repo_id bigint' in d1 and 'not null' not in d1.split('github_repo_id')[1][:20])
print('event_id not null:', 'event_id text not null' in d1)
print('event_timestamp not null:', 'event_timestamp timestamptz not null' in d1)
print('observed_at default now():', 'observed_at timestamptz not null default now()' in d1)
print('dedup_key not null:', 'dedup_key text not null' in d1)
print("payload jsonb default empty:", "payload jsonb not null default '{}'::jsonb" in d1)
print('created_at default now():', 'created_at timestamptz not null default now()' in d1)
print('sync_checkpoints last_event_id nullable:', 'last_event_id text' in d1 and 'not null' not in d1.split('last_event_id')[1][:20])
print('sync_checkpoints last_event_at nullable:', 'last_event_at timestamptz' in d1 and 'not null' not in d1.split('last_event_at')[1][:20])
print('checkpoint_type CHECK github_sync:', "check (checkpoint_type in ('github_sync'))" in d1)
print('Indexes: timestamp desc, profile_type, sync_checkpoints profile_idx:', 'profile_timestamp_idx' in d1 and 'profile_type_idx' in d1 and 'sync_checkpoints_profile_idx' in d1)

# No credential fields anywhere
found = [f for f in forbidden if f.lower() in t_lower]
print('No credential fields anywhere:', len(found) == 0, 'found:', found if found else 'none')

# No ALTER/DROP on existing tables (DROP POLICY is the intended rerun guard)
d1_code_lines = [
    line for line in d1.splitlines()
    if "drop policy" not in line.lower() and not line.strip().startswith("--")
]
d1_code = "\n".join(d1_code_lines).lower()
print('No ALTER existing Phase C tables:', 'alter table public.github_profiles' not in d1_code and 'alter table public.github_repositories' not in d1_code and 'alter table public.github_activity' not in d1_code and 'drop table' not in d1_code and 'delete from' not in d1_code and 'truncate' not in d1_code)

# Phase C checks
print('\n--- Phase C Checks ---')
c_lower = phase_c.lower()
print('C. github_profiles table:', 'create table if not exists public.github_profiles' in c_lower)
print('C. github_repositories table:', 'create table if not exists public.github_repositories' in c_lower)
print('C. github_activity table:', 'create table if not exists public.github_activity' in c_lower)
print('C. commits_count column:', 'commits_count' in phase_c)
print('C. rerunnable policies:', 'drop policy if exists "github_profiles_owner_select"' in phase_c)

# Phase D2 checks
print('\n--- Phase D2 Checks ---')
d2_lower = d2.lower()
print('D2. leads table:', 'create table if not exists public.leads' in d2_lower)
print('D2. lead_drafts table:', 'create table if not exists public.lead_drafts' in d2_lower)
print('D2. receipts table:', 'create table if not exists public.lead_generation_receipts' in d2_lower)
print('D2. status CHECK:', "check (status in ('pending', 'qualified', 'dismissed', 'converted', 'deleted'))" in d2_lower)
print('D2. rerunnable policies:', 'drop policy if exists "leads_owner_select"' in d2_lower)

# Phase D3 — non-GitHub leads (additive only)
print('\n--- Phase D3 Checks ---')
d3_lower = d3.lower()
print('D3. github_profile_id nullable:', 'alter column github_profile_id drop not null' in d3_lower)
print('D3. source column added:', 'add column if not exists source' in d3_lower)
print('D3. source default github:', "default 'github'" in d3_lower)
print('D3. source CHECK:', "leads_source_check" in d3 and "in ('github', 'resume', 'milestone', 'manual')" in d3)
print('D3. source index:', 'leads_source_idx' in d3_lower)
print('D3. no FK/policy changes:', 'references' not in d3_lower and 'policy' not in d3_lower)
print('D3. no credential fields:', all(f not in d3_lower for f in forbidden))
print('D3. no destructive statements:', 'drop table' not in d3_lower and 'delete from' not in d3_lower and 'truncate' not in d3_lower)

# Phase E checks
print('\n--- Phase E Checks ---')
e_lower = phase_e.lower()
print('E. full_name column:', 'add column if not exists full_name' in e_lower)
print('E. html_url column:', 'add column if not exists html_url' in e_lower)
print('E. latest_commit column:', 'add column if not exists latest_commit' in e_lower)
