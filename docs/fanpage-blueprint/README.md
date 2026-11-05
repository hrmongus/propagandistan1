# Fanpage Blueprint Builder

Design handoff for the lead-magnet quiz served at `/fanpage-blueprint` (`app/fanpage-blueprint/`).

- `HANDOFF.md`: flow, data model, integrations, copy, pricing, open decisions, design tokens.
- `screens/`: static HTML mock-ups, one per screen (`index.html` lists them in flow order). They are the visual
  source of truth; they have no logic. Images resolve from `screens/assets/`.

Backend already in place (see `docs/analyzer/TECH-SETUP.md`): Spotify search and link lookup, metrics, hooks,
lead submit with `/s/{id}`, funnel events and checkout handoff.

## Screens received

| # | File | Status |
|---|---|---|
| index | `index.html` | received |
| 00 | `00-landing.html` | received |
| 01 | `01-track-search.html` | received |
| 02 | `02-listeners-now.html` | received |
| 03 | `03-did-you-know.html` | received |
| 04 | `04-six-month-goal.html` | received |
| 05 | `05-biggest-blocker.html` | received |
| 06 | `06-how-it-works.html` | received |
| 07 | `07-aesthetics.html` | received |
| 08 | `08-audience.html` | received |
| 09 | `09-several-pages.html` | received |
| 10 | `10-what-you-tried.html` | received |
| 11 | `11-proof.html` | received |
| 12 | `12-daily-time.html` | received |
| 13 | `13-next-release.html` | received |
| 14 | `14-experience.html` | received |
| 15 | `15-analyzing.html` | received |
| 16 | `16-email-gate.html` | received |
| 17 | `17-results-blueprint.html` | received |
| 18 | `18-checkout-1-offer.html` | received |
| 18b | `18b-checkout-2-payment.html` | received |
| assets | `assets/imagery`, `assets/logo`, `assets/proof` | pending upload |

## Build status (2026-11-05)

Built: screens 00–18b at `/fanpage-blueprint` (quiz, 00–16) and `/s/{id}` (results 17 + checkout sheets 18/18b).
Design preview of the results without Supabase: `/dev/blueprint-results`.

| Piece | Where |
|---|---|
| Tokens + component CSS (scoped `.fpb`) | `components/blueprint/blueprint.css` |
| Shared components (Icon, Logo, Img, OptionCard, Chip, QHeader, Footer, Sheet) | `components/blueprint/ui.tsx` |
| Quiz state machine, persisted to localStorage | `components/blueprint/state.ts`, `Flow.tsx` |
| Screens 00–14 / 15–16 / 17–18b | `screens.tsx` / `finale.tsx` / `results.tsx` |
| Charts (goal card, growth chart, radar) | `charts.tsx` |
| All copy and options | `lib/analyzer/config/*` (one import: `@/lib/analyzer/config`) |
| Scores, kits per page | `lib/analyzer/metrics.ts` (unit-tested) |

### Images: drop them in, no code changes

Copy the files into `public/fanpage-blueprint/assets/` with the mock-ups' names:

- `logo/fanpagekit-lockup-white.png` (or swap the path in `components/blueprint/ui.tsx` for an SVG)
- `imagery/pack-golden-hour.png`, `pack-midnight-city.png`, `pack-coastal-drive.png`, `pack-forest-trail.png`
- `imagery/tile-01.png` … `tile-24.png`
- `proof/s4a-listeners-1-8m.png`, `s4a-streams-6-5m.png`, `s4a-growth-2k.png`

Every image slot renders a grey placeholder at the final size until its file exists, so nothing shifts.

### Decisions taken (change any of them)

1. **No audio in v1.** Lyric layer on 06 shows a neutral stand-in line; reels show the hook only; analyzing steps
   describe what actually happens (`ANALYZING_STEPS`). The "Upload an MP3" link on 01 is hidden.
2. **Moments:** the mock's 12 (max 3). New default hooks for chill, romance, rebellion, dreamy, feel-good.
3. **Results link:** `/s/{id}` (backend), not `/b/{id}`.
4. **10-minute expiry bar:** on 17 (added at the owner's request), counting down from the strategy's `created_at` so a reload doesn't reset it. Nothing changes at zero yet: per HANDOFF.md §8 the offer should genuinely end (e.g. the $37 price) before this runs on paid traffic.
5. **Bundle toggle on 18b:** off by default (pre-ticked paid add-ons aren't allowed in the EU).
6. **"Ready to build" summary on 14:** not added (follows the mock).
7. **Kits:** the 3 pages never share a kit; fallback order in `KIT_FALLBACK` reproduces the mock's example.
8. **Payment:** Stripe's embedded checkout (same as `/checkout`) replaces the mock's hand-drawn card fields; after
   paying, buyers land on the existing `/upsell` → `/access` pages (the "order confirmed" step).

### Still placeholder (HANDOFF.md §8, must change before launch)
- `FANPAGE_EXAMPLES` (screen 09 carousel): the post grids are real screenshots, but the handles, names, avatars and Following/Followers/Likes counts are placeholders. Replace them with the real pages' details.

`ARTIST_COUNT`, the "#1 organic method" claim on 03, the $57
anchor (`PRICES.packWas`), kit stock (comes from `lib/data.ts`, same as the live site), example follower counts on 09.
Spotify attribution: the results track card links to Spotify ("Open Spotify"); the Spotify logo isn't placed yet.
