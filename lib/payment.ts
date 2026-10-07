import type Stripe from 'stripe';
import { checkoutModel, UPSELL_PRICE, upsellPacks, type Order } from './checkout';
import { cents, checkoutBase, customerOf, idOf, orderMetadata, stripe } from './stripe';

/* One-time payments: single packs and the bundle, plus the post-purchase upsell. Nothing here renews. */

export function paymentSessionParams(order: Order, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const m = checkoutModel(order);
  const metadata = orderMetadata(order);
  return {
    ...checkoutBase(order, siteUrl),
    mode: 'payment',
    line_items: [{
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
    }],
    customer_creation: 'always',
    invoice_creation: { enabled: true, invoice_data: { metadata } },
    // Keep the card on the customer so the post-purchase upsell is one click.
    payment_intent_data: { metadata, setup_future_usage: 'off_session' },
  };
}

/* ---------- post-purchase upsell (a one-time payment for either plan) ---------- */

/** The paid upsell PaymentIntent for this order's Checkout Session (one-click or by card), if any. */
export async function upsellIntent(session: Stripe.Checkout.Session) {
  const customer = customerOf(session);
  if (!customer) return undefined;
  const intents = await stripe().paymentIntents.list({ customer, limit: 20 });
  return intents.data.find((pi) => pi.metadata?.upsell_for === session.id && pi.status === 'succeeded');
}

/** True once the upsell for this order's Checkout Session has been paid. */
export async function upsellPaid(session: Stripe.Checkout.Session) {
  return Boolean(await upsellIntent(session));
}

/** The card the buyer just paid with: saved for off-session use, or the subscription's default. */
async function savedPaymentMethod(session: Stripe.Checkout.Session) {
  if (session.mode === 'subscription') {
    const sub = idOf(session.subscription);
    return sub ? idOf((await stripe().subscriptions.retrieve(sub)).default_payment_method) : null;
  }
  const pi = idOf(session.payment_intent);
  return pi ? idOf((await stripe().paymentIntents.retrieve(pi)).payment_method) : null;
}

function upsellDescription(order: Order) {
  return `FanpageKit — ${upsellPacks(order).map((p) => p.name).join(', ')}`;
}

/**
 * Charges the upsell to the saved card. Resolves true when paid; false when the card can't be charged
 * without the buyer (3-D Secure, no saved card, decline) and they need to pay through Checkout instead.
 */
export async function chargeUpsell(session: Stripe.Checkout.Session, order: Order) {
  const customer = customerOf(session);
  const paymentMethod = customer ? await savedPaymentMethod(session) : null;
  if (!customer || !paymentMethod) return false;
  try {
    const pi = await stripe().paymentIntents.create(
      {
        amount: cents(UPSELL_PRICE),
        currency: 'usd',
        customer,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: upsellDescription(order),
        metadata: { upsell_for: session.id },
      },
      // A double click must not charge twice.
      { idempotencyKey: `upsell-${session.id}` },
    );
    return pi.status === 'succeeded';
  } catch (err) {
    console.warn('[upsell] one-click charge failed, falling back to checkout', (err as Error).message);
    return false;
  }
}

/** Embedded Checkout for the upsell, used when the one-click charge can't go through. */
export function upsellSessionParams(session: Stripe.Checkout.Session, order: Order, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  const metadata = { kind: 'upsell', upsell_for: session.id };
  return {
    ui_mode: 'embedded_page',
    mode: 'payment',
    customer: customerOf(session) ?? undefined,
    line_items: [{
      quantity: 1,
      price_data: { currency: 'usd', unit_amount: cents(UPSELL_PRICE), product_data: { name: upsellDescription(order) } },
    }],
    metadata,
    payment_intent_data: { metadata },
    return_url: `${siteUrl}/access?session_id=${encodeURIComponent(session.id)}`,
  };
}
