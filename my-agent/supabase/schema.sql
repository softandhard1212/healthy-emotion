-- Run this against your Supabase project (SQL Editor, or `supabase db push`)
-- before using the emotion-journal tools in tools/journal.py.

create table if not exists emotion_journal_entries (
  id uuid primary key default gen_random_uuid(),
  -- Matches `runtime.identity["user"]["id"]`: the caller's verified email
  -- by default under `auth.supabase()` in identity.py.
  user_id text not null,
  emotion text not null,
  intensity smallint not null check (intensity between 0 and 10),
  trigger text not null,
  technique_used text not null,
  reflection text not null,
  -- Both nullable: not every entry has a clean thought/reframe pair
  -- (grounding/TIPP-only exchanges regulate rather than reframe a belief).
  automatic_thought text,
  reframe text,
  created_at timestamptz not null default now()
);

create index if not exists emotion_journal_entries_user_id_created_at_idx
  on emotion_journal_entries (user_id, created_at);

-- Defense in depth: the agent's tools talk to Postgres with the Supabase
-- service role key, which bypasses RLS entirely, and they already filter
-- every query by the server-verified user_id. This policy only matters if
-- the anon/publishable key is ever used against this table directly.
alter table emotion_journal_entries enable row level security;

create policy "users read their own entries"
  on emotion_journal_entries for select
  using (auth.jwt() ->> 'email' = user_id);

create policy "users insert their own entries"
  on emotion_journal_entries for insert
  with check (auth.jwt() ->> 'email' = user_id);
