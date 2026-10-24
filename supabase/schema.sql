-- DETECTIVE AI — Supabase / Postgres schema (migration path for hosted persistence).
--
-- STATUS: provided as the target data model. The running game currently uses the
-- file-based store in server/store.ts; a Supabase adapter implementing the same
-- load/persist interface has NOT been written or tested yet.
--
-- Security model:
--   * Canonical case content (solutions, suspect secrets, deduction rules) lives in
--     the `private` schema, which is NOT exposed through the Supabase API. Only the
--     game server (service role) reads it.
--   * Player data lives in `public` with row-level security: a player can only
--     read and write their own rows. The browser never receives solution data.

create schema if not exists private;

-- ───────────── Players ─────────────
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text not null default 'Detective' check (char_length(display_name) <= 40),
  detective_rank   text not null default 'Rookie Detective',
  experience_points integer not null default 0 check (experience_points >= 0),
  stats            jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create table public.achievements (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  achievement  text not null,
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, achievement)
);

-- ───────────── Case content (server-only) ─────────────
create table private.cases (
  id                 text primary key,
  title              text not null,
  description        text not null,
  difficulty         text not null check (difficulty in ('Beginner','Intermediate','Expert')),
  definition         jsonb not null,          -- full CaseDef incl. locations, evidence, dialogue
  canonical_solution jsonb not null,          -- culprit, motive, method, sequence, timeline
  generated          boolean not null default false,
  owner_id           uuid references public.profiles (id) on delete cascade, -- generated cases belong to a player
  case_status        text not null default 'published',
  created_at         timestamptz not null default now()
);

create table private.suspects (
  id               text not null,
  case_id          text not null references private.cases (id) on delete cascade,
  name             text not null,
  biography        text not null,
  personality      text not null,
  public_knowledge jsonb not null,
  secret_knowledge jsonb not null,
  alibi            text not null,
  actual_movements jsonb not null,
  primary key (case_id, id)
);

create table private.locations (
  id                text not null,
  case_id           text not null references private.cases (id) on delete cascade,
  name              text not null,
  description       text not null,
  unlock_conditions jsonb,
  primary key (case_id, id)
);

create table private.evidence (
  id                   text not null,
  case_id              text not null references private.cases (id) on delete cascade,
  location_id          text,
  title                text not null,
  description          text not null,
  evidence_type        text not null,
  discovery_conditions jsonb,
  deduction_links      jsonb,
  primary key (case_id, id)
);

-- Public catalogue: safe, spoiler-free fields only.
create view public.case_catalogue with (security_invoker = true) as
  select id, title, description, difficulty, generated, owner_id
  from private.cases where case_status = 'published';

-- ───────────── Player progress ─────────────
create table public.player_case_progress (
  user_id              uuid not null references public.profiles (id) on delete cascade,
  case_id              text not null,
  discovered_evidence  jsonb not null default '{}'::jsonb,
  unlocked_locations   text[] not null default '{}',
  completed_deductions jsonb not null default '{}'::jsonb,
  current_state        jsonb not null default '{}'::jsonb,  -- board, flags, accusations, status
  updated_at           timestamptz not null default now(),
  primary key (user_id, case_id)
);

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  case_id    text not null,
  suspect_id text not null,
  messages   jsonb not null default '[]'::jsonb,
  unique (user_id, case_id, suspect_id)
);

create table public.notebook_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  case_id    text not null,
  content    text not null check (char_length(content) <= 2000),
  tag        text not null default 'note' check (tag in ('note','fact','claim','theory')),
  relevant   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────── Row-level security ─────────────
alter table public.profiles             enable row level security;
alter table public.achievements         enable row level security;
alter table public.player_case_progress enable row level security;
alter table public.conversations        enable row level security;
alter table public.notebook_entries     enable row level security;

create policy "own profile"      on public.profiles             for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own achievements" on public.achievements         for select using (auth.uid() = user_id);
create policy "own progress"     on public.player_case_progress for select using (auth.uid() = user_id);
create policy "own conversations" on public.conversations       for select using (auth.uid() = user_id);
create policy "own notes"        on public.notebook_entries     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Progress, conversations and achievements are written only by the game server
-- (service role bypasses RLS), so players cannot forge discoveries or XP.
revoke all on schema private from anon, authenticated;
