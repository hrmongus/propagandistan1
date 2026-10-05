import type Stripe from 'stripe';
import { checkoutModel, deliverables } from './checkout';
import { sendPackLinks } from './email';
import { orderFromMetadata, paidOrder } from './stripe';

/**
 * Runs once Stripe confirms payment (from the webhook). Stripe retries webhooks, so anything added here
 * must be idempotent — key it on session.id.
 *
 * Every buyer gets the links for this order on /access; this is the place to add them to a mailing list or
 * decrement pack stock.
 */
export async function fulfillOrder(session: Stripe.Checkout.Session) {
  const order = orderFromMetadata(session.metadata);
  const { orderName, monthly } = checkoutModel(order);
  const email = session.customer_details?.email;
  console.info('[fulfillment] paid', { session: session.id, email, order: orderName, monthly, amount: session.amount_total });
}

/**
 * Runs once the post-purchase upsell is paid — from the one-click charge, or from the webhook when the buyer
 * paid through the fallback Checkout. Subscribers get the extra packs by email.
 */
export async function fulfillUpsell(orderSessionId: string, paymentId: string) {
  const { session, order } = await paidOrder(orderSessionId);
  if (!order) return;
  const email = session.customer_details?.email;
  console.info('[fulfillment] upsell paid', { session: session.id, payment: paymentId, email });

  const { emailed } = deliverables(order, true);
  if (email && emailed.length) await sendPackLinks(email, emailed, `upsell-${orderSessionId}`);
}

/**
 * Runs on every monthly renewal the subscription pays for (not the first month — that's fulfillOrder).
 * This is where next month's pack goes out; for now it's logged.
 */
export async function fulfillRenewal(invoice: Stripe.Invoice) {
  const details = invoice.parent?.subscription_details;
  const order = orderFromMetadata(details?.metadata);
  console.info('[fulfillment] renewal paid', {
    invoice: invoice.id,
    subscription: typeof details?.subscription === 'string' ? details.subscription : details?.subscription?.id,
    email: invoice.customer_email,
    plan: checkoutModel(order).orderName,
    amount: invoice.amount_paid,
  });
}
