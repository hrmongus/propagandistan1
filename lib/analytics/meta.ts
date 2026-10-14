import type { ClientEvent, ClientEvents } from './events';

/*
 * Meta Pixel in the browser. Loaded by instrumentation-client.ts when NEXT_PUBLIC_META_PIXEL_ID is set; every call
 * here is a no-op until then. The pixel sends PageView itself, on load and on every client-side navigation (it
 * listens to history.pushState). Purchases are not sent from here: the Stripe webhook sends them through the
 * Conversions API (lib/analytics/meta-server.ts), where the payment is the source of truth.
 */

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[][]; push?: unknown; loaded?: boolean; version?: string };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Meta's base code (the snippet from Events Manager), minus the noscript fallback: the site needs JS anyway. */
export function loadMetaPixel(pixelId: string) {
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

  fbq('init', pixelId);
  fbq('track', 'PageView');
}

type MetaEvent = [name: string, params: Record<string, unknown>];

/** Our funnel events that Meta's ads can optimise for, as Meta standard events. Anything not listed stays in PostHog only. */
const metaEvents: { [E in ClientEvent]?: (props: ClientEvents[E]) => MetaEvent } = {
  pack_selected: (p) => ['ViewContent', { content_ids: [p.pack], content_type: 'product', value: p.price, currency: 'USD' }],
  checkout_viewed: (p) => ['InitiateCheckout', { content_ids: [p.pack], content_type: 'product', num_items: 1 }],
};

/** Called by track() for every client event; sends the Meta equivalent when there is one. */
export function trackMeta<E extends ClientEvent>(event: E, props: ClientEvents[E]) {
  const toMeta = metaEvents[event] as ((props: ClientEvents[E]) => MetaEvent) | undefined;
  if (!toMeta || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', ...toMeta(props));
}
