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
- `/checkout?pack=<slug>[&plan=monthly]` — order summary, bundle upgrade, pay-once or monthly plan, and payment (`golden-hour`, `midnight-city`, `coastal-drive`, `forest-trail`, `bundle`)
- `/upsell?session_id=…` — one-click post-purchase offer: the packs the buyer doesn't own, $27 for all three (skipped for all-four orders)
- `/access?session_id=…` — the four-step setup and Drive links; only reachable with a paid Stripe Checkout Session
- `POST /api/stripe/webhook` — Stripe webhook (fulfillment hook in `lib/fulfillment.ts`)

## Layout

- `app/` — routes, root layout (Geist via `next/font`), `globals.css`, robots and sitemap
- `components/landing/` — landing sections; `Anatomy`, `Compare`, `HowItWorks` and `Faq` are client components
- `components/checkout/` — checkout and access views
- `lib/data.ts` — page content (reels, accounts, packs, FAQ)
- `lib/checkout.ts` — order model and pricing, shared by checkout and access
- `lib/series.ts` — seeded chart series for the compare slider
- `lib/config.ts` — site URL, Calendly and the paid-only links, read from env vars (see `.env.example`)
- `public/uploads/` — videos, thumbnails, logos and pack art (see `public/uploads/README.md`); missing files fall back to the design's placeholders

## Behaviour

- Hero and account marquees pause on hover; videos play only while in view.
- "Anatomy of one reel" draws connector lines from the callouts to the reel, with a scroll parallax, and scales down under 780px.
- "Spikes you rent, or a curve you own" is a draggable (and keyboard-operable) before/after comparison over two seeded listener series.
- Steps and FAQ are accordions; the time-saved bars carry a scroll-driven sheen.

## Payments (Stripe Embedded Checkout)

1. Put your keys in `.env.local`: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, the monthly price ID
   (`STRIPE_PRICE_MONTHLY_PACK`, $29/mo), `DISCORD_URL`, the five
   `DRIVE_URL_*` folders and, for subscriber emails, `RESEND_API_KEY` / `EMAIL_FROM`.
2. Forward webhooks locally and copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Test with card `4242 4242 4242 4242`, any future expiry and any CVC.

How it works:

- The buyer configures the order on `/checkout`: pack, bundle upgrade, and plan. The embedded payment form loads
  immediately from a server action that creates a Checkout Session from the **server-side** price model in
  `lib/checkout.ts`; changing the order opens a fresh session. The two plans are built separately:
  - **Pay once** (`lib/payment.ts`) — `mode: payment`, $37 a pack or $97 for all four. Nothing renews.
  - **Monthly** (`lib/subscription.ts`) — single packs only: `mode: subscription` with one recurring Price, $29/mo.
    Taking the four-pack upgrade switches the order to pay once. The first month is charged at checkout, then it renews on the same day every month until cancelled.
    Renewals arrive as `invoice.paid` (`billing_reason: subscription_cycle`) and run `fulfillRenewal`.
- Stripe returns to `/upsell?session_id=…`. One-off payments save the card (`setup_future_usage: off_session`) and
  subscriptions keep it as their default, so "Yes" charges $27 for the remaining packs in one click (PaymentIntent with
  `metadata.upsell_for = <checkout session id>`, idempotent per order). If the bank needs 3-D Secure or there is no saved
  card, an embedded Checkout for the same $27 opens instead. "No thanks" goes straight to `/access`.
- `/access` verifies the session is paid (and looks up a paid upsell on the customer) before reading any link. Drive
  links are server-only env vars, one per pack plus one for the bundle:
  - one-off single pack → that pack's folder; bundle, bundle upgrade or single + upsell → the bundle folder;
  - subscribers → only the pack they picked; packs added with the upsell are emailed from `lib/fulfillment.ts`
    right after the charge. Subscribers get a "Manage or cancel" link to the Stripe customer portal — enable the
  portal in the Stripe dashboard (Settings → Billing → Customer portal).
- In production, add a webhook endpoint at `https://<your-domain>/api/stripe/webhook` for
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
  `payment_intent.succeeded`, `invoice.paid`, `invoice.payment_failed` and `customer.subscription.deleted`.
## Database (Supabase)

Project `fanpagekit` (ref `wuxdklbbbjllsburcxfy`, us-east-1). Schema in `supabase/migrations/`:

- `users` — one row per buyer email (name, latest Stripe customer)
- `transactions` — every paid order, upsell and subscription renewal, unique per Stripe object (session, PaymentIntent or invoice)
- `purchased_kits` — the packs each transaction unlocked (a four-pack order is four rows; renewals have none until
  monthly packs are assigned)

`lib/fulfillment.ts` writes them through `record_purchase` (`lib/db.ts`) before sending the order email, in one
database transaction and idempotently, so Stripe retries never duplicate rows. A failed write answers 500 and Stripe
retries. Tables are server-only: RLS is on with no policies and the browser roles have no grants; the app uses
`SUPABASE_SECRET_KEY`.

```bash
supabase link --project-ref wuxdklbbbjllsburcxfy   # once, asks for SUPABASE_DB_PASSWORD
supabase migration new <name>                      # write SQL, then:
supabase db push
supabase gen types typescript --linked --schema public > lib/database.types.ts
```

- Pack stock counts ("41 of 200 left") are still static copy in `lib/data.ts`.

## Analytics (PostHog)

Set `NEXT_PUBLIC_POSTHOG_KEY` (and `NEXT_PUBLIC_POSTHOG_HOST` for the EU cloud). Funnel events are sent from the
browser through `/ingest` on this domain, and payments from the Stripe webhook. The event catalog, identity model and
the rules for keeping events in sync with the UI are in [`docs/analytics.md`](docs/analytics.md).
