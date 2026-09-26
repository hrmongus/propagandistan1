# FanpageKit

Landing page, checkout and post-purchase access flow for FanpageKit, built with Next.js 16 (App Router) from the
Claude Design file `FanpageKit Landing v2.dc.html`.

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck` | `tsc --noEmit` |

## Routes

- `/` — the landing page
- `/checkout?pack=<slug>` — order summary, bundle upgrade, monthly option and payment (`golden-hour`, `midnight-city`, `coastal-drive`, `forest-trail`, `bundle`)
- `/access` — the four-step setup shown after payment

## Layout

- `app/` — routes, root layout (Geist via `next/font`), `globals.css`, robots and sitemap
- `components/landing/` — landing sections; `Anatomy`, `Compare`, `HowItWorks` and `Faq` are client components
- `components/checkout/` — checkout and access views
- `lib/data.ts` — page content (reels, accounts, packs, FAQ)
- `lib/checkout.ts` — order model and pricing, shared by checkout and access
- `lib/series.ts` — seeded chart series for the compare slider
- `lib/config.ts` — design tweaks read from `NEXT_PUBLIC_*` env vars (see `.env.example`)
- `public/uploads/` — videos, thumbnails, logos and pack art (see `public/uploads/README.md`); missing files fall back to the design's placeholders

## Behaviour

- Hero and account marquees pause on hover; videos play only while in view.
- "Anatomy of one reel" draws connector lines from the callouts to the reel, with a scroll parallax, and scales down under 780px.
- "Spikes you rent, or a curve you own" is a draggable (and keyboard-operable) before/after comparison over two seeded listener series.
- Steps and FAQ are accordions; the time-saved bars carry a scroll-driven sheen.
- The payment form is still a front-end mock and does not charge anything.
