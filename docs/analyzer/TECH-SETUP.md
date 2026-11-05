# Analyzer tech setup

v1 has no audio. The earlier audio spike's results are in `FEASIBILITY.md` / `NOTES.md` and `spike/`; its code was
removed from the app. Tested 2026-11-05 on a local dev server in the cloud container (not on Vercel; see Blockers).

## Status per step

| Step | Works? | Notes / numbers | Fallback |
|---|---|---|---|
| 1. Project setup | **partly** | Next.js 16 app (this repo), Supabase connected and schema applied. **Not deployed**: no Vercel access from here. **Supabase reads/writes from the app fail**: the env holds the publishable key, not the secret key | Owner connects Vercel and sets `SUPABASE_SECRET_KEY` (see Blockers) |
| 2. Spotify search | **yes** | 28/28 small-artist test tracks (300–5k monthly listeners) found by "artist title" search. Server time p50 301ms, p95 443ms, max 525ms. Pasted link p50 57ms. `popularity` is always `null` and artist genres are missing (Development Mode). Works with zero allowlisted users | none needed |
| 3. Database | **partly** | `strategies` + `events` created; RLS on, anon/authenticated revoked. **Verified the publishable key gets `42501 permission denied`** on select and insert. Server-route writes untested until the secret key is set | — |
| 4. Config | **partly** | Typed, one import (`@/lib/analyzer/config`): 20 aesthetics, 4 packs, 8 moments, 10 quiz questions. **Values are placeholders**: `fanpage-strategy-builder.html` wasn't provided | Swap values when the file arrives; types stay |
| 5. Metrics | **yes** | `getMetrics()` pure + seeded (FNV-1a → mulberry32). 12 unit tests pass: same input → same output, key order doesn't matter, ranges hold over 2,000 inputs, bracket mapping, fill rule (pick order, same-pack fill, dedupe, cap 3, empty picks) | — |
| 6. Hooks | **yes** | 10/10 live calls valid JSON, 0 fallbacks, 0 rule violations. Model time p50 1.4s, max 2.0s (gpt-4.1-mini). Forced error, timeout (4s), API error, malformed output and missing key all return default hooks (5 unit tests + live forced-error check). Ran on OpenAI: `ANTHROPIC_API_KEY` isn't in the container | Default hooks from `moments` |
| 7. Lead submit + /s/{id} | **partly** | Validation works (invalid / disposable email, bad track or answers → 400). Metrics + hooks run (~1.5s). **Save fails** (wrong Supabase key) → returns `save_failed` cleanly. Submit time, fresh-browser `/s/{id}` and row size untested | — |
| 8. Event tracking | **partly** | Route validates and rejects junk (400). Insert blocked by the key. `track()` client helper done (sendBeacon, never throws, mirrors to PostHog). Drop-off SQL verified on sample rows | — |
| 9. Checkout handoff | **yes** (redirect) / **partly** (log) | `302 → CHECKOUT_URL?pack=…&ref=…`; invalid pack/ref are dropped. The log write fails on the key but never blocks the redirect. `CHECKOUT_URL` unset → `/checkout` | — |
| 10. Video autoplay | **desktop Chromium: yes**; iPhone / Android: **untested** | All 3 clips (720×1280 H.264, 73–208KB) autoplay muted inline. Browsers pause off-screen muted autoplay and resume when scrolled in, so on a phone only the visible boxes play at once | Needs owner device test on the Vercel URL |

## Blockers

1. **Supabase secret key.** `SUPABASE_SERVICE_ROLE_KEY` contains `sb_publishable_…`. The server needs the secret key
   (`sb_secret_…`, Supabase → Project Settings → API Keys). Set it as `SUPABASE_SECRET_KEY` (what the rest of this
   app already reads) or replace the current value. The code refuses a publishable key with a clear error.
2. **Vercel deploy.** No Vercel token or CLI in this environment. Import `hrmongus/propagandistan1` in Vercel, set the
   env vars below, and every push to `leadmagnet` gets a preview URL. Then Step 10 can be tested on real phones.
