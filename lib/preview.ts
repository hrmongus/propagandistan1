import { timingSafeEqual } from 'node:crypto';
import { parseOrder, type Order } from './checkout';

/*
 * Admin preview of /upsell and /access without buying: add ?preview=<PREVIEW_TOKEN> plus the order to show
 * (pack, bundle, plan; on /access also upsell=1 for "bought the upsell"). Unset PREVIEW_TOKEN → previews are off.
 * Nothing is charged, fulfilled or sent to Meta, and the pages skip their view events. The preview of /access shows
 * the real Drive and Discord links, so treat the token like a password.
 */

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The order to preview when `?preview=` matches PREVIEW_TOKEN, otherwise null. */
export function previewOrder(params: Params): Order | null {
  const token = process.env.PREVIEW_TOKEN, given = one(params.preview);
  if (!token || !given) return null;
  const a = Buffer.from(given), b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return parseOrder({ pack: one(params.pack), bundle: one(params.bundle), plan: one(params.plan) });
}

/** The same preview carried to the next page (`extra` adds or overrides params, e.g. upsell=1). */
export function previewHref(path: string, params: Params, extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  for (const k of ['preview', 'pack', 'bundle', 'plan']) {
    const v = one(params[k]);
    if (v) q.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return `${path}?${q}`;
}
