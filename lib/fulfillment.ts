import type Stripe from 'stripe';
import { checkoutModel, deliverables } from './checkout';
import { sendOrderEmail, sendUpsellEmail } from './email';
import { upsellIntent } from './payment';
import { siteUrl } from './site';
import { idOf, orderFromMetadata, paidOrder, stripe } from './stripe';

const setupUrl = async (sessionId: string) => `${await siteUrl()}/access?session_id=${encodeURIComponent(sessionId)}`;

/*
 * Each email goes out once per purchase, however often Stripe redelivers the event or the buyer reloads.
 * Two guards: a permanent `emailed_at` stamp in the purchase's Stripe metadata (PaymentIntent or
 * Subscription), checked before sending; and Resend's idempotency key, which covers two deliveries racing
 * past that check within 24 hours.
 */
type Purchase = { kind: 'payment_intent' | 'subscription'; id: string };

async function sendOnce(purchase: Purchase | null, label: string, deliver: () => Promise<boolean>) {
  const api = purchase?.kind === 'subscription' ? stripe().subscriptions : stripe().paymentIntents;
  if (purchase) {
    const { metadata } = await api.retrieve(purchase.id);
    if (metadata?.emailed_at) return console.info(`[fulfillment] ${label} email already sent`, purchase.id, metadata.emailed_at);
  } else {
    // e.g. a $0 order through a 100% promo code has no PaymentIntent; only the idempotency key guards it.
    console.warn(`[fulfillment] ${label}: no PaymentIntent or Subscription to stamp`);
  }
  // Stamp only real sends, so an email skipped for missing Resend config still goes out on a later retry.
  if ((await deliver()) && purchase) await api.update(purchase.id, { metadata: { emailed_at: new Date().toISOString() } });
}

function orderPurchase(session: Stripe.Checkout.Session): Purchase | null {
  const sub = idOf(session.subscription);
  if (sub) return { kind: 'subscription', id: sub };
  const pi = idOf(session.payment_intent);
  return pi ? { kind: 'payment_intent', id: pi } : null;
}

/**
 * Runs once Stripe confirms payment (from the webhook). Stripe retries webhooks, so anything added here
 * must be idempotent — key it on session.id, or go through sendOnce.
 *
 * Every buyer gets the links for this order on /access and by email. A failed send throws, so the webhook
 * answers 500 and Stripe retries it. This is also the place to add them to a mailing list or decrement pack stock.
 */
export async function fulfillOrder(session: Stripe.Checkout.Session) {
  const order = orderFromMetadata(session.metadata);
  const { orderName, monthly, total } = checkoutModel(order);
  const email = session.customer_details?.email;
  console.info('[fulfillment] paid', { session: session.id, email, order: orderName, monthly, amount: session.amount_total });

  if (!email) return console.error('[fulfillment] no email on session', session.id);
  const { shown } = deliverables(order, false);
  const url = await setupUrl(session.id);
  await sendOnce(orderPurchase(session), 'order', () =>
    sendOrderEmail({ to: email, idempotencyKey: `order-${session.id}`, orderName, slugs: shown, monthly, total, setupUrl: url }),
  );
}

/**
 * Runs once the post-purchase upsell is paid — from the one-click charge, or from the webhook when the buyer
 * paid through the fallback Checkout. Emails whatever it unlocked: the four-pack folder for one-off buyers,
 * the other three packs for subscribers.
 */
export async function fulfillUpsell(orderSessionId: string, paymentId: string) {
  const { session, order } = await paidOrder(orderSessionId);
  if (!order) return;
  const email = session.customer_details?.email;
  console.info('[fulfillment] upsell paid', { session: session.id, payment: paymentId, email });

  if (!email) return console.error('[fulfillment] no email on session', session.id);
  const before = deliverables(order, false).shown;
  const after = deliverables(order, true);
  const unlocked = [...after.shown, ...after.emailed].filter((slug) => !before.includes(slug));
  if (!unlocked.length) return;
  const pi = await upsellIntent(session);
  const url = await setupUrl(session.id);
  await sendOnce(pi ? { kind: 'payment_intent', id: pi.id } : null, 'upsell', () =>
    sendUpsellEmail({ to: email, idempotencyKey: `upsell-${orderSessionId}`, slugs: unlocked, setupUrl: url }),
  );
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
