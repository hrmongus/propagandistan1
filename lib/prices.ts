/*
 * Every price on the site, in whole dollars. Change a number here and the landing page, checkout, upsell, emails and
 * the Stripe charges all follow; nothing else in the code holds a price.
 */

export const PRICES = {
  /** One pack, paid once. */
  pack: 37,
  /** The single pack's list price, shown struck through next to `pack` (display only: the charge is always `pack`). */
  packWas: 57,
  /** All four packs, paid once. */
  bundle: 97,
  /** The monthly plan. Must match the Stripe Price in STRIPE_PRICE_MONTHLY_PACK, when that's set. */
  packMonthly: 29,
} as const;

/** The post-purchase upsell: the packs the buyer doesn't own yet, for one price. */
export const UPSELL_PRICE = 47;

/** Four single packs bought separately, the bundle's struck-through comparison. */
export const FOUR_SINGLES = 4 * PRICES.pack;

/** What the bundle saves against buying the four packs one by one. */
export const BUNDLE_SAVE = FOUR_SINGLES - PRICES.bundle;

/** The main call to action, wherever it appears. */
export const PACK_CTA = `Get the pack — $${PRICES.pack}`;
