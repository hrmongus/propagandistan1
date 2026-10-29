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
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (dataset) ID. Unset → the pixel doesn't load and nothing goes to Meta. |
| `META_CAPI_ACCESS_TOKEN` | Conversions API token (server-only). Unset → no server-side Purchase / Subscribe. |
| `META_TEST_EVENT_CODE` | Code from Events Manager → Test events, to see server events live. Leave unset in production. |

## How it's wired

| File | Role |
| --- | --- |
| `instrumentation-client.ts` | Initialises `posthog-js` before hydration; handles `trackClick()` attributes. |
| `next.config.ts` | Rewrites `/ingest/*` to PostHog so ad blockers don't drop events. |
| `lib/analytics/events.ts` | **Typed event catalog** (`ClientEvents`, `ServerEvents`) and `trackClick()`. |
| `lib/analytics/client.ts` | `track()`, `identify()`, `distinctId()` for client components. |
| `lib/analytics/server.ts` | `posthog-node`: `captureServer()` and the payment trackers called by the Stripe webhook. |
| `lib/analytics/meta.ts` | Loads the Meta Pixel; `track()` forwards mapped events to it; `trackMetaPurchases()` sends paid events from the browser (see *Meta* below). |
| `lib/analytics/meta-server.ts` | Meta Conversions API: `sendMetaEvent()`, `metaCheckoutMetadata()`, and `metaBrowserPurchases()` for the Pixel copy. |
| `components/TrackView.tsx` | Sends a `*_viewed` event once on mount (and identifies the buyer on `/access`). |

How to send an event, by where the code runs:

- **Server component link/button** → spread `{...trackClick('event', props)}` onto the element.
- **Client component interaction** → `track('event', props)` in the handler.
- **Page view with properties** → `<TrackView event="…_viewed" props={…} />`.
- **Anything about money** → server only, from the Stripe webhook after fulfillment succeeds (`lib/analytics/server.ts`).
  Never count a purchase from the browser: the redirect can be skipped, reloaded or blocked.

### Identity

1. Every visitor is anonymous (`person_profiles: 'identified_only'`, so no person profile until they pay).
2. Checkout sends the browser's PostHog id to `createCheckoutSession`, which stores it as `ph_distinct_id` in the
   Checkout Session (and Subscription) metadata. Server events use it, falling back to the buyer's email.
3. `order_paid` (webhook) sets `email`, `name` and `plan` on that browser's person, so the buyer is known from the
   moment they pay, whether or not they ever open `/access`.
4. `/access` also calls `identify(email)`, which merges this browser with any purchase sent under the email (no
   `ph_distinct_id`) and with the buyer's other devices.

### Internal users

Two filters in PostHog's project settings (*Filter out internal and test users*, on by default) keep the team out of
every insight:

- **Cohort "Internal team (by email)"** — people whose `email` is one of the team's. Matches anyone on the team who
  has paid, including their browsing before they paid. Add new teammates' emails to the cohort.
- **Cohort "Internal / Test users"** — `$internal_or_test_user` is set. posthog-js sets it automatically on
  `localhost`, and on any browser opened once with **`?internal=1`** (`instrumentation-client.ts`; `?internal=0`
  undoes it). Use the link on every phone and laptop the team browses the site from. Those browsers also skip the
  Meta Pixel.

Admin previews of `/upsell` and `/access` (`?preview=<PREVIEW_TOKEN>`, `lib/preview.ts`) send no `upsell_viewed`,
`access_viewed`, `upsell_accepted` or `upsell_declined` and no Meta purchase. Open them with `&internal=1` so the
step and link clicks on `/access` are filtered out too.

### Automatic (SDK)

`$pageview` (including client-side navigations), `$pageleave`, `$autocapture` (clicks, form submits), `$exception`
(uncaught errors). Session replay and heatmaps are switched on in PostHog's project settings, not in code; the Stripe
payment form is a cross-origin iframe, so card details are never recorded.

## Event catalog

### Landing (`/`)

