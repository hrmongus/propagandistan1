import Stripe from 'stripe';
import { checkoutModel, parseOrder, type Order } from './checkout';

/* Server-only Stripe helpers. Never import this from a client component. */

let client: Stripe | null = null;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  client ??= new Stripe(key, { appInfo: { name: 'FanpageKit' } });
  return client;
}

/** Midnight UTC on the 1st of next month — when monthly packs renew. */
function firstOfNextMonth(now = new Date()) {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000);
}

const cents = (dollars: number) => dollars * 100;

/**
 * Builds the Checkout Session parameters for an order. Prices come from the server-side order model only,
 * never from the browser.
 */
export function sessionParams(order: Order, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const m = checkoutModel(order);
  const metadata = { pack: m.sel.slug, bundle: m.isBundleOrder && !m.sel.bundle ? '1' : '0', upsell: order.upsell };

  const oneTime: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: cents(m.dueToday),
      product_data: {
        name: m.isBundleOrder ? 'FanpageKit — All four packs' : `FanpageKit — ${m.sel.name}`,
        description: m.isBundleOrder
          ? '120 finished videos, 448 raw clips, editing guides and the posting playbook.'
          : '30 finished videos, 112 raw clips, editing guides and the posting playbook.',
      },
    },
  };

  const base = {
    ui_mode: 'embedded_page',
    return_url: `${siteUrl}/access?session_id={CHECKOUT_SESSION_ID}`,
    metadata,
    allow_promotion_codes: true,
  } satisfies Partial<Stripe.Checkout.SessionCreateParams>;

  if (!m.monthly) {
    return {
      ...base,
      mode: 'payment',
      line_items: [oneTime],
      customer_creation: 'always',
      invoice_creation: { enabled: true, invoice_data: { metadata } },
      payment_intent_data: { metadata },
    };
  }

  // Pay for this order today; the monthly plan starts on the 1st with no proration for the partial month.
  return {
    ...base,
    mode: 'subscription',
    line_items: [
      oneTime,
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cents(m.monthlyPrice),
          recurring: { interval: 'month' },
          product_data: {
            name: m.isBundleOrder ? 'FanpageKit — All four packs, every month' : 'FanpageKit — A new pack every month',
          },
        },
      },
    ],
    subscription_data: {
      billing_cycle_anchor: firstOfNextMonth(),
      proration_behavior: 'none',
      metadata,
    },
  };
}

/** Reads a completed Checkout Session back into the order it paid for, or null if it isn't paid. */
export async function paidOrder(sessionId: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.status !== 'complete' || session.payment_status === 'unpaid') return { session, order: null };
  return {
    session,
    order: parseOrder({ pack: session.metadata?.pack, bundle: session.metadata?.bundle, upsell: session.metadata?.upsell }),
  };
}
