# Analyzer feasibility

_Work in progress. Steps are filled in as they're tested._

## Verdict per step
| Step | Works? (yes / partly / no) | Numbers (hit rate, accuracy, time, cost) | Fallback chosen |
|---|---|---|---|
| 1. Spotify search | **yes** (ISRC); **no** for popularity/genres/followers | search p50 0.37s / p95 0.51s; ISRC 200/200; 30-req burst no 429 | Drop popularity/genres/followers from the product; derive genre feel from audio analysis + quiz |
| 2. Deezer preview | pending | | |
| 3. Audio analysis | pending | | |
| 4. Whisper lyrics | pending | | |
| 5. LLM hooks | pending | | |
| 6. Aesthetic match | pending | | |
| 7. Browser video | pending | | |
| 8. Orchestration | pending | | |
| 9. Save + /s/{id} | pending | | |
| 10. /dev page | pending | | |

## Blockers found
- Spotify Development Mode returns no `popularity` (track or artist), `followers`, `genres`, `preview_url`, audio features or audio analysis. ISRC, title, artists, artwork and release date are fine.
- Extended Quota Mode (which might restore fields) needs a registered organisation with ≥250k MAU. Not an option.
- Dev-mode apps stop working if the owner's Spotify Premium lapses. This is a single point of failure for production.

## Terms of service notes
- Spotify: pending.
- Deezer: pending.
- OpenAI: pending.

## Cost per completed analysis
- Pending.

## Recommended architecture for production
- Pending.

## Open questions for me
- Pending.
