# Analyzer feasibility

_Work in progress. Steps are filled in as they're tested._

## Verdict per step
| Step | Works? (yes / partly / no) | Numbers (hit rate, accuracy, time, cost) | Fallback chosen |
|---|---|---|---|
| 1. Spotify search | **yes** | search p50 0.37s / p95 0.51s; ISRC 200/200; 30-req burst no 429; works with no allowlisted users | Popularity, followers and genres aren't returned; owner confirmed they're not needed |
| 2. Deezer preview | **partly**: tech works; **terms forbid commercial use** | 24/28 matched (86%), 23/28 with a preview (82%, below the 85% bar); all via ISRC, search fallback added 0; lookup ~0.2s; MP3 ~0.1s to download; preview URLs expire 15 min after issue | MP3 upload field for misses; get Deezer's written approval or find another preview source |
| 3. Audio analysis | **partly** | Essentia.js + mpg123 WASM in Node: ~2.7s/track, 179MB RSS, ~10MB deps, so it fits Vercel. BPM accuracy **not verified** (no reference BPMs exist for these tiny tracks). Energy scale skews high | Recalibrate energy; show BPM only when confidence is high |
| 4. Whisper lyrics | pending | | |
| 5. LLM hooks | pending | | |
| 6. Aesthetic match | pending | | |
| 7. Browser video | pending | | |
| 8. Orchestration | pending | | |
| 9. Save + /s/{id} | pending | | |
| 10. /dev page | pending | | |

## Blockers found
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
