import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UpsellView } from '@/components/checkout/UpsellView';
import { MetaPurchase } from '@/components/MetaPurchase';
import { PageBar } from '@/components/PageBar';
import { metaBrowserPurchases } from '@/lib/analytics/meta-server';
import { checkoutModel, upsellPacks } from '@/lib/checkout';
import { upsellPaid } from '@/lib/payment';
import { previewHref, previewOrder } from '@/lib/preview';
import { paidOrder, stripeConfigured } from '@/lib/stripe';

export const metadata: Metadata = { title: 'One more thing — FanpageKit', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function lookup(sessionId: string) {
  try {
    const result = await paidOrder(sessionId);
    return { ...result, alreadyAdded: result.order ? await upsellPaid(result.session) : false };
  } catch (err) {
    console.error('[upsell] session lookup failed', err);
    return null;
  }
}

/** Between payment and /access: offers the packs the buyer doesn't own yet. Never shows any Drive link. */
export default async function UpsellPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const preview = previewOrder(params);
  if (preview) {
    const { orderName, monthly } = checkoutModel(preview);
    const packs = upsellPacks(preview);
    if (!packs.length) redirect(previewHref('/access', params));
    return (
      <main className="page">
        <PageBar><span className="gdot" />{orderName} · preview</PageBar>
        <UpsellView
          sessionId="preview"
          orderName={orderName}
          packs={packs.map((p) => ({ slug: p.slug, name: p.name, genres: p.genres }))}
          monthly={monthly}
          preview={{ access: previewHref('/access', params), accepted: previewHref('/access', params, { upsell: '1' }) }}
        />
      </main>
    );
  }

  const raw = params.session_id;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  if (!sessionId || !stripeConfigured()) redirect('/#packs');

  const result = await lookup(sessionId);
  if (!result) redirect('/#packs');
  if (!result.order) redirect(`/checkout?pack=${encodeURIComponent(result.session.metadata?.pack ?? '')}`);

  const packs = upsellPacks(result.order);
  if (!packs.length || result.alreadyAdded) redirect(`/access?session_id=${encodeURIComponent(sessionId)}`);

  const { orderName, monthly } = checkoutModel(result.order);
  return (
    <main className="page">
      <MetaPurchase {...metaBrowserPurchases(result.session, result.order)} />
      <PageBar><span className="gdot" />{orderName} · paid</PageBar>
      <UpsellView
        sessionId={sessionId}
        orderName={orderName}
        packs={packs.map((p) => ({ slug: p.slug, name: p.name, genres: p.genres }))}
        monthly={monthly}
      />
    </main>
  );
}