3. **`fanpage-strategy-builder.html`** wasn't uploaded, so config values are placeholders.

Env vars for Vercel: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`
(Claude is used when set; `HOOKS_MODEL` overrides the default `claude-haiku-5-5`), `SUPABASE_URL`,
`SUPABASE_SECRET_KEY`, `CHECKOUT_URL`, `NEXT_PUBLIC_SITE_URL` (used to build `results_url`).

## Spotify limits + attribution requirements

**Limits (tested live with this app, Development Mode, client credentials):**
- **Public traffic:** works with no user login and no allowlist. The 5-user allowlist applies only to user-login flows.
- **Fields:** track `popularity`, artist `genres` / `popularity` / `followers` and `preview_url` are not returned. Audio features, audio analysis and top tracks return 403; recommendations returns 404.
- **Search size:** `limit` max 10; asking for more returns 400.
- **Quota:** counted per developer account, with no published number. 30 back-to-back searches all succeeded. Over-quota requests return 429 with `QUOTA_EXCEEDED`.
- **Premium:** the app owner's Spotify account must keep Premium, or the app stops working.
- **Extended Quota Mode:** needs a registered organisation with 250k+ MAU and a review of up to 6 weeks. Not needed for this use.

**Attribution** (Spotify Design & Branding Guidelines, developer.spotify.com/documentation/design, read 2026-11-05).
This applies because we show Spotify metadata and artwork:
- **Logo:** "you must always attribute content from Spotify with the logo", and use the full logo (icon + wordmark).
  - The icon alone is allowed only when there's no room for the full logo.
  - Minimum size: 70px for the full logo, 21px for the icon.
  - Clear space: half the icon's height.
  - Colours: green only on black or white backgrounds; otherwise black (light backgrounds) or white (dark backgrounds).
  - Never on top of album artwork, never rotated or stretched, never co-branded.
- **Link back:** "If you use any Spotify metadata (including artist, album and track names, album artwork …) it must always link back to the Spotify Service."
  - Button text: OPEN SPOTIFY, PLAY ON SPOTIFY or LISTEN ON SPOTIFY.
  - Every track object from our API includes `spotifyUrl` for this.
- **Artwork:**
  - Use it as provided: no cropping, overlays, blur, animation or text on top.
  - Corner radius 4px (small and medium screens) or 8px (large).
  - Leaving artwork out is allowed.
- **Metadata:**
  - Show titles exactly as Spotify provides them.
  - Truncation is OK if the full text stays viewable.
  - Layout guide: track 23 characters, artist 18.
- **Naming:** the app name must not include or sound like "Spotify".

## Cost per lead (LLM + hosting)

- **LLM:** one hooks call per lead, measured at 328 input + 121 output tokens on average.
  - gpt-4.1-mini (current): **≈ $0.0003 per lead**.
  - Claude Haiku 5.5 (list $0.10 / $0.50 per M tokens): **≈ $0.0001 per lead**.
- **Spotify, Supabase:** $0 per lead at this volume. Each row is a few KB, so even 100k rows fits a small Supabase plan.
- **Vercel:** each lead is about 3–4 function calls of under 2s. Effectively $0 on Pro's included usage at lead-magnet volumes.
- **Total: under $0.001 per lead.**

## Drop-off SQL query

Run in Supabase → SQL editor. One row per funnel stage (each quiz step separately), ordered by funnel position.
It shows the sessions reaching each stage, % of starts, and % of the previous stage. Verified on sample rows.

```sql
with ev as (select * from public.events where created_at >= now() - interval '30 days'),
starts as (select session_id, min(created_at) as t0 from ev group by session_id),
staged as (
  select case when e.name = 'step_viewed' then 'step: ' || coalesce(e.step, '?') else e.name end as stage,
         case e.name when 'track_selected' then 1 when 'step_viewed' then 2 when 'email_submitted' then 3
                     when 'results_viewed' then 4 when 'offer_clicked' then 5 else 6 end as stage_rank,
         e.session_id,
         extract(epoch from e.created_at - s.t0) as secs_from_start
  from ev e join starts s using (session_id)
),
agg as (
  select stage, min(stage_rank) as stage_rank, percentile_cont(0.5) within group (order by secs_from_start) as median_secs,
         count(distinct session_id) as sessions
  from staged group by stage
)
select stage, sessions,
       round(100.0 * sessions / max(sessions) over (), 1) as pct_of_start,
       round(100.0 * sessions / lag(sessions) over (order by stage_rank, median_secs), 1) as pct_of_previous,
       round(median_secs::numeric) as median_secs_from_start
