import { PACKS, type Pack } from './data';

export type Upsell = 'none' | 'monthly';

export type Order = {
  /** Slug of the pack the buyer picked on the landing page. */
  pack: string;
  /** Upgrade a single pack to the four-pack bundle. */
  bundleUp: boolean;
  upsell: Upsell;
};

const ITEMS_SINGLE: [string, string][] = [['Finished videos', '30 · 9:16 · silent'], ['Raw clips', '112'], ['Editing guides', '8 · one per tool'], ['Posting playbook', '24 pages'], ['Commercial licence', 'No expiry'], ['Money back guarantee', '30 days']];
const ITEMS_BUNDLE: [string, string][] = [['Finished videos', '120 · 9:16 · silent'], ['Raw clips', '448'], ['Editing guides', '8 · one per tool'], ['Posting playbook', '4 months'], ['Commercial licence', 'No expiry'], ['Money back guarantee', '30 days']];

export function packBySlug(slug: string | null | undefined): Pack {
  return PACKS.find((p) => p.slug === slug) ?? PACKS[0];
}

export function parseOrder(params: { pack?: string | null; bundle?: string | null; upsell?: string | null }): Order {
  return {
    pack: packBySlug(params.pack).slug,
    bundleUp: params.bundle === '1',
    upsell: params.upsell === 'monthly' ? 'monthly' : 'none',
  };
}

/** Everything the checkout and access views display for an order. Prices in whole dollars. */
export function checkoutModel(order: Order) {
  const sel = packBySlug(order.pack);
  const bundleUp = !sel.bundle && order.bundleUp;
  const isBundleOrder = sel.bundle || bundleUp;
  const monthly = order.upsell === 'monthly';
  const dueToday = isBundleOrder ? 97 : 37;
  const monthlyPrice = isBundleOrder ? 97 : 29;

  return {
    sel,
    bundleUp,
    isBundleOrder,
    monthly,
    dueToday,
    monthlyPrice,
    orderName: isBundleOrder ? 'All four packs' : sel.name,
    orderPrice: '$' + (sel.bundle ? 97 : 37),
    total: '$' + dueToday,
    hasAddon: monthly || bundleUp,
    addonLabel: bundleUp ? (monthly ? 'Bundle upgrade + monthly pack' : 'Bundle upgrade') : 'Monthly pack · from next month',
    addonPrice: bundleUp ? '+$60' : '$0 today',
    items: isBundleOrder ? ITEMS_BUNDLE : ITEMS_SINGLE,
    subSave: isBundleOrder ? '51 a month' : '8 a month',
    renewNote: monthly
      ? `Renews on the 1st at $${monthlyPrice}; the confirmation email states the price and next billing date.`
      : 'Nothing renews.',
    upsells: [
      { id: 'none' as const, title: 'Just this order', body: 'One payment. Nothing renews.', price: '—', was: '' },
      {
        id: 'monthly' as const,
        title: isBundleOrder ? 'All four packs, every month' : 'A new pack every month',
        body: isBundleOrder
          ? 'Four fresh 30-video packs land on the 1st. $97 each month after today. Cancel any time in one click.'
          : 'A fresh 30-video pack lands on the 1st. $29 each month after today. Cancel any time in one click.',
        price: isBundleOrder ? '$97 / mo' : '$29 / mo',
        was: isBundleOrder ? '$148' : '$37',
      },
    ],
  };
}

export type CheckoutModel = ReturnType<typeof checkoutModel>;
