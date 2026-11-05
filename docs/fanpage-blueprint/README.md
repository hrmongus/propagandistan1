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
| 02–18b | | pending upload |
| assets | `assets/imagery`, `assets/logo`, `assets/proof` | pending upload |
