# Analyzer spike: working notes

Spec: `docs/analyzer/tech-spike.md`. Work through it in order; results go into `FEASIBILITY.md`.

## Status (2026-11-05)
- Nothing built yet. Spike was blocked on missing API keys.
- Spotify app created by the owner: Web API only, redirect URI `http://127.0.0.1:3000/callback` (unused; we use client credentials). No users on the allowlist, on purpose: Step 1 must test whether public, non-allowlisted traffic works.
- Env present: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `OPENAI_API_KEY`. Still missing in the container: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (owner says added; may need a new session).
- Decision: Claude has no audio input, so transcription (Step 4) uses OpenAI. Hooks (Step 5) can use Claude Haiku 5.5 once `ANTHROPIC_API_KEY` is present, otherwise OpenAI.
- **Step 1 done** (live results below). Next: Step 2 needs the owner's test-set links.
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

## Step 1 live results (2026-11-05, Development Mode app, client credentials, no allowlisted users)
- Token: `POST accounts.spotify.com/api/token` with `grant_type=client_credentials` → 200, `expires_in: 3600`. **Works with zero allowlisted users**, so a dev-mode app can serve public traffic server-side.
- `/v1/search?type=track`: 20 queries, p50 0.37s, p95 0.51s, max 0.61s (from the cloud container). `limit=50` → 400; max is 10.
- Track object keys: `album, artists, disc_number, duration_ms, explicit, external_ids, external_urls, href, id, is_local, is_playable, name, track_number, type, uri`.
  - **ISRC present on 200/200** tracks across 20 genre queries.
  - `popularity` and `preview_url`: **absent** (the keys are missing, not null).
  - Artwork (`album.images`) and `album.release_date` are present.
- `/v1/artists/{id}` keys: `external_urls, href, id, images, name, type, uri`. **`genres`, `popularity` and `followers` are all absent.** The docs said genres stayed; live they're gone. Aesthetic matching therefore can't use Spotify genres.
- Blocked: `audio-features` 403, `audio-analysis` 403, `artists/{id}/top-tracks` 403, `recommendations` 404. So Spotify gives us no BPM/key/energy; we do our own analysis (Step 3).
- 30 back-to-back searches: all 200, no 429. The quota is per developer account and unpublished. Production should cache search results briefly and back off on 429 `QUOTA_EXCEEDED`.
