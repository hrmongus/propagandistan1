import { isEventName, isSessionId, isStep } from '@/lib/analyzer/events';
import { isSlug, sb } from '@/lib/analyzer/store';

/**
 * POST /api/event { session_id, strategy_id?, name, step? } → 204.
 * Accepts application/json from fetch or a sendBeacon Blob (same body).
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || !isSessionId(b.session_id) || !isEventName(b.name)) return Response.json({ error: 'invalid_event' }, { status: 400 });
  const step = b.step == null || b.step === '' ? null : isStep(b.step) ? b.step : undefined;
  const strategyId = b.strategy_id == null || b.strategy_id === '' ? null : typeof b.strategy_id === 'string' && isSlug(b.strategy_id) ? b.strategy_id : undefined;
  if (step === undefined || strategyId === undefined) return Response.json({ error: 'invalid_event' }, { status: 400 });
  const { error } = await Promise.resolve()
    .then(() => sb().from('events').insert({ session_id: b.session_id, strategy_id: strategyId, name: b.name, step }))
    .catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
  if (error) {
    console.error('[event] insert failed', error);
    return Response.json({ error: 'save_failed' }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
