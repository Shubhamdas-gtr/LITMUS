import re

path = r'C:\Users\SHUBHAM\Desktop\LITMUS\LITMUS\supabase\migrations\20260828010000_phase_d1_change_detection.sql'
t = open(path, 'r', encoding='utf-8').read()

# 1. Both tables exist
print('1. github_detected_events table:', 'github_detected_events' in t)
print('1. sync_checkpoints table:', 'sync_checkpoints' in t)

# 2. Foreign keys
print('2. github_detected_events FK github_profiles:', 'references public.github_profiles(id) on delete cascade' in t)
print('2. sync_checkpoints FK github_profiles:', 'references public.github_profiles(id) on delete cascade' in t)

# 3. Unique constraints on github_detected_events
print('3. unique (github_profile_id, dedup_key):', 'github_detected_events_dedup_idx' in t and 'github_profile_id, dedup_key' in t)
print('3. unique (github_profile_id, event_type, event_id):', 'github_detected_events_event_idx' in t and 'github_profile_id, event_type, event_id' in t)

# 4. checkpoint uniqueness
print('4. unique (github_profile_id, checkpoint_type):', 'sync_checkpoints_profile_type_idx' in t and 'github_profile_id, checkpoint_type' in t)

# 5. event_type CHECK constraint
print('5. event_type CHECK (commit, pr, issue, repo_pushed):', "check (event_type in ('commit', 'pr', 'issue', 'repo_pushed'))" in t)

# 6. checkpoint_type CHECK constraint
print('6. checkpoint_type CHECK (github_sync):', "check (checkpoint_type in ('github_sync'))" in t)

# 7. RLS enabled
print('7. RLS enabled github_detected_events:', 'enable row level security' in t and 'github_detected_events enable row level security' in t)
print('7. RLS enabled sync_checkpoints:', 'sync_checkpoints enable row level security' in t)

# 8. SELECT policies authenticated-only
print('8. github_detected_events SELECT policy to authenticated:', 'for select' in t and 'to authenticated' in t and 'github_detected_events_owner_select' in t)
print('8. sync_checkpoints SELECT policy to authenticated:', 'sync_checkpoints_owner_select' in t and 'to authenticated' in t)

# 9. No INSERT/UPDATE/DELETE policies for authenticated
has_insert = 'for insert' in t.lower() or 'for update' in t.lower() or 'for delete' in t.lower()
print('9. No INSERT/UPDATE/DELETE policies:', not has_insert)

# 10. No anon policies
print('10. No anon policies:', 'to anon' not in t.lower())

# 11. No credential fields
forbidden = ['provider_token', 'access_token', 'refresh_token', 'github_credentials', 'get_github_token']
found = []
for f in forbidden:
    if f.lower() in t.lower():
        found.append(f)
print('11. No credential fields:', len(found) == 0, 'found:', found if found else 'none')

# Additional checks
print('\n--- Additional Checks ---')
print('github_repo_id nullable:', 'github_repo_id bigint' in t and 'not null' not in t.split('github_repo_id')[1][:20])
print('event_id not null:', 'event_id text not null' in t)
print('event_timestamp not null:', 'event_timestamp timestamptz not null' in t)
print('observed_at default now():', 'observed_at timestamptz not null default now()' in t)
print('dedup_key not null:', 'dedup_key text not null' in t)
print('payload jsonb default empty:', "payload jsonb not null default '{}'::jsonb" in t)
print('created_at default now():', 'created_at timestamptz not null default now()' in t)
print('sync_checkpoints last_event_id nullable:', 'last_event_id text' in t and 'not null' not in t.split('last_event_id')[1][:20])
print('sync_checkpoints last_event_at nullable:', 'last_event_at timestamptz' in t and 'not null' not in t.split('last_event_at')[1][:20])
print('checkpoint_type CHECK github_sync:', "check (checkpoint_type in ('github_sync'))" in t)
print('Indexes: timestamp desc, profile_type, sync_checkpoints profile_idx:', 'profile_timestamp_idx' in t and 'profile_type_idx' in t and 'sync_checkpoints_profile_idx' in t)

# No credential fields anywhere
forbidden = ['provider_token', 'access_token', 'refresh_token', 'github_credentials', 'get_github_token']
found = [f for f in forbidden if f.lower() in t.lower()]
print('No credential fields anywhere:', len(found) == 0, 'found:', found if found else 'none')

# No ALTER/DROP on existing tables
print('No ALTER existing Phase C tables:', 'ALTER TABLE public.github_profiles' not in t and 'ALTER TABLE public.github_repositories' not in t and 'ALTER TABLE public.github_activity' not in t and 'DROP' not in t)