import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccessSteps } from '@/components/checkout/AccessSteps';
import { MetaPurchase } from '@/components/MetaPurchase';
import { PageBar } from '@/components/PageBar';
import { TrackView } from '@/components/TrackView';
import { metaBrowserPurchases } from '@/lib/analytics/meta-server';
import { checkoutModel, deliverables } from '@/lib/checkout';
import { config, driveLink, fanpagekitGuideLink, guidesLink, privateLinks } from '@/lib/config';
import { PACKS } from '@/lib/data';
import { upsellIntent } from '@/lib/payment';
import { paidOrder, stripeConfigured } from '@/lib/stripe';
import { openBillingPortal } from './actions';

export const metadata: Metadata = { title: 'Your pack — FanpageKit', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function lookup(sessionId: string) {
  try {
    const result = await paidOrder(sessionId);
    const upsellPi = result.order ? await upsellIntent(result.session) : undefined;
    return { ...result, upsellPi, upsell: Boolean(upsellPi) };
  } catch (err) {
    console.error('[access] session lookup failed', err);
    return null;
  }
}

export default async function AccessPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).session_id;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  if (!sessionId || !stripeConfigured()) redirect('/#packs');

  const result = await lookup(sessionId);
  if (!result) redirect('/#packs');
  // Came back without finishing payment → back to the same order.
  if (!result.order) redirect(`/checkout?pack=${encodeURIComponent(result.session.metadata?.pack ?? '')}`);

  const { orderName, monthly } = checkoutModel(result.order);
  const { discordUrl } = privateLinks();
  const email = result.session.customer_details?.email;
  // Links are read only here, after the session is verified as paid, and only for what the order unlocks.
  const { shown, emailed } = deliverables(result.order, result.upsell);
  const packName = (slug: string) => PACKS.find((p) => p.slug === slug)?.name ?? slug;
  const drives = [
    ...shown.map((slug) => ({ name: packName(slug), url: driveLink(slug) })),
    { name: 'The FanpageKit Guide', url: fanpagekitGuideLink() },
    { name: 'Editing guides', url: guidesLink() },
  ];
  const emailedNote = emailed.length
    ? `${emailed.map(packName).join(', ').replace(/, ([^,]*)$/, ' and $1')} ${emailed.length > 1 ? 'are' : 'is'} on the way to ${email ?? 'your inbox'}.`
    : undefined;

  return (
    <main className="page">
      <MetaPurchase {...metaBrowserPurchases(result.session, result.order, result.upsellPi)} />
      <TrackView event="access_viewed" props={{ order_name: orderName, monthly, upsell: result.upsell }} email={email} />
      <PageBar>{result.upsell ? 'All four packs' : orderName} · paid</PageBar>
      <div className="access">
        <div className="access-head">
          <span className="ok"><span className="gdot" />Payment confirmed</span>
          <h1>Your pack is ready. {config.vslUrl ? 'Four' : 'Three'} steps to set up.</h1>
          <p>About ten minutes, then you post your first clip tonight.{email && <> Your links are also on their way to {email}.</>}</p>
        </div>
        <AccessSteps discordUrl={discordUrl} drives={drives} emailedNote={emailedNote} />
        {monthly && (
          <form className="manage" action={openBillingPortal}>
            <input type="hidden" name="session_id" value={sessionId} />
            Monthly plan active · <button type="submit">Manage or cancel</button>
          </form>
        )}
      </div>
    </main>
  );
}
