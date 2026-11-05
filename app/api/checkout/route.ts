import { PACKS } from '@/lib/analyzer/config';
import { isSessionId } from '@/lib/analyzer/events';
import { isSlug, sb } from '@/lib/analyzer/store';

/**
 * GET /api/checkout?pack={pack}&ref={strategy_id}[&sid={session_id}] → logs `offer_clicked`, then 302 to
 * CHECKOUT_URL with pack and ref appended (existing query params on CHECKOUT_URL are kept). The redirect never
 * waits on a failed log. Without CHECKOUT_URL it falls back to the site's own /checkout page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pack = PACKS.find((p) => p.id === url.searchParams.get('pack'))?.id ?? null;
  const refParam = url.searchParams.get('ref') ?? '';
  const ref = isSlug(refParam) ? refParam : null;
  const sidParam = url.searchParams.get('sid');
  // The screens pass their session id (lib/analyzer/track.ts sessionId()) as `sid`; a bare link gets a server id.
  const sessionId = isSessionId(sidParam) ? sidParam : `srv_${crypto.randomUUID().replace(/-/g, '')}`;

  try {
    const { error } = await sb().from('events').insert({ session_id: sessionId, strategy_id: ref, name: 'offer_clicked', step: 'checkout_redirect' });
    if (error) console.error('[checkout] event log failed', error);
  } catch (e) {
    console.error('[checkout] event log failed', e);
  }

  const target = new URL(process.env.CHECKOUT_URL || '/checkout', url.origin);
  if (pack) target.searchParams.set('pack', pack);
  if (ref) target.searchParams.set('ref', ref);
  return new Response(null, { status: 302, headers: { Location: target.toString(), 'Cache-Control': 'no-store' } });
}
