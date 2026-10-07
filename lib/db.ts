import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/*
 * Supabase (Postgres) for buyers, transactions and purchased packs — see supabase/migrations. Server-only: it
 * uses the secret key, which bypasses RLS, so never import this from a client component.
 *
 * Without SUPABASE_URL / SUPABASE_SECRET_KEY purchases are only logged in development; in production it throws,
 * so the Stripe webhook answers 500 and retries until it's configured.
 */

let client: SupabaseClient<Database> | null = null;

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') throw new Error('[db] SUPABASE_URL / SUPABASE_SECRET_KEY not set — purchase not recorded');
    return null;
  }
  client ??= createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export type Purchase = {
  kind: 'order' | 'upsell' | 'renewal';
  /** Idempotency key: the Checkout Session (order), PaymentIntent (upsell) or Invoice (renewal) id. */
  stripeRef: string;
  email: string;
  name?: string | null;
  customerId?: string | null;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  plan?: 'once' | 'monthly' | null;
  description: string;
  amountCents: number;
  currency: string;
  /** Unix seconds, as Stripe gives it. */
  paidAt?: number | null;
  /** Pack slugs this payment unlocked (never 'bundle' — the four packs individually). */
  packs: string[];
};

/** Upserts the buyer and records the payment and its packs, once per stripeRef. Returns the transaction id. */
export async function recordPurchase(p: Purchase) {
  const supabase = db();
  if (!supabase) {
    console.warn('[db] SUPABASE_URL / SUPABASE_SECRET_KEY not set — not recorded:', p.kind, p.stripeRef);
    return null;
  }
  // Optional fields left undefined are omitted, so the function defaults them to null.
  const { data, error } = await supabase.rpc('record_purchase', {
    p_email: p.email,
    p_name: p.name ?? undefined,
    p_stripe_customer_id: p.customerId ?? undefined,
    p_kind: p.kind,
    p_stripe_ref: p.stripeRef,
    p_checkout_session_id: p.checkoutSessionId ?? undefined,
    p_payment_intent_id: p.paymentIntentId ?? undefined,
    p_invoice_id: p.invoiceId ?? undefined,
    p_subscription_id: p.subscriptionId ?? undefined,
    p_plan: p.plan ?? undefined,
    p_description: p.description,
    p_amount_cents: p.amountCents,
    p_currency: p.currency,
    p_paid_at: p.paidAt ? new Date(p.paidAt * 1000).toISOString() : undefined,
    p_packs: p.packs,
  });
  if (error) throw new Error(`[db] record_purchase failed for ${p.stripeRef}: ${error.message}`);
  console.info('[db] recorded', p.kind, p.stripeRef, '→', data);
  return data;
}
