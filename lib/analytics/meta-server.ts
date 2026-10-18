import { createHash } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import type Stripe from 'stripe';

/*
 * Meta Conversions API: purchases sent from the server (the Stripe webhook), so ad blockers and browser privacy
 * features can't drop them. Server-only. Without NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN every call is
 * a no-op, and a failure is logged, never thrown, so Meta can't fail a webhook.
 *
 * Meta matches a server event to the ad click through the browser's _fbp/_fbc cookies, IP and user agent. The
 * webhook has none of those, so the checkout action records them in the Checkout Session metadata (metaCheckoutMetadata).
 */

const GRAPH_API = 'https://graph.facebook.com/v24.0';

const pixelId = () => process.env.NEXT_PUBLIC_META_PIXEL_ID;
const accessToken = () => process.env.META_CAPI_ACCESS_TOKEN;
export const metaConfigured = () => Boolean(pixelId() && accessToken());

/** Stripe metadata keys holding the buyer's browser details at checkout. */
const KEYS = { fbp: 'meta_fbp', fbc: 'meta_fbc', ip: 'meta_ip', ua: 'meta_ua' } as const;

/** The buyer's Meta cookies, IP and user agent, read in the checkout server action, for the Checkout Session metadata. */
export async function metaCheckoutMetadata(): Promise<Record<string, string>> {
  if (!metaConfigured()) return {};
  // Checkout must never fail for analytics: without these, Meta just matches the purchase less well.
  const [c, h] = await Promise.all([cookies(), headers()]).catch(() => [null, null] as const);
  if (!c || !h) return {};
  const values = {
    [KEYS.fbp]: c.get('_fbp')?.value,
    [KEYS.fbc]: c.get('_fbc')?.value,
    [KEYS.ip]: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip'),
    [KEYS.ua]: h.get('user-agent'),
  };
  // Stripe metadata values are capped at 500 characters.
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v).map(([k, v]) => [k, v!.slice(0, 500)]));
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/* Meta's normalisation before hashing: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters */
const lower = (v: string | null | undefined) => v?.trim().toLowerCase() || undefined;
/** Names, city, state: lowercase letters only, no spaces or punctuation (accented letters kept). */
const letters = (v: string | null | undefined) => lower(v)?.replace(/[^\p{L}]/gu, '') || undefined;
const hashed = (v: string | undefined) => (v ? [sha256(v)] : undefined);

/** Hashed customer details for Meta's user_data, from what Stripe Checkout collected. */
function customerData(customer: Stripe.Checkout.Session.CustomerDetails | null | undefined, customerId: string | null | undefined) {
  // Words that are letters after cleaning, so "😀 Ann 2 Lee" gives fn ann, ln lee.
  const parts = (customer?.name?.split(/\s+/) ?? []).map(letters).filter(Boolean);
  const address = customer?.address;
  const country = lower(address?.country);
  // US ZIPs as their first five digits; elsewhere lowercase without spaces or dashes.
  const zip = lower(address?.postal_code)?.replace(/[\s-]/g, '');
  return {
    em: hashed(lower(customer?.email)),
    fn: hashed(parts[0]),
    // A single-word name is only a first name.
    ln: hashed(parts.length > 1 ? parts.at(-1) : undefined),
    ct: hashed(letters(address?.city)),
    st: hashed(letters(address?.state)),
    zp: hashed(country === 'us' ? zip?.slice(0, 5) : zip),
    country: hashed(country),
    external_id: hashed(customerId ?? undefined),
  };
}

type MetaServerEvent = {
  name: 'Purchase' | 'Subscribe';
  /** Unique per payment: the key sendEventOnce guards, and Meta's own dedup id. */
  eventId: string;
  value: number;
  currency: string;
  packs: string[];
  /** What the buyer entered at checkout: email, name and billing address. */
  customer: Stripe.Checkout.Session.CustomerDetails | null | undefined;
  /** The Stripe customer, sent as external_id so the order and its upsell match the same person. */
  customerId: string | null | undefined;
  /** The original Checkout Session's metadata, holding the buyer's browser details. */
  metadata: Stripe.Metadata | null | undefined;
};

/**
 * Sends one event; resolves to whether Meta accepted it (true when Meta isn't configured, so nothing is retried).
 * Call it through sendEventOnce (lib/db.ts) so a redelivered webhook doesn't send it twice.
 */
export async function sendMetaEvent(event: MetaServerEvent): Promise<boolean> {
  if (!metaConfigured()) return true;
  const m = event.metadata ?? {};
  const body = {
    data: [
      {
        event_name: event.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: 'website',
        event_source_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/checkout`,
        user_data: {
          ...customerData(event.customer, event.customerId),
          fbp: m[KEYS.fbp] || undefined,
          fbc: m[KEYS.fbc] || undefined,
          client_ip_address: m[KEYS.ip] || undefined,
          client_user_agent: m[KEYS.ua] || undefined,
        },
        custom_data: {
          value: event.value,
          currency: event.currency.toUpperCase(),
          content_ids: event.packs,
          content_type: 'product',
          num_items: event.packs.length,
        },
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
    access_token: accessToken(),
  };
  try {
    const res = await fetch(`${GRAPH_API}/${pixelId()}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error('[analytics] Meta event rejected', event.name, event.eventId, res.status, await res.text());
      return false;
    }
    console.info('[analytics] Meta event sent', event.name, event.eventId, await res.text());
    return true;
  } catch (err) {
    console.error('[analytics] Meta event failed', event.name, event.eventId, err);
    return false;
  }
}
