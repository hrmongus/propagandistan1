import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/CheckoutView';
import { PageBar } from '@/components/PageBar';
import { parseOrder } from '@/lib/checkout';

export const metadata: Metadata = { title: 'Checkout — FanpageKit', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const order = parseOrder({ pack: one(sp.pack), bundle: one(sp.bundle), upsell: one(sp.upsell) });
  return (
    <main className="page">
      <PageBar><span className="gdot" />Secure checkout</PageBar>
      {/* keyed so "Change pack" → new pack starts from a fresh state */}
      <CheckoutView key={order.pack} initial={order} />
    </main>
  );
}