from agg
order by stage_rank, median_secs;
```

Quiz steps are ordered by their median time from the session start, so the screens should send `step_viewed` with
the quiz question id as `step` (e.g. `listeners`, `goal`).

## API reference for the front end

All JSON. Errors are `{ "error": "<code>" }` with a 4xx/5xx status.

### `GET /api/spotify/search?q=`
→ `{ tracks: SpotifyTrack[] (max 10), ms }`. Empty `q` → `{ tracks: [], ms: 0 }`. Error `search_failed` (502).
```json
{ "tracks": [{ "id": "4hWnpdm0As7Ruegjv2XD6W", "title": "Heart Is the Key", "artists": ["Lubó"],
  "artworkUrl": "https://i.scdn.co/image/…", "releaseDate": "2026-09-16", "popularity": null,
  "spotifyUrl": "https://open.spotify.com/track/4hWnpdm0As7Ruegjv2XD6W" }], "ms": 301 }
```

### `GET /api/spotify/track?url=`
Accepts `https://open.spotify.com/track/{id}?si=…` (with or without an `intl-xx` prefix), `spotify:track:{id}` or a
bare id. → `{ track: SpotifyTrack, ms }`. Errors: `invalid_url` (400), `not_found` (404), `lookup_failed` (502).
`&genres=1` also returns `genres` (always missing in Development Mode) and logs it.

### `POST /api/hooks`
```json
{ "title": "Heart Is the Key", "artist": "Lubó", "genres": [], "lyricLine": null,
  "aesthetics": ["noir", "synthwave", "streetwear"], "age": "18-24", "gender": "mixed", "moments": ["night-drive"] }
```
→ always 200 when the input is valid:
```json
{ "pages": [{ "aesthetic": "noir", "hooks": ["pov: cigarette smoke curls in dim light", "…", "…"] }, …],
  "fallback": false, "provider": "gpt-4.1-mini", "ms": 1393, "usage": { "input": 328, "output": 121 } }
```
On timeout or error: `fallback: true`, `reason`, `provider: "defaults"`. Error `400` if title, artist or ≥1 known
aesthetic id is missing. `forceError: true` forces the fallback (ignored when `VERCEL_ENV=production`).

### `POST /api/strategy`
```json
{ "track": { "id": "4hWnpdm0As7Ruegjv2XD6W", "title": "Heart Is the Key", "artists": ["Lubó"],
             "artworkUrl": "…", "releaseDate": "2026-09-16", "spotifyUrl": "…" },
  "answers": { "listeners": "1k-10k", "goal": "streams", "blocker": "no-time", "aesthetics": ["noir", "y2k"],
               "age": "18-24", "gender": "mixed", "moments": ["night-drive"], "time": "1-3h", "release": "out", "experience": "never" },
  "lyricLine": "optional", "firstName": "Sam", "email": "sam@example.com" }
```
→ `{ id: "Ab12Cd34", results_url: "https://…/s/Ab12Cd34", ms, hooks_ms, hooks_fallback }`.
Errors: `invalid_email`, `disposable_email`, `invalid_track`, `invalid_answers` (400), `save_failed` (500).
`answers.listeners` is required: `lt1k | 1k-10k | 10k-50k | 50k-100k | 100k+`. Aesthetics are ids in pick order.

