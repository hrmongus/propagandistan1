import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccessSteps } from '@/components/checkout/AccessSteps';
import { PageBar } from '@/components/PageBar';
import { checkoutModel } from '@/lib/checkout';
import { privateLinks } from '@/lib/config';
import { paidOrder, stripeConfigured } from '@/lib/stripe';
import { openBillingPortal } from './actions';

export const metadata: Metadata = { title: 'Your pack — FanpageKit', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function lookup(sessionId: string) {
  try {
    return await paidOrder(sessionId);
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
  const { discordUrl, driveUrl } = privateLinks();
  const email = result.session.customer_details?.email;

  return (
    <main className="page">
      <PageBar>{orderName} · paid</PageBar>
      <div className="access">
        <div className="access-head">
          <span className="ok"><span className="gdot" />Payment confirmed</span>
          <h1>Your pack is ready. Four steps to set up.</h1>
          <p>About ten minutes, then you post your first clip tonight.{email && <> Your receipt is on its way to {email}.</>}</p>
        </div>
        <AccessSteps orderName={orderName} discordUrl={discordUrl} driveUrl={driveUrl} />
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
