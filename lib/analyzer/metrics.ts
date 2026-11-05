import { AESTHETICS, aestheticById, type Aesthetic, type ListenerBracket, type PackId, type QuizAnswers } from './config';

/*
 * The results-page numbers. Pure and deterministic: seeded from a hash of the track id and the answers, so the
 * same input always gives the same output (a reloaded /s/{id} or a re-submitted quiz shows identical numbers).
 * These are presentation metrics for the lead magnet, not measurements.
 */

export type RadarKey = 'hook' | 'emotion' | 'replay' | 'relatability' | 'shareability' | 'visualFit';

export type Metrics = {
  fanpageFit: { score: number; label: 'Excellent fit' | 'Strong fit' };
  untappedAudiencePct: number;
  radar: Record<RadarKey, number>;
  /** Aesthetic ids: the user's picks in pick order, filled to 3 with aesthetics on the first pick's pack. */
  topFanPages: string[];
  offerPack: PackId;
};

export const RADAR_LABELS: Record<RadarKey, string> = {
  hook: 'Hook', emotion: 'Emotion', replay: 'Replay value', relatability: 'Relatability', shareability: 'Shareability', visualFit: 'Visual fit',
};

const UNTAPPED: Record<ListenerBracket, number> = { lt1k: 99, '1k-10k': 97, '10k-50k': 93, '50k-100k': 88, '100k+': 80 };

/** FNV-1a, 32-bit. */
export function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: small seeded PRNG returning floats in [0, 1). */
export function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable JSON: object keys sorted, so key order in the request never changes the seed. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canonical((v as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(v);
}

const intIn = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/** Picks first (in pick order, unknown ids dropped, max 3), then same-pack aesthetics in config order, then any. */
export function fillTopFanPages(picks: string[], pool: Aesthetic[] = AESTHETICS, fallbackFirst?: string): string[] {
  const chosen = [...new Set(picks)].filter((id) => pool.some((a) => a.id === id)).slice(0, 3);
  if (!chosen.length && fallbackFirst) chosen.push(fallbackFirst);
  const pack = pool.find((a) => a.id === chosen[0])?.pack;
  for (const a of pool) if (chosen.length < 3 && a.pack === pack && !chosen.includes(a.id)) chosen.push(a.id);
  for (const a of pool) if (chosen.length < 3 && !chosen.includes(a.id)) chosen.push(a.id);
  return chosen;
}

export function getMetrics(trackId: string, answers: QuizAnswers): Metrics {
  const r = rng(hash(trackId + '|' + canonical(answers)));
  const fit = intIn(r, 78, 90);
  const radar = {} as Record<RadarKey, number>;
  for (const k of Object.keys(RADAR_LABELS) as RadarKey[]) radar[k] = intIn(r, 68, 96);
  // No valid pick: choose one deterministically so the page still has three fan pages.
  const fallbackFirst = AESTHETICS[Math.floor(r() * AESTHETICS.length)].id;
  const topFanPages = fillTopFanPages(answers.aesthetics ?? [], AESTHETICS, fallbackFirst);
  return {
    fanpageFit: { score: fit, label: fit >= 86 ? 'Excellent fit' : 'Strong fit' },
    untappedAudiencePct: UNTAPPED[answers.listeners] ?? UNTAPPED.lt1k,
    radar,
    topFanPages,
    offerPack: aestheticById(topFanPages[0])!.pack,
  };
}
