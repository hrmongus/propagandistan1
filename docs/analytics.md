# Analytics (PostHog)

PostHog tracks the whole funnel: landing → checkout → payment → upsell → access. This file is the **event catalog**
and the **rules for keeping it in sync**. The types in `lib/analytics/events.ts` are the source of truth for names and
properties; this file explains why each event exists and where it fires.

## Setup

| Env var | What it does |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Project API key (`phc_…`). Unset → nothing loads or sends, in the browser or on the server. |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (default) or `https://eu.i.posthog.com`. Must match the project's region. |
| `NEXT_PUBLIC_POSTHOG_DEBUG` | `1` → log every PostHog call in the browser console. Leave unset in production. |

## How it's wired

| File | Role |
| --- | --- |
| `instrumentation-client.ts` | Initialises `posthog-js` before hydration; handles `trackClick()` attributes. |
| `next.config.ts` | Rewrites `/ingest/*` to PostHog so ad blockers don't drop events. |
| `lib/analytics/events.ts` | **Typed event catalog** (`ClientEvents`, `ServerEvents`) and `trackClick()`. |
| `lib/analytics/client.ts` | `track()`, `identify()`, `distinctId()` for client components. |
| `lib/analytics/server.ts` | `posthog-node`: `captureServer()` and the payment trackers called by the Stripe webhook. |
| `components/TrackView.tsx` | Sends a `*_viewed` event once on mount (and identifies the buyer on `/access`). |

How to send an event, by where the code runs:

- **Server component link/button** → spread `{...trackClick('event', props)}` onto the element.
- **Client component interaction** → `track('event', props)` in the handler.
- **Page view with properties** → `<TrackView event="…_viewed" props={…} />`.
- **Anything about money** → server only, from the Stripe webhook after fulfillment succeeds (`lib/analytics/server.ts`).
  Never count a purchase from the browser: the redirect can be skipped, reloaded or blocked.

### Identity

1. Every visitor is anonymous (`person_profiles: 'identified_only'`, so no person profile until step 3).
2. Checkout sends the browser's PostHog id to `createCheckoutSession`, which stores it as `ph_distinct_id` in the
   Checkout Session (and Subscription) metadata. Server events use it, falling back to the buyer's email.
3. `/access` calls `identify(email)`, which merges the anonymous history into the buyer's person.

### Automatic (SDK)

`$pageview` (including client-side navigations), `$pageleave`, `$autocapture` (clicks, form submits), `$exception`
(uncaught errors). Session replay and heatmaps are switched on in PostHog's project settings, not in code; the Stripe
payment form is a cross-origin iframe, so card details are never recorded.

## Event catalog

### Landing (`/`)

| Event | Properties | Fires when |
| --- | --- | --- |
| `cta_clicked` | `location` (`nav`, `hero`, `reveal`, `how_it_works`, `inside`, `guarantee`, `final`), `label` | A "Get the pack" style button that scrolls to `#packs` |
| `pack_selected` | `pack`, `price`, `bundle` | A pack's checkout button in the packs grid |
| `faq_toggled` | `question`, `open` | An FAQ item is opened or closed |

### Checkout (`/checkout`)

| Event | Properties | Fires when |
| --- | --- | --- |
| `checkout_viewed` | `pack`, `plan`, `bundle_up` | The checkout page mounts (again after "Change pack") |
| `checkout_bundle_toggled` | `pack`, `enabled` | The four-pack upgrade is switched on or off |
| `checkout_plan_selected` | `pack`, `plan` | A different plan (pay once / monthly) is picked |
| `checkout_change_pack_clicked` | `pack` | "Change pack" |
| `checkout_error` | `pack`, `plan`, `bundle_up`, `error` | The embedded Stripe form can't be created |

### Upsell (`/upsell`)

| Event | Properties | Fires when |
| --- | --- | --- |
| `upsell_viewed` | `order_name`, `packs_offered`, `monthly` | The offer is shown |
| `upsell_accepted` | `packs_offered`, `monthly` | "Yes — add all N packs" |
| `upsell_card_required` | `packs_offered` | The one-click charge needs the buyer, so the card form opens |
| `upsell_error` | `error` | The upsell couldn't be added |
| `upsell_declined` | `packs_offered` | "No thanks" |

### Access (`/access`)

| Event | Properties | Fires when |
| --- | --- | --- |
| `access_viewed` | `order_name`, `monthly`, `upsell` | The access page loads (also identifies the buyer by email) |
| `access_step_completed` | `step`, `step_name`, `action` (`continue` / `skip`) | A setup step is finished or skipped |
| `discord_join_clicked` | — | "Join Discord" |
| `drive_opened` | `name` | A Google Drive folder link |

### Server (Stripe webhook, server actions)

| Event | Properties | Fires when |
| --- | --- | --- |
| `order_paid` | `pack`, `plan`, `bundle_up`, `order_name`, `packs`, `amount`, `currency` | `checkout.session.completed` / `async_payment_succeeded`, after fulfillment. Sets `email`, `name`, `plan` on the person. |
| `upsell_paid` | `packs`, `amount`, `currency`, `method` (`one_click` / `checkout`) | `payment_intent.succeeded` for an upsell |
| `subscription_renewed` | `pack`, `amount`, `currency` | `invoice.paid` with `billing_reason: subscription_cycle` |
| `payment_failed` | `amount`, `currency`, `billing_reason` | `invoice.payment_failed` |
| `subscription_cancelled` | `pack` | `customer.subscription.deleted` |
| `billing_portal_opened` | — | "Manage or cancel" on `/access` |

Amounts are in dollars (Stripe cents ÷ 100).

### Suggested insights

- **Funnel:** `$pageview` on `/` → `pack_selected` → `checkout_viewed` → `order_paid` → `upsell_viewed` →
  `upsell_paid` → `access_viewed`.
- **Upsell take rate:** `upsell_paid` ÷ `upsell_viewed`, broken down by `method`.
- **Plan mix:** `order_paid` broken down by `plan` and `bundle_up`.
- **CTA performance:** `cta_clicked` broken down by `location`.

## Rules: keep events in sync with the product

Any change to a flow or UI must leave the analytics matching it **in the same change**:

1. **New screen, step, button or outcome** that matters to the funnel → add an event (or a property on an existing
   one). Add it to `lib/analytics/events.ts` first, then send it, then add a row to the catalog above.
2. **Removed or renamed UI** → remove or rename its event everywhere: `events.ts`, the call sites and this catalog.
   TypeScript flags stale call sites; `grep -rn "event_name"` for anything stringly typed.
3. **Changed meaning** (a step now fires in a different place, a property's values change, a CTA moves) → update the
   catalog's "Fires when" and property values. If old and new data would be mixed up in the same insight, give the
   event a new name rather than silently changing what the old one means.
4. **Copy-only changes** don't need a new event, but update `label` values passed to `cta_clicked` so they match the
   button text.
5. **Payments, subscriptions and refunds** are tracked only on the server, in the webhook, after fulfillment succeeds.
6. **No secrets or private links in properties**: no Drive URLs, Discord invite, Stripe secrets or card data. Email is
   allowed only as the person identity (`identify`, `$set`).
7. **Naming**: snake_case `object_action`, past tense (`pack_selected`, not `selectPack` or `click_pack`). Reuse an
   existing event with a new property before adding a near-duplicate event.
8. Before finishing: `npm run typecheck`, then confirm the new event in PostHog's Activity tab (or in the console with
   `NEXT_PUBLIC_POSTHOG_DEBUG=1`).
