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
- `/access?session_id=…` — the four-step setup; only reachable with a paid Stripe Checkout Session
- `POST /api/stripe/webhook` — Stripe webhook (fulfillment hook in `lib/fulfillment.ts`)

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

## Payments (Stripe Embedded Checkout)

1. Put your keys in `.env.local`: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and set `DRIVE_URL` / `DISCORD_URL`.
2. Forward webhooks locally and copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Test with card `4242 4242 4242 4242`, any future expiry and any CVC.

How it works:

- The buyer configures the order on `/checkout` (pack, bundle upgrade, monthly option). "Continue to payment" calls a
  server action that creates a Checkout Session from the **server-side** price model in `lib/checkout.ts`; changing the
  order afterwards discards the session.
- One-off orders use `mode: payment` (customer + invoice created). The monthly option uses `mode: subscription`: the
  pack is charged today as a one-time line item and the plan ($29, or $97 for all four) starts on the 1st of next month
  with no proration.
- Stripe returns to `/access?session_id=…`, which verifies the session is paid before showing the Drive and Discord links
  (these are server-only env vars). Subscribers get a "Manage or cancel" link to the Stripe customer portal — enable the
  portal in the Stripe dashboard (Settings → Billing → Customer portal).
- In production, add a webhook endpoint at `https://<your-domain>/api/stripe/webhook` for
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
  `invoice.payment_failed` and `customer.subscription.deleted`.
- Pack stock counts ("41 of 200 left") are still static copy in `lib/data.ts`.
