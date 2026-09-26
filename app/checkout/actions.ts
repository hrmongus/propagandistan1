'use server';

import { parseOrder, type Order } from '@/lib/checkout';
import { siteUrl } from '@/lib/site';
import { sessionParams, stripe, stripeConfigured } from '@/lib/stripe';

type Result = { clientSecret: string } | { error: string };

export async function createCheckoutSession(input: Order): Promise<Result> {
  if (!stripeConfigured()) return { error: 'Payments are not configured yet.' };
  // Re-parse so only known packs and options reach Stripe.
  const order = parseOrder({ pack: input?.pack, bundle: input?.bundleUp ? '1' : '0', upsell: input?.upsell });
  try {
    const session = await stripe().checkout.sessions.create(sessionParams(order, await siteUrl()));
    if (!session.client_secret) return { error: 'Could not start checkout.' };
    return { clientSecret: session.client_secret };
  } catch (err) {
    console.error('[checkout] session create failed', err);
    return { error: 'Could not start checkout. Please try again.' };
  }
}
