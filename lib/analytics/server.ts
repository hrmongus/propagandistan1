import { PostHog } from 'posthog-node';
import type Stripe from 'stripe';
import { checkoutModel, orderPacks, upsellPacks } from '../checkout';
import { idOf, orderFromMetadata, paidOrder, stripe } from '../stripe';
import type { ServerEvent, ServerEvents } from './events';

/*
 * Server-side PostHog, for events whose truth is on the server: payments (from the Stripe webhook) and the billing
 * portal. Server-only — never import from a client component. Without NEXT_PUBLIC_POSTHOG_KEY every call is a no-op,
 * and a PostHog failure is logged, never thrown, so analytics can't fail a webhook or a page.
 *
 * Events go to the browser's PostHog id when checkout recorded one (`ph_distinct_id` in the Stripe metadata),
 * else to the buyer's email. /access identifies the browser by that email, so both end up on one person.
 */

let client: PostHog | null = null;

function posthog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  // Serverless: send each event right away instead of batching in memory that may be frozen after the response.
  client ??= new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com', flushAt: 1, flushInterval: 0 });
  return client;
}

export async function captureServer<E extends ServerEvent>(
  distinctId: string | null | undefined,
  event: E,
  props: ServerEvents[E],
  person?: Record<string, unknown>,
) {
  const ph = posthog();
  if (!ph || !distinctId) return;
  try {
    await ph.captureImmediate({ distinctId, event, properties: { ...props, ...(person && { $set: person }) } });
  } catch (err) {
    console.error('[analytics] capture failed', event, err);
  }
}

/** Stripe metadata key holding the buyer's PostHog id (set by the checkout action). */
export const DISTINCT_ID_KEY = 'ph_distinct_id';

const personOf = (metadata: Stripe.Metadata | null | undefined, email: string | null | undefined) =>
  metadata?.[DISTINCT_ID_KEY] || email || null;

/** Wraps a tracker so a Stripe lookup it needs can't throw into the webhook either. */
const safe = <A extends unknown[]>(name: string, fn: (...args: A) => Promise<void>) => async (...args: A) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error(`[analytics] ${name} failed`, err);
  }
};

const dollars = (cents: number | null | undefined) => (cents ?? 0) / 100;

/* ---------- payment events, called from the Stripe webhook once fulfillment succeeded ---------- */

export const trackOrderPaid = safe('trackOrderPaid', async (session: Stripe.Checkout.Session) => {
  const order = orderFromMetadata(session.metadata);
  const m = checkoutModel(order);
  const email = session.customer_details?.email;
  await captureServer(personOf(session.metadata, email), 'order_paid', {
    pack: m.sel.slug,
    plan: order.plan,
    bundle_up: m.bundleUp,
    order_name: m.orderName,
    packs: orderPacks(order),
    amount: dollars(session.amount_total),
    currency: session.currency ?? 'usd',
  }, { email, name: session.customer_details?.name, plan: order.plan });
});

/** Both upsell routes (one-click and the fallback Checkout) end in one succeeded PaymentIntent, so this runs once. */
export const trackUpsellPaid = safe('trackUpsellPaid', async (pi: Stripe.PaymentIntent) => {
  const { session, order } = await paidOrder(pi.metadata.upsell_for ?? '');
  if (!order) return;
  await captureServer(personOf(session.metadata, session.customer_details?.email), 'upsell_paid', {
    packs: upsellPacks(order).map((p) => p.slug),
    amount: dollars(pi.amount_received),
    currency: pi.currency,
    method: pi.metadata.kind === 'upsell' ? 'checkout' : 'one_click',
  });
});

export const trackRenewal = safe('trackRenewal', async (invoice: Stripe.Invoice) => {
  const metadata = invoice.parent?.subscription_details?.metadata;
  await captureServer(personOf(metadata, invoice.customer_email), 'subscription_renewed', {
    pack: orderFromMetadata(metadata).pack,
    amount: dollars(invoice.amount_paid),
    currency: invoice.currency,
  });
});

export const trackPaymentFailed = safe('trackPaymentFailed', async (invoice: Stripe.Invoice) => {
  await captureServer(personOf(invoice.parent?.subscription_details?.metadata, invoice.customer_email), 'payment_failed', {
    amount: dollars(invoice.amount_due),
    currency: invoice.currency,
    billing_reason: invoice.billing_reason ?? 'unknown',
  });
});

export const trackSubscriptionCancelled = safe('trackSubscriptionCancelled', async (sub: Stripe.Subscription) => {
  let email: string | null = null;
  if (!sub.metadata?.[DISTINCT_ID_KEY]) {
    const customer = await stripe().customers.retrieve(idOf(sub.customer) ?? '').catch(() => null);
    email = customer && !customer.deleted ? customer.email : null;
  }
  await captureServer(personOf(sub.metadata, email), 'subscription_cancelled', { pack: orderFromMetadata(sub.metadata).pack });
});
