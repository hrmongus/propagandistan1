'use server';

import { DISTINCT_ID_KEY } from '@/lib/analytics/server';
import { parseOrder, type Order } from '@/lib/checkout';
import { paymentSessionParams } from '@/lib/payment';
import { siteUrl } from '@/lib/site';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { subscriptionSessionParams } from '@/lib/subscription';

type Result = { clientSecret: string } | { error: string };

/** `distinctId` is the browser's PostHog id, stored on the order so server-side purchase events join its funnel. */
export async function createCheckoutSession(input: Order, distinctId?: string): Promise<Result> {
  if (!stripeConfigured()) return { error: 'Payments are not configured yet.' };
  // Re-parse so only known packs and options reach Stripe.
  const order = parseOrder({ pack: input?.pack, bundle: input?.bundleUp ? '1' : '0', plan: input?.plan });
  const origin = await siteUrl();
  const params = order.plan === 'monthly' ? subscriptionSessionParams(order, origin) : paymentSessionParams(order, origin);
  const id = typeof distinctId === 'string' ? distinctId.slice(0, 200) : '';
  if (id) {
    params.metadata = { ...params.metadata, [DISTINCT_ID_KEY]: id };
    // Renewals and cancellations only see the subscription's metadata.
    if (params.subscription_data) params.subscription_data.metadata = { ...params.subscription_data.metadata, [DISTINCT_ID_KEY]: id };
  }
  try {
    const session = await stripe().checkout.sessions.create(params);
    if (!session.client_secret) return { error: 'Could not start checkout.' };
    return { clientSecret: session.client_secret };
  } catch (err) {
    console.error('[checkout] session create failed', err);
    return { error: 'Could not start checkout. Please try again.' };
  }
}
