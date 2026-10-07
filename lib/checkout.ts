import { PACKS, PACK_SLUGS, type Pack } from './data';

/**
 * 'once' is a single payment that never renews; 'monthly' is a subscription for one pack, billed today and every
 * month after. All four packs are one-time only.
 */
export type Plan = 'once' | 'monthly';

export type Order = {
  /** Slug of the pack the buyer picked on the landing page. */
  pack: string;
  /** Upgrade a single pack to all four packs (one-time only). */
  bundleUp: boolean;
  plan: Plan;
};

/** Prices in whole dollars. packMonthly must match the Stripe Price in STRIPE_PRICE_MONTHLY_PACK. */
export const PRICES = { pack: 37, bundle: 97, packMonthly: 29, fourSingles: 148 } as const;

const ITEMS_SINGLE: [string, string][] = [['Finished videos', '30 · 9:16 · silent'], ['Raw clips', '112'], ['Editing guides', '9 · one per tool'], ['Posting playbook', '24 pages'], ['Commercial licence', 'No expiry'], ['Money back guarantee', '30 days']];
const ITEMS_BUNDLE: [string, string][] = [['Finished videos', '120 · 9:16 · silent'], ['Raw clips', '448'], ['Editing guides', '9 · one per tool'], ['Posting playbook', '4 months'], ['Commercial licence', 'No expiry'], ['Money back guarantee', '30 days']];

export function packBySlug(slug: string | null | undefined): Pack {
  return PACKS.find((p) => p.slug === slug) ?? PACKS[0];
}

export function parseOrder(params: { pack?: string | null; bundle?: string | null; plan?: string | null }): Order {
  const sel = packBySlug(params.pack);
  const monthly = params.plan === 'monthly' && !sel.bundle;
  return {
    pack: sel.slug,
    // A subscription is one pack a month, so it never carries the four-pack upgrade.
    bundleUp: !monthly && params.bundle === '1',
    plan: monthly ? 'monthly' : 'once',
  };
}

/** Everything the checkout and access views display for an order. */
export function checkoutModel(order: Order) {
  const sel = packBySlug(order.pack);
  const monthly = order.plan === 'monthly' && !sel.bundle;
  const bundleUp = !sel.bundle && !monthly && order.bundleUp;
  const isBundleOrder = sel.bundle || bundleUp;
  const oncePrice = isBundleOrder ? PRICES.bundle : PRICES.pack;
  const monthlyPrice = PRICES.packMonthly;
  const dueToday = monthly ? monthlyPrice : oncePrice;
  const orderName = isBundleOrder ? 'All four packs' : sel.name;
  const per = monthly ? ' / mo' : '';

  return {
    sel,
    bundleUp,
    isBundleOrder,
    monthly,
    dueToday,
    orderName,
    orderPrice: `$${dueToday}${per}`,
    /** Rows of the payment summary. */
    lines: (monthly
      ? [[`${orderName} · monthly`, `$${monthlyPrice} / mo`]]
      : bundleUp
        ? [[sel.name, `$${PRICES.pack}`], ['Upgrade to all four packs', `+$${PRICES.bundle - PRICES.pack}`]]
        : [[orderName, `$${oncePrice}`]]) as [string, string][],
    total: `$${dueToday}`,
    /** The single-pack → all-four upgrade. It's one-time, so taking it switches a monthly order to paying once. */
    upgrade: monthly
      ? { add: `$${PRICES.bundle} one-time`, total: `instead of $${monthlyPrice} / mo` }
      : { add: `+$${PRICES.bundle - PRICES.pack}`, total: `$${PRICES.bundle} total` },
    items: isBundleOrder ? ITEMS_BUNDLE : ITEMS_SINGLE,
    subSave: PRICES.pack - PRICES.packMonthly,
    renewNote: monthly
      ? `Renews every month on today's date at $${monthlyPrice} until you cancel — one click, any time.`
      : 'One payment. Nothing renews.',
    plans: [
      {
        id: 'once' as const,
        title: 'Pay once',
        body: `${orderName}, one payment. Nothing renews.`,
        price: `$${oncePrice}`,
        was: '',
      },
      {
        id: 'monthly' as const,
        title: 'A new pack every month',
        body: `${sel.name} today, a fresh 30-video pack every month after. $${monthlyPrice} a month, cancel any time in one click.`
          + (bundleUp ? ' Single pack only — replaces the four-pack upgrade.' : ''),
        price: `$${monthlyPrice} / mo`,
        was: `$${PRICES.pack}`,
      },
    ],
  };
}

export type CheckoutModel = ReturnType<typeof checkoutModel>;

/* ---------- post-purchase upsell ---------- */

/** One-click offer shown between payment and /access: the packs the buyer doesn't own yet, for one low price. */
export const UPSELL_PRICE = 27;

/** Single packs the order doesn't include, or [] when it already has all four (nothing to upsell). */
export function upsellPacks(order: Order): Pack[] {
  const m = checkoutModel(order);
  if (m.isBundleOrder) return [];
  return PACKS.filter((p) => !p.bundle && p.slug !== m.sel.slug);
}

/** The packs an order pays for, as single-pack slugs (a four-pack order is all four). */
export function orderPacks(order: Order): string[] {
  const m = checkoutModel(order);
  return m.isBundleOrder ? PACK_SLUGS : [m.sel.slug];
}

/**
 * Which Drive links an order unlocks, as pack slugs ('bundle' is the four-pack folder).
 * One-off buyers see everything they paid for on /access. Subscribers see only their pack; the packs they add
 * with the upsell go out by email.
 */
export function deliverables(order: Order, upsellPaid: boolean) {
  const m = checkoutModel(order);
  const allFour = m.isBundleOrder || upsellPaid;
  if (!m.monthly) return { shown: [allFour ? 'bundle' : m.sel.slug], emailed: [] as string[] };
  return { shown: [m.sel.slug], emailed: upsellPaid ? PACK_SLUGS.filter((s) => s !== m.sel.slug) : [] };
}