| Event | Properties | Fires when |
| --- | --- | --- |
| `cta_clicked` | `location` (`nav`, `hero`, `reveal`, `how_it_works`, `final`), `label` | A "Get the pack" style button that scrolls to `#packs` |
| `pack_selected` | `pack`, `price`, `bundle`, `plan` (`once` / `monthly`) | A checkout button in the packs section: the selected pack (`once`), the bundle (`once`, `bundle: true`), or the subscription card (`monthly`, `price` = monthly price, `pack` = the aesthetic it starts with) |
| `aesthetic_selected` | `pack`, `method` (`swatch` / `arrow` / `swipe`) | The pack card switches aesthetic: a swatch under the preview, the ‹ › arrows on it, or a swipe across it. Only that pack's card is shown |
| `faq_toggled` | `question`, `open` | An FAQ item is opened or closed |
| `reviews_navigated` | `method` (`arrow` / `dot`), `index` | The results carousel under the reel breakdown is moved by its ‹ › arrows or dots (swipes aren't tracked); `index` is the card it moved to |
| `faq_action_clicked` | `question`, `label`, `target` | A link or button inside an FAQ answer: a jump to a section (`#how`, `#inside`, `#guarantee`…), a buy button (`#packs`), the subscription (`#subscribe`), or a genre chip that also picks that aesthetic (`#packs:<pack>`) |

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
| `access_step_completed` | `step`, `step_name`, `action` (`continue` / `skip`) | A setup step is finished or skipped. "Watch the video" only exists when `NEXT_PUBLIC_VSL_URL` is set, so `step` (the position on the page) shifts by one without it — compare steps by `step_name` |
| `discord_join_clicked` | — | "Join Discord" |
| `drive_opened` | `name` | A Google Drive link on /access (`name`: the pack name, `The FanpageKit Guide` or `Editing guides`) |

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

### Meta (Pixel + Conversions API)

Meta gets a small subset of the funnel, as its standard events, for ad attribution and optimisation. PostHog stays
the full record. Mapping lives in `metaEvents` (`lib/analytics/meta.ts`) and the payment trackers in
`lib/analytics/server.ts`.

| Meta event | Sent from | Our event | Data |
| --- | --- | --- | --- |
| `PageView` | Pixel (automatic, incl. client-side navigations) | `$pageview` | — |
| `ViewContent` | Pixel | `pack_selected` | `content_ids: [pack]`, `value: price`, `currency: USD` |
| `InitiateCheckout` | Pixel | `checkout_viewed` | `content_ids: [pack]`, `value` (due today), `currency: USD` |
| `Purchase` | Conversions API (webhook) **and** Pixel (`/upsell`, `/access`) | `order_paid`, `upsell_paid` | `value`, `currency`, `content_ids: packs`; `event_id` = Checkout Session / PaymentIntent id |
| `Subscribe` | Conversions API (webhook) **and** Pixel (`/upsell`, `/access`) | `order_paid` with `plan: monthly` | as `Purchase`; `event_id` = `<session id>:subscribe` |

Purchases are sent twice on purpose: the webhook is the source of truth (ad blockers can't drop it), and the Pixel
copy gives Meta the browser's ad click to attribute it to. Both carry the same `event_id`, so Meta counts each once.
The browser values come from the same builders as the webhook's (`orderPurchase` / `orderSubscribe` /
`upsellPurchase` in `lib/analytics/meta-server.ts`, sent by `<MetaPurchase>` via `metaBrowserPurchases`); keep them
that way or Meta stops deduplicating. A reload doesn't resend (sessionStorage guard).

Matching: the checkout action stores the buyer's `_fbp` / `_fbc` cookies, IP and user agent in the Checkout Session
metadata (`meta_fbp`, `meta_fbc`, `meta_ip`, `meta_ua`). The webhook sends them with what Stripe Checkout collected,
normalised and SHA-256 hashed as Meta requires: email (`em`), first and last name (`fn`, `ln`), city, state, ZIP and
country (`ct`, `st`, `zp`, `country`, when Stripe has them) and the Stripe customer id (`external_id`). Phone isn't
collected at checkout, so it isn't sent. On `/upsell` and `/access` the Pixel gets the same hashed details as
advanced matching. Meta only accepts those at the pixel's first `init`, so on those two paths `startMetaPixel` holds
the pixel back until the page hands them over. Renewals, failures and cancellations are not sent to Meta.

Retries: a Meta send that fails for a reason a retry can fix (network, timeout, 429, 5xx) fails the webhook with a
500, so Stripe redelivers it; events already sent are skipped (below). A 4xx rejection is logged and not retried.

### Once per payment

Stripe redelivers webhooks, and keeps its automatic retries going even after a manual resend succeeded. Every
server-side payment event (`order_paid`, `upsell_paid`, `subscription_renewed`, Meta `Purchase` / `Subscribe`) goes
through `sendEventOnce` (`lib/db.ts`), which claims the key `<destination>:<event>:<stripe ref>` in the Supabase
`analytics_events` table before sending. A redelivery finds the row and skips; a failed send deletes it so a later
retry sends; the payment trackers report a failed send so the webhook returns 500 and Stripe retries. If the claim itself fails (no database), the event is sent anyway. Look up what was sent with
`select * from analytics_events where event_key like '%cs_live_…'`.

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
5. **Payments, subscriptions and refunds** are tracked only on the server, in the webhook, after fulfillment succeeds,
   and through `sendEventOnce` so a redelivered webhook doesn't count them twice.
6. **No secrets or private links in properties**: no Drive URLs, Discord invite, Stripe secrets or card data. Email is
   allowed only as the person identity (`identify`, `$set`).
7. **Naming**: snake_case `object_action`, past tense (`pack_selected`, not `selectPack` or `click_pack`). Reuse an
   existing event with a new property before adding a near-duplicate event.
8. **Meta**: if a changed event is in the Meta mapping above (`pack_selected`, `checkout_viewed`, `order_paid`,
   `upsell_paid`), update `metaEvents` or the server trackers and the Meta table too. Money goes to Meta only from
   the server, like PostHog.
9. Before finishing: `npm run typecheck`, then confirm the new event in PostHog's Activity tab (or in the console with
   `NEXT_PUBLIC_POSTHOG_DEBUG=1`).
