# Analyzer spike: working notes

Spec: `docs/analyzer/tech-spike.md`. Work through it in order; results go into `FEASIBILITY.md`.

## Status (2026-11-05)
- Nothing built yet. Spike was blocked on missing API keys.
- Spotify app created by the owner: Web API only, redirect URI `http://127.0.0.1:3000/callback` (unused; we use client credentials). No users on the allowlist, on purpose: Step 1 must test whether public, non-allowlisted traffic works.
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` added to the environment. Still missing: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `ANTHROPIC_API_KEY`.
- Still needed from the owner: 20–30 Spotify test track links (see spec "Test set"), and real-device testing for Step 7 (iPhone Safari, Android Chrome).
- Network: Deezer, Spotify, OpenAI and Anthropic are all reachable from the cloud container.

## Step 1 desk research (Spotify developer docs, read 2026-11-05; not yet verified with live calls)
Sources: developer.spotify.com quota-modes page, the 2025-04-15 extended-access blog post, the February 2026 migration guide, and the Feb/Mar/May/Jul 2026 changelogs.
- Development Mode: 5 *authenticated* users max, allowlisted. The docs don't mention client credentials. Whether public users work with no allowlist is an inference, so **verify it live**.
- The app owner must have Spotify Premium, or the dev-mode app stops working.
- Quota is counted per developer account (Jul 2026). A 429 returns `reason: "QUOTA_EXCEEDED"`. No numeric limit is published.
- Extended Quota Mode: organisations only (since 2025-05-15), ≥250k MAU, launched service, review takes up to 6 weeks. Not reachable for launch.
- Feb 2026 dev-mode restrictions:
  - `/v1/search` `limit` max 10 (default 5).
  - Track `popularity` removed. Artist `popularity` and `followers` removed. Batch `GET /artists` and `/artists/{id}/top-tracks` removed.
  - `external_ids` (ISRC) was removed in Feb, then **reinstated** in the Mar 2026 changelog.
  - Artist `genres` is not listed as removed. `preview_url` and audio-features are not mentioned, so their status is unclear.
- Expect empty popularity/followers. ISRC is the critical field and should be present.
