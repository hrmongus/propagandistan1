# FanpageKit Analyzer: Technical Spike

## Goal
Prove that the backend for the FanpageKit lead-magnet analyzer works, end to end, before any design work. **No styling.** Plain unstyled HTML pages only. The design is being done separately and will be dropped in later.

Work through the steps in order. For every step:
- Build the smallest thing that proves it works.
- Test it against the **pass criteria**.
- If it fails or looks risky, **stop and report immediately** with the error, what you tried, and the fallback options. Don't silently work around it.

At the end, write `FEASIBILITY.md` (template at the bottom).

## What the product does (context)
1. The user searches their song (Spotify).
2. We pull a 30-second audio preview (Deezer) and analyze it: BPM, key, energy, mood, hook position.
3. We transcribe the lyrics from the preview (Whisper).
4. The user answers a short quiz: current listeners, goal, aesthetics (pick up to 3 of 20), audience (age, gender, region, listening moment), what they've tried and their spend.
5. We generate text hooks with an LLM and match aesthetics.
6. Results page: example fan page videos (our pack clip + text hook + lyric line + their audio), a growth chart, and an offer.
7. Results are saved and reachable at a permanent link `/s/{id}`, used in emails.

## Stack (suggested; flag it if something here blocks you)
- Next.js (App Router) + TypeScript, deployed on Vercel
- Supabase (Postgres + storage) for saved results and leads
- OpenAI API for Whisper; Claude or OpenAI for hook generation
- All API keys server-side only

Env vars: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (if using Claude), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Test set
Ask me for 20–30 real Spotify track links before step 2. The set must include:
- Small indie artists (under 10k monthly listeners), which is our main audience
- Rap/trap, an acoustic/folk track, an instrumental (no vocals), a non-English track
- A release from the last 7 days (to catch Deezer catalogue lag)

---

## Step 1: Spotify search
**Do:** Client-credentials auth → `GET /v1/search?type=track&q=...`. For each result, return: track ID, title, artists, artwork URL, `external_ids.isrc`, `popularity`, release date. Also call `GET /v1/artists/{id}` and log `genres`, `popularity`, `followers`.

**Pass if:**
- Search returns results in under 1s.
- ISRC is present on nearly every track.
- We know exactly which fields come back empty or missing. Spotify has cut Web API access for new apps several times since late 2024; log what we actually get.
- Confirm a Development Mode app can serve public users with client credentials. Note any quota, rate limit or extension requirement.

**If it fails:** Report the missing fields. Popularity and genres are nice-to-have; ISRC is critical.

## Step 2: Deezer preview lookup
**Do:** Server-side only (Deezer sends no CORS headers). `GET https://api.deezer.com/track/isrc:{ISRC}` → `id`, `preview` (30s MP3 URL), `duration`, `bpm` (often 0, log it anyway). Fallback: `GET https://api.deezer.com/search?q=artist:"X" track:"Y"`.

**Pass if:**
- Match rate is at least 85% on the test set via ISRC plus the search fallback. Report the exact rate.
- The preview MP3 downloads server-side and plays in a browser `<audio>` tag.
- Find out whether preview URLs expire (check the signed URL parameters, re-test after an hour). If they do, we store the Deezer `id` and fetch a fresh URL on every page load.
- Find where in the song the 30s preview starts, if that can be found out at all. Log it.

**If it fails:** Report the miss rate and which kinds of tracks missed. The fallback is an MP3 upload field (build a bare one so we can test it).

**Also:** read Deezer's API terms and note anything that restricts commercial use, caching or display.

## Step 3: Audio analysis
**Do:** Download the preview → decode → extract:
- BPM and key + mode (major/minor)
- Energy (RMS loudness, normalized 0–100)
- Hook window: the loudest sustained 8–12s window in the preview (simple version is fine)
- Mood label from a simple rule map (mode + energy + tempo → e.g. "Bittersweet", "Dark, restless", "Carefree", "Warm")

Try Essentia.js (WASM) inside a Node serverless function first. If it's too heavy or slow, try a small Python service (librosa) and say where you'd host it (a Vercel Python function if it fits the size limit, otherwise Modal or Railway).

**Pass if:**
- Runs in under 8s per track.
- BPM is within ±3 of the real value on about 80% of the test set. Check against Tunebat or similar by hand and list the errors.
- The function fits Vercel's size and timeout limits, or you name the alternative.

**If it fails:** Report which values are unreliable. Unreliable values get hidden or turned into vaguer labels, not dropped silently.

## Step 4: Lyric transcription (Whisper)
**Do:** Send the preview MP3 to OpenAI's transcription endpoint (`whisper-1`, and also compare `gpt-4o-mini-transcribe`), using `verbose_json` so we get segment timestamps. Pick the "lyric line": the segment that overlaps the hook window, trimmed to 4–12 words.

