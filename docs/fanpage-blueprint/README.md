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
