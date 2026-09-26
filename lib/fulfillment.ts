import type Stripe from 'stripe';
import { checkoutModel, parseOrder } from './checkout';

/**
 * Runs once Stripe confirms payment (from the webhook). Stripe retries webhooks, so anything added here
 * must be idempotent — key it on session.id.
 *
 * The buyer already sees their links on /access; this is the place to email them the Drive link,
 * add them to a mailing list, or decrement pack stock.
 */
export async function fulfillOrder(session: Stripe.Checkout.Session) {
  const order = parseOrder({ pack: session.metadata?.pack, bundle: session.metadata?.bundle, upsell: session.metadata?.upsell });
  const { orderName, monthly } = checkoutModel(order);
  console.info('[fulfillment] paid', {
    session: session.id,
    email: session.customer_details?.email,
    order: orderName,
    monthly,
    amount: session.amount_total,
  });
}
