'use server';

import { redirect } from 'next/navigation';
import { siteUrl } from '@/lib/site';
import { paidOrder, stripe } from '@/lib/stripe';

/** Opens the Stripe customer portal so subscribers can cancel or update their card. */
export async function openBillingPortal(formData: FormData) {
  const sessionId = String(formData.get('session_id') ?? '');
  const { session, order } = await paidOrder(sessionId);
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!order || !customer) redirect('/');
  const portal = await stripe().billingPortal.sessions.create({
    customer,
    return_url: `${await siteUrl()}/access?session_id=${encodeURIComponent(sessionId)}`,
  });
  redirect(portal.url);
}