### `GET /api/strategy/{id}`
→ `{ id, created_at, first_name, track, answers, metrics, hooks, lyric_line }` (never the email). 404 `not_found`.
`metrics`:
```json
{ "fanpageFit": { "score": 87, "label": "Excellent fit" }, "untappedAudiencePct": 97,
  "radar": { "hook": 91, "emotion": 77, "replay": 84, "relatability": 70, "shareability": 88, "visualFit": 93 },
  "topFanPages": ["noir", "y2k", "streetwear"], "offerPack": "midnight" }
```
`hooks`: `{ pages: [{ aesthetic, hooks: [3] }], fallback, provider }`. Labels for radar keys: `RADAR_LABELS` in
`lib/analyzer/metrics.ts`.

### `POST /api/event`
`{ session_id, strategy_id?, name, step? }` → 204. Names: `track_selected`, `step_viewed`, `email_submitted`,
`results_viewed`, `offer_clicked`, `upsell_accepted`, `upsell_declined`. Use the helper instead:
```ts
import { track, setStrategyId, sessionId } from '@/lib/analyzer/track';
track('step_viewed', 'goal');
setStrategyId(id); // after POST /api/strategy, so later events carry it
```

### `GET /api/checkout?pack={pack}&ref={strategy_id}&sid={session_id}`
Logs `offer_clicked` (step `checkout_redirect`), then 302 to `CHECKOUT_URL` with `pack` and `ref` added. Pass
`sid: sessionId()` so the click joins the session in the funnel.

### Pages
`/s/{id}` (raw JSON for now), `/dev/search`, `/dev/hooks`, `/dev/video`. All are `noindex` and disallowed in robots.txt.

### Config and logic imports
`@/lib/analyzer/config`: `AESTHETICS`, `PACKS`, `MOMENTS`, `QUIZ`, `LISTENER_BRACKETS` and their types.
`@/lib/analyzer/metrics`: `getMetrics`, `RADAR_LABELS`.

## 10 example hook outputs (live, gpt-4.1-mini, 2026-11-05)

Each line is one fan page: its 3 hooks.

1. **Heart Is the Key**, for 18–24, mixed, late night drive.
   - noir: pov: cigarette smoke curls in dim light · alone in a black and white city · midnight whispers behind frosted glass
   - synthwave: dashboard glowing neon blue and pink · endless grid beneath a starless sky · cruising through pixelated midnight streets
   - streetwear: hoodie up, city lights blur fast · sidewalks echo with late night kicks · graffiti walls and subway hums align
2. **Through the Mask**, for 18–24, mostly men, gym, with a lyric line.
   - streetwear: pov: midnight jog, city lights pulse with the beat · wrecked kicks hit pavement, rhythm matches heartbeat · hoodie zipped, breath fogs in neon shadows
   - grunge: pov: alone in thrift store, heavy rain outside · flannel sleeves soaked, echo of distant sirens · film grain flickers as you lace boots tight
   - cyberpunk: pov: neon rain blurs your visor's cracked glass · gloves tap on glowing console in dark alley · synthetic beats sync with downpour on metal
3. **Carolina Rig**, for 25–34, mostly men, summer.
   - western: pov: dusty boots on cracked desert roads · sunset fading behind endless red cliffs · that moment your hat blows off in wind
   - gorpcore: hiking up to catch last daylight on summit · gear packed for a trail that never ends · muddy boots and the smell of pine trees
   - cottagecore: warm bread fresh from the sunlit kitchen · lost in meadows where wildflowers bloom · soft light filtering through lace curtains
4. **La Sin Corazón**, for 18–24, mostly women, heartbreak.
   - coquette: pov: soft pink bows tangled in heartbreak · when pastels fade, but you still ache · dressed in lace, feeling the sting of love loss
   - old-money: pov: vintage pearls at a silent heartbreak party · rich velvet curtains hiding quiet tears tonight · timeless halls echo your lonely sighs
   - light-academia: pov: sunlight on torn journal pages and broken hearts · linen shirts soaked in bittersweet memories · calm library corners holding your silent sorrow
