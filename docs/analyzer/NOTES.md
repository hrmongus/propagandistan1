# Analyzer spike: working notes

Spec: `docs/analyzer/tech-spike.md`. Work through it in order; results go into `FEASIBILITY.md`.

## Status (2026-11-05)
- Nothing built yet. Spike was blocked on missing API keys.
- Spotify app created by the owner: Web API only, redirect URI `http://127.0.0.1:3000/callback` (unused; we use client credentials). No users on the allowlist, on purpose: Step 1 must test whether public, non-allowlisted traffic works.
- Env present: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `OPENAI_API_KEY`. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Still missing in the container: `ANTHROPIC_API_KEY` (owner says added; a new session should pick it up).
- Decision: Claude has no audio input, so transcription (Step 4) uses OpenAI. Hooks (Step 5) can use Claude Haiku 5.5 once `ANTHROPIC_API_KEY` is present, otherwise OpenAI.
- Owner: Deezer terms are fine for the prototype; no artist uploads; listener count comes from the quiz.
- Steps 1–7 tested; 8–10 built but blocked on the Supabase secret key (env has the publishable key).
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
- `/v1/artists/{id}` keys: `external_urls, href, id, images, name, type, uri`. `genres`, `popularity` and `followers` are absent.
- **Owner decision:** popularity, followers, genres and Spotify audio features/analysis are not needed, so drop them from the product. Step 6 aesthetic matching uses audio analysis + quiz only, with no genre keywords. The owner has Spotify Premium, so the dev-mode Premium requirement is covered.
- 30 back-to-back searches: all 200, no 429. The quota is per developer account and unpublished. Production should cache search results briefly and back off on 429 `QUOTA_EXCEEDED`.

## Test set (28 tracks, `spike/testset.json`)
- 3 owner picks + 25 picked from Spotify `tag:hipster` / `tag:new` album searches, with the artist's monthly listeners scraped from the public open.spotify.com artist page (`og:description`), kept at 300–5,000 (≤10k for new releases). Random seed 7. Picked using Spotify data only, so Deezer coverage isn't biased.
- Categories come from the search term, not from listening. One owner-pick ISRC is lowercase (`usl4r2082083`); Deezer accepts it either way.
- The monthly-listener scrape could feed the growth chart instead of asking in the quiz, but scraping is against Spotify's terms. Owner decision needed.

## Step 2 live results
- 24/28 matched by ISRC (86%); the search fallback matched 0 extra. Misses: Lofi Oasis, Soph Stardust ASMR, Holger Stensaft, ForeverSongs (released 2026-11-04). None of these artists are on Deezer at all, even searching the bare artist name.
- 1 match has no preview (`Pure Acoustic – Hey Jude`, a cover; likely licensing). Usable preview: 23/28 = 82%.
- `bpm` = 0 on every track.
- Preview: 30.0s, 128 kbps CBR, 44.1kHz stereo. CDN sends `Access-Control-Allow-Origin: *`, so the browser can play it directly (the API itself has no CORS, so lookups stay server-side).
- URL is signed with `exp` = issue time + 900s. Refetching `/track/isrc:` gives a new URL each time. So store the Deezer `id`, mint a URL per page view, and re-mint if playback starts after 15 min.
- Where the preview starts in the song: the API doesn't say, and without the full track we can't measure it. Hook timestamps are preview-relative, which is all Step 7 needs.

## Step 3 live results
- Essentia.js 0.1.3 (`RhythmExtractor2013` multifeature, `KeyExtractor` bgate profile) + `mpg123-decoder` (WASM). ~2.7s per track, 179MB RSS. Needs one decoder instance per file (reusing after `reset()` throws `MPG123_ERR`).
- Energy = RMS dBFS mapped −30→0, −8→100. Skews high on loud masters (a "Lullaby Version" scored 88). Needs recalibration or a mix with onset density.
- BPM accuracy can't be checked against Tunebat: these tracks aren't listed there. It needs hand tap-tempo or a separate set of known tracks.

## Step 4 live results (whisper-1 vs gpt-4o-mini-transcribe, 23 previews)
- whisper-1 wins clearly. gpt-4o-mini-transcribe hallucinated on music: Russian text for English trap, invented lyrics where whisper heard none, empty output on half the tracks. It also has no `verbose_json`, so no segments or `no_speech_prob`.
- Instrumental filter (final, `lib/analyzer/transcribe.ts`): <4 words, garbage phrase, mean logprob < −1, or (no_speech > 0.6 AND logprob < −0.7), or heavy repetition. The first version (no_speech > 0.6 alone) dropped 3 real vocal tracks (no_speech 0.61–0.63, logprob −0.36 to −0.62).
- Whisper garbage seen: "Make sure to check out my other videos too!", "That's the end of this video, thank you for watching", "♪ ♪ ♪", "【russian music】 Русские субтитры…", "with musical interlude", "Виктор Королёв" (a name on a piano instrumental).
- Outputs side by side are in `spike/whisper.json`. There are no reference lyrics: these artists aren't on lyric sites.

## Step 5/6 live results
- 69 hook sets on gpt-4.1-mini (`spike/hooks.json`), all valid JSON, p50 0.68s. The first prompt produced clichés ("when the beat drops") and named the aesthetic outright; the second prompt bans both.
- Aesthetic config in `lib/analyzer/aesthetics.json` (no genre keywords; Spotify gives none). Centre-distance scoring; tempo accepts half/double time.

## Step 7
- `/analyzer/video-test`. Headless Chromium: autoplay-policy=user-gesture-required, one tap → both play, audio seeks to the hook window, drift −0.07s, single-playback enforced. iOS Safari / Android Chrome not tested yet.

## Apple preview fallback (owner asked)
- iTunes Search API: `lookup?isrc=` returns 0 results (unsupported); search by artist+title works, but from this container it returns 403 after ~1 call per minute. Partial run: Apple stopped answering after 15 of 28 tracks (17 rate-limit backoffs, then 4 consecutive 403s).
  - Of those 15: Apple found 10 (67%), Deezer 14. Apple filled the one Deezer gap in this subset (`Pure Acoustic – Hey Jude`, which has no Deezer preview).
  - Apple missed 4 of 5 rap/trap tracks that Deezer has. These may be search-matching misses rather than catalogue gaps, since only US/DE storefronts and exact artist-name matching were tried.
  - Verdict: possibly useful as a fallback through the Apple Music API (ISRC lookup, real rate limits, $99/yr developer account); not usable through the free iTunes API from a server.
