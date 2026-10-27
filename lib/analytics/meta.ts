import { checkoutModel } from '../checkout';
import type { ClientEvent, ClientEvents } from './events';

/*
 * Meta Pixel in the browser. Loaded by instrumentation-client.ts when NEXT_PUBLIC_META_PIXEL_ID is set; every call
 * here is a no-op until then. The pixel sends PageView itself, on load and on every client-side navigation (it
 * listens to history.pushState). Purchases come from the Stripe webhook through the Conversions API
 * (lib/analytics/meta-server.ts), where the payment is the source of truth; /upsell and /access repeat them here
 * with the same event ids (trackMetaPurchases), so Meta sees the browser's ad click and still counts each once.
 */

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[][]; push?: unknown; loaded?: boolean; version?: string };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    /** Pixel id held back on a purchase page until it renders the buyer's details (startMetaPixel). */
    fkMetaPixelPending?: string;
  }
}

/**
 * Pages that send the purchase from the browser (trackMetaPurchases). Advanced matching only counts when passed to
 * the pixel's first init, so on these the pixel waits for the page to hand over the buyer's details.
 */
const PURCHASE_PATHS = ['/upsell', '/access'];

/** Called once by instrumentation-client.ts: loads the pixel now, or holds it for the purchase page. */
export function startMetaPixel(pixelId: string) {
  if (PURCHASE_PATHS.includes(location.pathname)) window.fkMetaPixelPending = pixelId;
  else loadMetaPixel(pixelId);
}

/** Meta's base code (the snippet from Events Manager), minus the noscript fallback: the site needs JS anyway. */
function loadMetaPixel(pixelId: string, match?: Record<string, string>) {
  if (window.fbq) return;
  const fbq: Fbq = (...args) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', pixelId, match);
  fbq('track', 'PageView');
}

type MetaEvent = [name: string, params: Record<string, unknown>];

/** Our funnel events that Meta's ads can optimise for, as Meta standard events. Anything not listed stays in PostHog only. */
const metaEvents: { [E in ClientEvent]?: (props: ClientEvents[E]) => MetaEvent } = {
  pack_selected: (p) => ['ViewContent', { content_ids: [p.pack], content_type: 'product', value: p.price, currency: 'USD' }],
  checkout_viewed: (p) => ['InitiateCheckout', {
    content_ids: [p.pack],
    content_type: 'product',
    num_items: 1,
    value: checkoutModel({ pack: p.pack, plan: p.plan, bundleUp: p.bundle_up }).dueToday,
    currency: 'USD',
  }],
};

/** Called by track() for every client event; sends the Meta equivalent when there is one. */
export function trackMeta<E extends ClientEvent>(event: E, props: ClientEvents[E]) {
  const toMeta = metaEvents[event] as ((props: ClientEvents[E]) => MetaEvent) | undefined;
  if (!toMeta || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', ...toMeta(props));
}

/** A paid Purchase or Subscribe, as built by metaBrowserPurchases (lib/analytics/meta-server.ts). */
export type MetaPurchase = { name: 'Purchase' | 'Subscribe'; eventId: string; value: number; currency: string; packs: string[] };

/**
 * Sends the order's paid events from the browser, deduplicated by Meta against the webhook's through the event id,
 * and here against reloads. `match` (hashed email, name, address, customer id) is the pixel's advanced matching:
 * it loads here when startMetaPixel held it back. Arriving from /upsell, it is already loaded with the same buyer.
 */
export function trackMetaPurchases(events: MetaPurchase[], match: Record<string, string>) {
  if (typeof window === 'undefined') return;
  if (!window.fbq && window.fkMetaPixelPending) loadMetaPixel(window.fkMetaPixelPending, match);
  if (!window.fbq) return;
  for (const e of events) {
    const key = `fk_meta_${e.name}_${e.eventId}`;
    try {
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, '1');
    } catch {
      // no storage: Meta's own dedup by event id still applies
    }
    window.fbq(
      'track',
      e.name,
      { value: e.value, currency: e.currency.toUpperCase(), content_ids: e.packs, content_type: 'product', num_items: e.packs.length },
      { eventID: e.eventId },
    );
  }
}
