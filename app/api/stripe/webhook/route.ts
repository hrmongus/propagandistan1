import type Stripe from 'stripe';
import { fulfillOrder, fulfillRenewal, fulfillUpsell } from '@/lib/fulfillment';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) return new Response('Webhook not configured', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      if (session.payment_status === 'unpaid') break;
      if (session.metadata?.kind === 'upsell') await fulfillUpsell(session.metadata.upsell_for ?? '', session.id);
      else await fulfillOrder(session);
      break;
    }
    case 'invoice.paid':
      // The first month is fulfilled from checkout.session.completed; this covers every renewal after it.
      if (event.data.object.billing_reason === 'subscription_cycle') await fulfillRenewal(event.data.object);
      break;
    case 'checkout.session.async_payment_failed':
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      console.warn('[webhook]', event.type, event.data.object.id);
      break;
  }

  return Response.json({ received: true });
}
