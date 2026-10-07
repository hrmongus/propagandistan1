import type Stripe from 'stripe';
import { trackOrderPaid, trackPaymentFailed, trackRenewal, trackSubscriptionCancelled, trackUpsellPaid } from '@/lib/analytics/server';
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

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (session.payment_status === 'unpaid') break;
        if (session.metadata?.kind === 'upsell') await fulfillUpsell(session.metadata.upsell_for ?? '', session.id);
        else {
          await fulfillOrder(session);
          // After fulfillment, so a failed run that Stripe retries isn't counted twice.
          await trackOrderPaid(session);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        // The one-click upsell charge has no Checkout Session. /upsell fulfills it right away; this retries it if that failed.
        const upsellFor = event.data.object.metadata?.upsell_for;
        if (upsellFor) {
          await fulfillUpsell(upsellFor, event.data.object.id);
          // Every upsell (one-click or by card) ends here exactly once; upsell Checkout Sessions aren't counted.
          await trackUpsellPaid(event.data.object);
        }
        break;
      }
      case 'invoice.paid':
        // The first month is fulfilled from checkout.session.completed; this covers every renewal after it.
        if (event.data.object.billing_reason === 'subscription_cycle') {
          await fulfillRenewal(event.data.object);
          await trackRenewal(event.data.object);
        }
        break;
      case 'invoice.payment_failed':
        console.warn('[webhook]', event.type, event.data.object.id);
        await trackPaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.warn('[webhook]', event.type, event.data.object.id);
        await trackSubscriptionCancelled(event.data.object);
        break;
      case 'checkout.session.async_payment_failed':
        console.warn('[webhook]', event.type, event.data.object.id);
        break;
    }
  } catch (err) {
    // 500 makes Stripe retry. The signature is already verified, so the reason is safe to show in the dashboard.
    console.error('[webhook] fulfillment failed', event.type, event.id, err);
    return new Response(`Fulfillment failed: ${(err as Error).message}`, { status: 500 });
  }

  return Response.json({ received: true });
}
