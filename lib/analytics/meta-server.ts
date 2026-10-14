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
  const [c, h] = await Promise.all([cookies(), headers()]);
  const values = {
    [KEYS.fbp]: c.get('_fbp')?.value,
    [KEYS.fbc]: c.get('_fbc')?.value,
    [KEYS.ip]: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip'),
    [KEYS.ua]: h.get('user-agent'),
  };
  // Stripe metadata values are capped at 500 characters.
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v).map(([k, v]) => [k, v!.slice(0, 500)]));
}

const sha256 = (value: string) => createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

type MetaServerEvent = {
  name: 'Purchase' | 'Subscribe';
  /** Unique per payment, so a webhook Stripe retries isn't counted twice (Meta dedupes on name + id). */
  eventId: string;
  value: number;
  currency: string;
  packs: string[];
  email: string | null | undefined;
  /** The original Checkout Session's metadata, holding the buyer's browser details. */
  metadata: Stripe.Metadata | null | undefined;
};

export async function sendMetaEvent(event: MetaServerEvent) {
  if (!metaConfigured()) return;
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
          em: event.email ? [sha256(event.email)] : undefined,
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
    if (!res.ok) console.error('[analytics] Meta event rejected', event.name, res.status, await res.text());
  } catch (err) {
    console.error('[analytics] Meta event failed', event.name, err);
  }
}
