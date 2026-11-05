# Analyzer feasibility

_Work in progress. Steps are filled in as they're tested._

## Verdict per step
| Step | Works? (yes / partly / no) | Numbers (hit rate, accuracy, time, cost) | Fallback chosen |
|---|---|---|---|
| 1. Spotify search | **yes** | search p50 0.37s / p95 0.51s; ISRC 200/200; 30-req burst no 429; works with no allowlisted users | Popularity, followers and genres aren't returned; owner confirmed they're not needed |
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
- None so far. Fields Spotify no longer returns in dev mode (popularity, followers, genres, preview_url) are out of scope by owner decision.

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
