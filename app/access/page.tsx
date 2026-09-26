import type { Metadata } from 'next';
import { AccessSteps } from '@/components/checkout/AccessSteps';
import { PageBar } from '@/components/PageBar';
import { checkoutModel, parseOrder } from '@/lib/checkout';

export const metadata: Metadata = { title: 'Your pack — FanpageKit', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AccessPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { orderName } = checkoutModel(parseOrder({ pack: one(sp.pack), bundle: one(sp.bundle), upsell: one(sp.upsell) }));
  return (
    <main className="page">
      <PageBar>{orderName} · paid</PageBar>
      <div className="access">
        <div className="access-head">
          <span className="ok"><span className="gdot" />Payment confirmed</span>
          <h1>Your pack is ready. Four steps to set up.</h1>
          <p>About ten minutes, then you post your first clip tonight.</p>
        </div>
        <AccessSteps orderName={orderName} />
      </div>
    </main>
  );
}
