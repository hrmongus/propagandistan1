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
  cta_clicked: { location: 'nav' | 'hero' | 'reveal' | 'how_it_works' | 'final'; label: string };
  /** A checkout button in the packs section: the selected pack, the bundle, or the monthly subscription (`plan`). */
  pack_selected: { pack: PackSlug; price: number; bundle: boolean; plan: Plan };
  /** The pack card switches aesthetic: a swatch, the ‹ › arrows on the preview, or a swipe across it. */
  aesthetic_selected: { pack: PackSlug; method: 'swatch' | 'arrow' | 'swipe' };
  faq_toggled: { question: string; open: boolean };
  /** The results carousel moved by its arrows or dots (swipes aren't tracked). `index` is the card it moved to. */
  reviews_navigated: { method: 'arrow' | 'dot'; index: number };
  /** A link or button inside an FAQ answer. `target` is the in-page anchor, plus `:<pack>` for a genre chip that picks an aesthetic. */
  faq_action_clicked: { question: string; label: string; target: string };

  /* checkout */
  checkout_viewed: { pack: PackSlug; plan: Plan; bundle_up: boolean };
  checkout_bundle_toggled: { pack: PackSlug; enabled: boolean };
  checkout_change_pack_clicked: { pack: PackSlug };
  /** The embedded Stripe form couldn't load. */
  checkout_error: { pack: PackSlug; plan: Plan; bundle_up: boolean; error: string };

  /* upsell */
  upsell_viewed: { order_name: string; packs_offered: number; monthly: boolean };
  /** `cta`: the offer's own button, or the bar that stays on screen while it's scrolled away. */
  upsell_accepted: { packs_offered: number; monthly: boolean; cta: 'offer' | 'sticky' };
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
