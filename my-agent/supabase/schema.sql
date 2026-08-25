-- Run this against your Supabase project (SQL Editor, or `supabase db push`)
-- before using the emotion-journal tools in tools/journal.py.
--
-- Safe to re-run: every statement is idempotent, so an existing project
-- created before the thinking-pattern columns existed is migrated forward
-- by running this file again.

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

-- The thinking pattern(s) the automatic thought fits, as slugs from the
-- fixed taxonomy in tools/patterns.py. An array because one thought can be
-- two patterns at once ("they think I'm useless" is mind reading *and*
-- labeling); empty when nothing fit, which is a real and common outcome.
alter table emotion_journal_entries
  add column if not exists thinking_patterns text[] not null default '{}';

-- The affirmation written for this specific thought, and whether the user
-- kept it. Kept ones surface as a collection in the app, so they can be
-- re-read outside the conversation that produced them.
alter table emotion_journal_entries
  add column if not exists affirmation text;
alter table emotion_journal_entries
  add column if not exists affirmation_saved boolean not null default false;

create index if not exists emotion_journal_entries_user_id_created_at_idx
  on emotion_journal_entries (user_id, created_at);

-- Pattern recurrence ("that's the third time this month") is the journal's
-- main read, and it filters rows by the array — GIN keeps that cheap.
create index if not exists emotion_journal_entries_thinking_patterns_idx
  on emotion_journal_entries using gin (thinking_patterns);

-- The agent's tools talk to Postgres with the Supabase service role key,
-- which bypasses RLS entirely, and they already filter every query by the
-- server-verified user_id. These policies are what the *web app* runs
-- under: it reads entries and toggles affirmation_saved with the
-- anon/publishable key, so it needs select and a narrow update.
alter table emotion_journal_entries enable row level security;

drop policy if exists "users read their own entries" on emotion_journal_entries;
create policy "users read their own entries"
  on emotion_journal_entries for select
  using (auth.jwt() ->> 'email' = user_id);

drop policy if exists "users insert their own entries" on emotion_journal_entries;
create policy "users insert their own entries"
  on emotion_journal_entries for insert
  with check (auth.jwt() ->> 'email' = user_id);

-- Update exists only so someone can keep or unkeep their own affirmation.
-- The trigger below is what actually holds that line: the policy alone
-- would let a client rewrite any column on its own row.
drop policy if exists "users update their own entries" on emotion_journal_entries;
create policy "users update their own entries"
  on emotion_journal_entries for update
  using (auth.jwt() ->> 'email' = user_id)
  with check (auth.jwt() ->> 'email' = user_id);

create or replace function emotion_journal_entries_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The service role writes entries and must stay unrestricted; everyone
  -- else may move affirmation_saved and nothing else.
  if auth.role() = 'service_role' then
    return new;
  end if;
  if (to_jsonb(new) - 'affirmation_saved') is distinct from
     (to_jsonb(old) - 'affirmation_saved') then
    raise exception 'only affirmation_saved may be updated from a client';
  end if;
  return new;
end;
$$;

drop trigger if exists emotion_journal_entries_guard_update
  on emotion_journal_entries;
create trigger emotion_journal_entries_guard_update
  before update on emotion_journal_entries
  for each row execute function emotion_journal_entries_guard_update();
