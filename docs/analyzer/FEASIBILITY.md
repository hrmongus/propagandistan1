# Analyzer feasibility

_Work in progress. Steps are filled in as they're tested._

## Verdict per step
| Step | Works? (yes / partly / no) | Numbers (hit rate, accuracy, time, cost) | Fallback chosen |
|---|---|---|---|
| 1. Spotify search | **yes** | search p50 0.37s / p95 0.51s; ISRC 200/200; 30-req burst no 429; works with no allowlisted users | Popularity, followers and genres aren't returned; owner confirmed they're not needed |
| 2. Deezer preview | **partly**: tech works; **terms forbid commercial use** | 24/28 matched (86%), 23/28 with a preview (82%, below the 85% bar); all via ISRC, search fallback added 0; lookup ~0.2s; MP3 ~0.1s to download; preview URLs expire 15 min after issue | MP3 upload field for misses; get Deezer's written approval or find another preview source |
| 3. Audio analysis | **partly** | Essentia.js + mpg123 WASM in Node: ~2.7s/track, 179MB RSS, ~10MB deps, so it fits Vercel. BPM accuracy **not verified** (no reference BPMs exist for these tiny tracks). Energy scale skews high | Recalibrate energy; show BPM only when confidence is high |
| 4. Whisper lyrics | **yes** (whisper-1); gpt-4o-mini-transcribe rejected | Instrumental filter: 9/9 obvious instrumentals caught, 0 obvious vocal tracks dropped after tuning (1 likely miss: Twinpower, whisper returned nothing). Readable lines on 12/13 vocal tracks *by inspection*; no reference lyrics exist for these tiny artists. whisper-1 p50 2.9s, 19/23 under 5s, max 11.9s (empty/instrumental clips are slowest). ~$0.003/track | Instrumental → no lyric line, hook text only; editable lyric field on results |
| 5. LLM hooks | **yes** | 69/69 valid JSON (strict schema); p50 0.68s, max 1.3s; ~234 in / 35 out tokens, ≈$0.0002/set on gpt-4.1-mini. Ran on OpenAI because `ANTHROPIC_API_KEY` isn't in the container; code switches to Claude Haiku 5.5 when it is | Lowercase + 10-word cap enforced in code |
| 6. Aesthetic match | **yes**, with known energy error | Top match 85–94% on 23/23; dark/loud tracks put Fairycore/Cottagecore last; centre-distance scoring removed 3-way ties. A loud-mastered lullaby → Mob wife (energy is loudness-based) | Recalibrate energy (onset density / spectral features) before launch |
| 7. Browser video | **desktop Chromium: yes**; iPhone / Android: **untested** | One tap starts both; audio starts at the hook window; drift −0.05 to −0.07s; second card stops the first. `/api/preview/{deezerId}` mints a fresh signed URL per load, so expiry is handled | Needs owner device test |
| 8. Orchestration | **built, blocked** | `POST /api/analyze` + `after()` + polling; Supabase rejects writes because the configured key is the publishable one | Needs the secret key |
| 9. Save + /s/{id} | **built, blocked** | Tables created with RLS on and anon revoked; verified the publishable key can't read or insert | Needs the secret key |
| 10. /dev page | **built, blocked** | Runs the real routes on all 28 tracks, 4 at a time | Needs the secret key |

## Blockers found
- **`SUPABASE_SERVICE_ROLE_KEY` holds the publishable key** (`sb_publishable_…`), not the secret key, so server writes fail with 42501. Set `SUPABASE_SECRET_KEY` (or replace the value) with the `sb_secret_…` key from Supabase → Project Settings → API Keys.
- Apple preview fallback: the free iTunes Search API has no ISRC lookup and throttles a shared cloud IP to about 1 request/minute with 403s. Not viable server-side on Vercel. The Apple Music API (paid developer token, `filter[isrc]`) is the realistic Apple route.
- **Deezer API terms forbid commercial use** (Terms IV: "strictly limited for a non-commercial purpose"; no revenue "directly or indirectly"). A lead magnet for a paid product is commercial. Other uses need Deezer's prior approval (Terms IX). The terms also require a visible Deezer logo and forbid storing audio. Mixing previews into our video mockups isn't covered and is likely not allowed without approval.
- Deezer misses are artists entirely absent from Deezer's catalogue (3 of 4; the 4th was a 1-day-old release whose artist also isn't on Deezer). A search fallback can't fix that.

## Terms of service notes
- Spotify: pending.
- Deezer (developers.deezer.com/termsofuse + /guidelines, read 2026-11-05): non-commercial only, with prior approval needed for anything else; audio may not be stored offline; full-track URLs must never reach users (30s previews are OK to stream); a clearly visible Deezer logo is mandatory; Deezer can change or revoke access without notice; French law. No published rate limit on the pages readable without login.
- OpenAI: pending.

## Cost per completed analysis
- Pending.

## Recommended architecture for production
- Pending.

## Open questions for me
- Pending.
