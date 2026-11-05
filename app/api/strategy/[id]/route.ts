import { getStrategy } from '@/lib/analyzer/strategies';
import { isSlug } from '@/lib/analyzer/store';

/** GET /api/strategy/{id} → the saved strategy without the email. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSlug(id)) return Response.json({ error: 'not_found' }, { status: 404 });
  const row = await getStrategy(id).catch((e) => { console.error('[strategy/get]', e); return undefined; });
  if (row === undefined) return Response.json({ error: 'lookup_failed' }, { status: 502 });
  if (!row) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json(row);
}
