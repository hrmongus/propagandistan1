import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStrategy } from '@/lib/analyzer/strategies';
import { isSlug } from '@/lib/analyzer/store';

export const metadata: Metadata = { title: 'Your fan page strategy', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Permanent results link (used in emails). Raw JSON until the designed results screen replaces it. */
export default async function Strategy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSlug(id)) notFound();
  const row = await getStrategy(id);
  if (!row) notFound();
  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16 }}>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(row, null, 2)}</pre>
    </main>
  );
}
