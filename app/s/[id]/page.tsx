import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { geistMono } from '@/components/blueprint/fonts';
import { Results, type StrategyRow } from '@/components/blueprint/results';
import { getStrategy } from '@/lib/analyzer/strategies';
import { isSlug } from '@/lib/analyzer/store';
import '@/components/blueprint/blueprint.css';

export const metadata: Metadata = { title: 'Your Fanpage Blueprint — FanpageKit', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#000000', viewportFit: 'cover' };
export const dynamic = 'force-dynamic';

/** Permanent results link (screen 17), sent by email. The row never includes the email address. */
export default async function Strategy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSlug(id)) notFound();
  const row = (await getStrategy(id)) as StrategyRow | null;
  if (!row) notFound();
  return (
    <div className={`fpb ${geistMono.variable}`}>
      <Results row={row} />
    </div>
  );
}
