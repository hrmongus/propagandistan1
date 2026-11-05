-- Lead-magnet analyzer (technical spike, docs/analyzer). Server-only like the purchase tables: RLS on, no
-- policies, and anon/authenticated revoked, so emails are never publicly readable. Writes go through route
-- handlers with the secret key.

-- One row per "analyze this track" run: Deezer lookup, audio analysis and lyrics run in the background while
-- the user does the quiz; the client polls GET /api/analyze/{id}.
create table public.analyzer_jobs (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'running' check (status in ('running', 'done')),
  track jsonb not null,            -- Spotify id, ISRC, title, artists, artwork
  steps jsonb not null default '{}'::jsonb, -- { deezer|audio|lyrics: { status, ms, error } }
  deezer jsonb,                    -- { deezerId, via, duration } (never the signed preview URL: it expires)
  analysis jsonb,                  -- bpm, key, mode, energy, hook window, mood
  transcript jsonb                 -- instrumental flag, lyric line, segments
);

-- A finished strategy, reachable forever at /s/{id} (used in emails).
create table public.strategies (
  id text primary key,             -- short random slug
  created_at timestamptz not null default now(),
  job_id text references public.analyzer_jobs (id) on delete set null,
  name text,
  email text,
  answers jsonb not null,          -- quiz answers
  track jsonb not null,            -- Spotify id, ISRC, Deezer id, title, artist, artwork
  analysis jsonb,                  -- audio analysis + lyric line + instrumental flag
  hooks jsonb,                     -- [{ aesthetic, pack, hooks: [..] }]
  aesthetic_scores jsonb           -- all 20, sorted
);

create index strategies_email_idx on public.strategies (email) where email is not null;

alter table public.analyzer_jobs enable row level security;
alter table public.strategies enable row level security;
revoke all on public.analyzer_jobs from anon, authenticated;
revoke all on public.strategies from anon, authenticated;
