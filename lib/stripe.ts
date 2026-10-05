import Stripe from 'stripe';
import { checkoutModel, parseOrder, type Order } from './checkout';

/*
 * Server-only Stripe helpers shared by one-time payments (lib/payment.ts) and subscriptions
 * (lib/subscription.ts). Never import these from a client component.
 */

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

export const cents = (dollars: number) => dollars * 100;

export const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id ?? null);

export const customerOf = (session: Stripe.Checkout.Session) => idOf(session.customer);

/** The order as stored on Checkout Sessions, PaymentIntents and Subscriptions. */
export function orderMetadata(order: Order) {
  const m = checkoutModel(order);
  return { pack: m.sel.slug, bundle: m.bundleUp ? '1' : '0', plan: order.plan };
}

export function orderFromMetadata(metadata: Stripe.Metadata | null | undefined) {
  return parseOrder({ pack: metadata?.pack, bundle: metadata?.bundle, plan: metadata?.plan });
}

/** What every order's Checkout Session shares, whichever plan it is. */
export function checkoutBase(order: Order, siteUrl: string) {
  return {
    ui_mode: 'embedded_page',
    // Paid → the one-click upsell, which forwards to /access.
    return_url: `${siteUrl}/upsell?session_id={CHECKOUT_SESSION_ID}`,
    metadata: orderMetadata(order),
    allow_promotion_codes: true,
  } satisfies Partial<Stripe.Checkout.SessionCreateParams>;
}

/** Reads a completed Checkout Session back into the order it paid for, or null if it isn't paid. */
export async function paidOrder(sessionId: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  // Upsell sessions are add-ons, never an order on their own.
  if (session.status !== 'complete' || session.payment_status === 'unpaid' || session.metadata?.kind === 'upsell') {
    return { session, order: null };
  }
  return { session, order: orderFromMetadata(session.metadata) };
}