**Pass if:**
- Readable, mostly correct lines on about 70% or more of vocal tracks. Paste every output into the report next to the real lyric.
- Instrumentals are **detected**, not turned into made-up text. Whisper is known to output garbage like "Thank you for watching" on music. Build a filter using `no_speech_prob`, repetition and garbage phrases, and report how well it works.
- Under 5s per track. Note the cost per track.

**If it fails:** Fallback is no lyric, hook text only, plus an "edit this line" field on the results page. Report which genres fail.

## Step 5: Text hook generation (LLM)
**Do:** One call that takes mood, BPM, energy, selected aesthetics, age group, gender, region and listening moment, and returns JSON: 3 lowercase POV-style hooks, each 10 words or fewer (e.g. "pov: 2am, empty highway, this comes on"). Generate one set per recommended fan page.

**Pass if:** Valid JSON every time, under 3s, and hooks read like real fan page posts. Paste 10 examples into the report. No profanity filter needed, but no slurs.

## Step 6: Aesthetic matching
**Do:** A JSON config of the 20 aesthetics:

Old money, Streetwear, Dark academia, Light academia, Cottagecore, Y2K, Coquette, Clean girl, Mob wife, Grunge, Vaporwave, Synthwave, Cyberpunk, Coastal, Gorpcore, Balletcore, Fairycore, Weirdcore/dreamcore, Cowboy/western, Noir.

Each entry has:
- An energy range
- A tempo range
- A preferred mode
- Genre keywords
- `pack`: one of `golden`, `midnight`, `coastal`, `forest`

Write a function that returns a match % for all 20, sorted. The top match should land at 80–94%.

**Pass if:** Results look sensible across the test set (dark trap shouldn't match Cottagecore). Print a table.

## Step 7: Example video in the browser (the riskiest UX piece)
**Do:** A bare page with a 9:16 box containing:
- A `<video muted loop playsinline>` pack clip. Use any test MP4: H.264, 720×1280, under 2MB.
- An absolutely positioned text hook (top) and lyric line (middle).
- An `<audio>` element with the Deezer preview, starting at the hook window. The timestamp must be **relative to the preview**, not the full song.
- One play button that starts video and audio in sync.

Show 3 of these on one page, the way the results page will. Only one audio track plays at a time.

**Pass if:** Works on a **real iPhone (Safari)**, Android Chrome and desktop. Watch for autoplay blocking, audio needing a tap, sync drift, and preview URL expiry. Report each device.

**If it fails:** Report exactly what breaks. Don't build server-side video rendering (ffmpeg); just note it as a later option.

## Step 8: Pipeline orchestration
**Do:** When the user picks a track, `POST /api/analyze` starts steps 2–4 in the background and returns a job ID. The quiz takes 60–90s, and the results screen polls `GET /api/analyze/{id}`. Store progress in Supabase. Steps 5–6 run when the quiz is submitted.

**Pass if:**
- The full pipeline finishes within 30s, so it's done long before the quiz ends.
- No function hits Vercel's timeout.
- A failure in any one step degrades gracefully: the results page still renders, using the fallbacks from steps 2–4.

## Step 9: Save results + permanent link
**Do:** Supabase table `strategies`:
- `id`: a short random slug
- `created_at`, `name`, `email`
- `answers` (jsonb)
- `track` (jsonb): Spotify ID, ISRC, Deezer ID, title, artist, artwork
- `analysis` (jsonb)
- `hooks` (jsonb)
- `aesthetic_scores` (jsonb)

Rules:
- Insert only from a server route.
- Lock the table down with row-level security; no public reads of emails.
- `/s/{id}` loads the row, fetches a fresh Deezer preview URL by ID and renders the bare results.
- Lead capture saves name and email to the row. Add a stub `sendToESP(lead)` function. I'll choose the email provider later.

**Pass if:** A `/s/{id}` link still works with audio playing after 24h, and a row is a few KB at most.

## Step 10: End-to-end dev page
**Do:** `/dev` runs the full pipeline on the whole test set and outputs one table, one row per track. Columns:
- Spotify OK
- ISRC
- Deezer match
- BPM / key / energy / mood
- Hook window
- Transcript
- Instrumental flag
- Hooks
- Top 3 aesthetics
- Time per step
- Cost per track

---

## FEASIBILITY.md template
```
# Analyzer feasibility

## Verdict per step
| Step | Works? (yes / partly / no) | Numbers (hit rate, accuracy, time, cost) | Fallback chosen |

## Blockers found
- ...

## Terms of service notes
- Spotify Developer Terms: attribution/logo requirements, caching rules
- Deezer API terms: commercial use, caching
- OpenAI: audio data usage

## Cost per completed analysis
- Whisper: $
- LLM hooks: $
- Hosting/other: $
- Total: $

## Recommended architecture for production
- ...

## Open questions for me
- ...
```