5. **Poprowadź mnie**, for rainy day + night drive.
   - weirdcore: pov: empty mall at midnight, flickering lights · caught between dreams and forgotten places · walking through walls that don't exist anymore
   - noir: smoke curling in a dimly lit alley · black rain on slick city streets · your shadow under the streetlamp fades away
   - vaporwave: neon pink skyline at 3 am · typing on a vintage keyboard, lost in thought · retro waves crashing on a pixelated shore
6. **Trip Trap Steps**, for 13–17, getting ready.
   - cyberpunk: pov: rain taps your visor, city glows neon · getting ready: lacing up shiny tech boots · mirror fogged, neon signs flicker outside window
   - streetwear: late night, fresh kicks stepping on wet pavement · hoodie up, city lights speeding past · pulling on that jacket before the city run
   - mob-wife: fur coat over bare shoulders, gold rings clink · ready for power moves, heels clicking marble · smoke curls, attitude sharp as a knife
7. **Delicate Ambient Mood**, for studying.
   - balletcore: pov: tying satin ribbons before class · late night studio, soft lights, stretching · morning light through tulle skirts
   - fairycore: walking through dappled sunlight and whispers · lost in moss, glitter falling softly · twilight forest, magic hums alive
   - dark-academia: candle flicker shadows on old pages · rain tapping window by the desk · quiet library, secrets in the air
8. **Popular teen girl**, for 13–17, mostly women, main character.
   - y2k: pov: neon lights, butterfly clips, city walk · walking past lockers, flashy phone in hand · glossy photo flash, crowd parts for you
   - coquette: pov: pastel dress, ribbon in the breeze · soft sunlight, garden path, skipping steps · lace gloves, holding a secret smile
   - clean-girl: pov: slicked back hair, morning light · minimal jewelry, confident steps outside · fresh glow, quiet streets, perfect stride
9. **CÓMO ESTÁS?**, for summer + heartbreak.
   - coastal: pov: linen dress, sun setting over waves · summer breeze, salty hair, this song plays · watching golden hour melt into the sea
   - clean-girl: pov: glowing skin, morning light, calm vibes · bare face, slicked back hair, soft melody · minimal routine, this song on repeat
   - old-money: pov: slow pan over heirlooms at dusk · quiet rooms, vintage books, soft notes · timeless elegance, heartbreak in the air
10. **Bentley**, for 18–24, mostly men, night drive + gym.
    - mob-wife: pov: late night, fur coat, city lights flicker · when gold shines brighter than your wildest dreams · attitude set, ready for the midnight showdown
    - streetwear: dark streets, fresh kicks, rhythm in every step · this song fuels your city night grind · caught in motion, neon glows, heartbeat syncs
    - noir: smoke curls, black and white world fades · lonely night, mystery deep as shadows · pov: lost in the silence between two beats

Quality: the hooks follow every rule, but only about half use the "pov:" prefix, and some drift generic ("this song fuels
your city night grind"). Worth one prompt pass once the real moment and aesthetic copy from the HTML is in.

## Open questions for me

1. **Secret key:** please set the Supabase secret key (`sb_secret_…`), then I'll finish Steps 3, 7, 8 and 9: submit time, fresh-browser `/s/{id}`, row size and the event log.
2. **Vercel:** connect Vercel, or tell me the URL if it's already connected.
3. **Config values:** upload `fanpage-strategy-builder.html`.
4. **Hooks model:** keep gpt-4.1-mini, or Claude Haiku 5.5 once `ANTHROPIC_API_KEY` is in the env? Both pass; Claude is about 3× cheaper per lead, but the cost is negligible either way.
5. **"pov:" prefix:** should every hook start with "pov:", or is a mix fine?
6. **Disposable emails:** the built-in list covers about 45 big throwaway domains. Is that enough, or does your ESP do its own check?
7. **Analytics:** the analyzer events go to both Supabase `events` and PostHog, matching the repo's analytics rules. Is the Supabase copy still wanted, given PostHog funnels exist?
