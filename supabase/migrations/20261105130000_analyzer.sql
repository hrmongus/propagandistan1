-- Lead-magnet analyzer v1 (docs/analyzer/TECH-SETUP.md). Server-only like the purchase tables: RLS on, no
-- policies, anon/authenticated revoked. Reads and writes go through route handlers with the secret key, so the
-- public (publishable) key can't read emails.

-- Replaces the audio spike's tables (both were empty when dropped).
drop table if exists public.strategies;
drop table if exists public.analyzer_jobs;

-- One saved strategy per lead, reachable forever at /s/{id} (the link in the emails).
create table public.strategies (
  id text primary key check (id ~ '^[0-9A-Za-z]{8}$'), -- short random slug
  created_at timestamptz not null default now(),
  first_name text,
  email text not null,
  track jsonb not null,      -- Spotify id, title, artists, artwork, release date
  answers jsonb not null,    -- quiz answers
  metrics jsonb not null,    -- getMetrics() output
  hooks jsonb not null,      -- [{ aesthetic, hooks: [3] }], plus whether the fallback was used
  lyric_line text
);

create index strategies_email_idx on public.strategies (email);

-- Funnel events (POST /api/event, GET /api/checkout). One row per event; drop-off query in TECH-SETUP.md.
create table public.events (
  id bigint generated always as identity primary key,
  session_id text not null,
  strategy_id text,          -- no FK: events can arrive before or without a strategy
  name text not null check (name in ('track_selected', 'step_viewed', 'email_submitted', 'results_viewed', 'offer_clicked', 'upsell_accepted', 'upsell_declined')),
  step text,
  created_at timestamptz not null default now()
);

create index events_name_created_idx on public.events (name, created_at);
create index events_session_idx on public.events (session_id);

alter table public.strategies enable row level security;
alter table public.events enable row level security;
revoke all on public.strategies from anon, authenticated;
revoke all on public.events from anon, authenticated;
