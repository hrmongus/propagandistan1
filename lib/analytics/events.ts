/*
 * The PostHog event catalog: every custom event the app sends, with its properties. Shared by the browser
 * (lib/analytics/client.ts) and the server (lib/analytics/server.ts), so a renamed or removed event is a type error
 * wherever it's still sent. Keep it in sync with docs/analytics.md — see the rules there and in AGENTS.md.
 *
 * Naming: snake_case `object_action`, past tense. Properties are snake_case; prices in whole dollars.
 */

type PackSlug = string;
type Plan = 'once' | 'monthly';

export type ClientEvents = {
  /* landing */
  /** Any "Get the pack" style button that scrolls to #packs. */
  cta_clicked: { location: 'nav' | 'hero' | 'reveal' | 'how_it_works' | 'inside' | 'guarantee' | 'final'; label: string };
  /** A pack's checkout button in the packs grid. */
  pack_selected: { pack: PackSlug; price: number; bundle: boolean };
  faq_toggled: { question: string; open: boolean };

  /* checkout */
  checkout_viewed: { pack: PackSlug; plan: Plan; bundle_up: boolean };
  checkout_bundle_toggled: { pack: PackSlug; enabled: boolean };
  checkout_plan_selected: { pack: PackSlug; plan: Plan };
  checkout_change_pack_clicked: { pack: PackSlug };
  /** The embedded Stripe form couldn't load. */
  checkout_error: { pack: PackSlug; plan: Plan; bundle_up: boolean; error: string };

  /* upsell */
  upsell_viewed: { order_name: string; packs_offered: number; monthly: boolean };
  upsell_accepted: { packs_offered: number; monthly: boolean };
  /** The one-click charge needs the buyer (3-D Secure, no saved card), so the card form opened. */
  upsell_card_required: { packs_offered: number };
  upsell_error: { error: string };
  upsell_declined: { packs_offered: number };

  /* access */
  access_viewed: { order_name: string; monthly: boolean; upsell: boolean };
  access_step_completed: { step: number; step_name: string; action: 'continue' | 'skip' };
  discord_join_clicked: Record<string, never>;
  drive_opened: { name: string };
};

/** Sent from the server, where the payment is the source of truth (Stripe webhook and server actions). */
export type ServerEvents = {
  order_paid: { pack: PackSlug; plan: Plan; bundle_up: boolean; order_name: string; packs: PackSlug[]; amount: number; currency: string };
  upsell_paid: { packs: PackSlug[]; amount: number; currency: string; method: 'one_click' | 'checkout' };
  subscription_renewed: { pack: PackSlug; amount: number; currency: string };
  payment_failed: { amount: number; currency: string; billing_reason: string };
  subscription_cancelled: { pack: PackSlug };
  billing_portal_opened: Record<string, never>;
};

export type ClientEvent = keyof ClientEvents;
export type ServerEvent = keyof ServerEvents;

/**
 * Data attributes that make a plain link or button send `event` when clicked — for server components, which can't
 * attach an onClick. The listener lives in instrumentation-client.ts.
 *
 *   <a href="#packs" {...trackClick('cta_clicked', { location: 'hero', label: 'Get the pack' })}>
 */
export function trackClick<E extends ClientEvent>(event: E, props: ClientEvents[E]) {
  return { 'data-ph-event': event, 'data-ph-props': JSON.stringify(props) };
}
