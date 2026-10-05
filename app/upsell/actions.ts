'use server';

import { redirect } from 'next/navigation';
import { upsellPacks } from '@/lib/checkout';
import { fulfillUpsell } from '@/lib/fulfillment';
import { siteUrl } from '@/lib/site';
import { chargeUpsell, upsellPaid, upsellSessionParams } from '@/lib/payment';
import { paidOrder, stripe } from '@/lib/stripe';

type Result = { clientSecret: string } | { error: string };

/**
 * "Yes, add them": charges the card from the order in one click and forwards to /access. When that card
 * can't be charged without the buyer, returns an embedded Checkout for the upsell instead.
 */
export async function acceptUpsell(sessionId: string): Promise<Result> {
  const { session, order } = await paidOrder(String(sessionId ?? ''));
  if (!order) redirect('/#packs');
  const access = `/access?session_id=${encodeURIComponent(session.id)}`;
  if (!upsellPacks(order).length || (await upsellPaid(session))) redirect(access);

  if (await chargeUpsell(session, order)) {
    try {
      await fulfillUpsell(session.id, 'one-click');
    } catch (err) {
      console.error('[upsell] fulfillment failed', err);
    }
    redirect(access);
  }

  try {
    const checkout = await stripe().checkout.sessions.create(upsellSessionParams(session, order, await siteUrl()));
    if (checkout.client_secret) return { clientSecret: checkout.client_secret };
  } catch (err) {
    console.error('[upsell] checkout create failed', err);
  }
  return { error: 'We couldn’t add this to your order. Your packs are unaffected — continue below.' };
}
