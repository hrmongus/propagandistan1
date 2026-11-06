import {
  AESTHETICS, FIT_POINTS, FIT_WEIGHTS, PACK_FIT, PACK_PRIORITY, PACKS, type FitQuestion, type ListenerBracket, type PackId, type QuizAnswers,
} from './config';

/*
 * The results-page numbers. Pure and deterministic, so a reloaded /s/{id} or a re-submitted quiz shows identical
 * numbers. The pack ranking and the fit scores come from the pack fit sheet (config/packFit.ts): each answer is
 * worth B +2 / F +1 / N -2 for a pack, weighted by question (genre counts most). The radar and the small audience
 * jitter are seeded from a hash of the track id and the answers.
 */

export type RadarKey = 'hook' | 'emotion' | 'replay' | 'relatability' | 'shareability' | 'visualFit';

export type Metrics = {
  fanpageFit: { score: number; label: 'Excellent fit' | 'Strong fit' };
  untappedAudiencePct: number;
  radar: Record<RadarKey, number>;
  /** The aesthetic behind each recommended page, in page order (hooks are written per aesthetic). */
  topFanPages: string[];
  /** The 3 recommended pages, best first: one per pack (ranked by the fit sheet) with its scores. */
  pages: { aesthetic: string; kit: PackId; fit: number; audience: number }[];
  /** The #1 page's kit: preselected in the offer. */
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

/** The artist's answers per scored question, as weighted answer lists (aesthetics: first pick counts most). */
function scoredAnswers(a: QuizAnswers): [FitQuestion, { id: string; w: number }[]][] {
  const out: [FitQuestion, { id: string; w: number }[]][] = [];
  if (a.genre) out.push(['genre', [{ id: a.genre, w: 1 }]]);
  const ae = [...new Set(a.aesthetics ?? [])];
  if (ae.length) out.push(['aesthetics', ae.map((id, i) => ({ id, w: i === 0 ? 1 : 0.6 }))]);
  if (a.moments?.length) out.push(['moments', a.moments.map((id) => ({ id, w: 1 }))]);
  if (a.age?.length) out.push(['age', a.age.map((id) => ({ id, w: 1 }))]);
  return out;
}

/** Weighted average points (-2..2) of a list of answers for one pack and question; unknown answers count as F. */
function questionPoints(pack: PackId, q: FitQuestion, answers: { id: string; w: number }[]) {
  const wSum = answers.reduce((n, x) => n + x.w, 0);
  return answers.reduce((n, x) => n + FIT_POINTS[PACK_FIT[pack][q][x.id] ?? 'F'] * x.w, 0) / wSum;
}

export type PackScore = { pack: PackId; points: number; norm: number; audienceNorm: number };

/**
 * Every pack scored against the answers, best first. `points` is the weighted sum; `norm` maps it to 0..1 between
 * the worst (all N) and best (all B) possible for the questions answered. Ties: the first aesthetic pick's level for
 * the pack, then PACK_PRIORITY (Midnight City first).
 */
export function scorePacks(a: QuizAnswers): PackScore[] {
  const qs = scoredAnswers(a);
  const wTotal = qs.reduce((n, [q]) => n + FIT_WEIGHTS[q], 0);
  const audQs = qs.filter(([q]) => q === 'age' || q === 'moments');
  const audTotal = audQs.reduce((n, [q]) => n + FIT_WEIGHTS[q], 0);
  const range = (pts: number, tot: number) => (tot ? (pts - tot * FIT_POINTS.N) / (tot * (FIT_POINTS.B - FIT_POINTS.N)) : 0.5);
  const firstAe = a.aesthetics?.[0];
  return PACKS.map(({ id: pack }) => {
    const points = qs.reduce((n, [q, ans]) => n + FIT_WEIGHTS[q] * questionPoints(pack, q, ans), 0);
    const audPts = audQs.reduce((n, [q, ans]) => n + FIT_WEIGHTS[q] * questionPoints(pack, q, ans), 0);
    return { pack, points, norm: range(points, wTotal), audienceNorm: range(audPts, audTotal) };
  }).sort((x, y) => y.points - x.points
    || (firstAe ? FIT_POINTS[PACK_FIT[y.pack].aesthetics[firstAe] ?? 'F'] - FIT_POINTS[PACK_FIT[x.pack].aesthetics[firstAe] ?? 'F'] : 0)
    || PACK_PRIORITY.indexOf(x.pack) - PACK_PRIORITY.indexOf(y.pack));
}

/** The aesthetic to show for a pack: the artist's own pick that suits it best, else the best-suited unused one. */
function aestheticFor(pack: PackId, picks: string[], used: Set<string>) {
  const rank = (id: string) => FIT_POINTS[PACK_FIT[pack].aesthetics[id] ?? 'F'];
  const own = picks.filter((id) => !used.has(id) && AESTHETICS.some((x) => x.id === id)).sort((x, y) => rank(y) - rank(x))[0];
  if (own && rank(own) > 0) return own;
  const pool = AESTHETICS.filter((x) => !used.has(x.id)).sort((x, y) => rank(y.id) - rank(x.id) || (x.pack === pack ? -1 : 0) - (y.pack === pack ? -1 : 0));
  return pool[0]?.id ?? own ?? AESTHETICS[0].id;
}

export function getMetrics(trackId: string, answers: QuizAnswers): Metrics {
  const r = rng(hash(trackId + '|' + canonical(answers)));
  const radar = {} as Record<RadarKey, number>;
  for (const k of Object.keys(RADAR_LABELS) as RadarKey[]) radar[k] = intIn(r, 68, 96);

  // Top 3 packs by fit. Fit 60..97 from the sheet; each page at least 2 below the one above so #1 reads as the best.
  const used = new Set<string>();
  let cap = 97;
  const pages = scorePacks(answers).slice(0, 3).map((s) => {
    const fit = Math.min(cap, Math.max(55, Math.round(60 + 37 * s.norm)));
    cap = fit - 2;
    const audience = Math.max(56, Math.min(96, Math.round(58 + 36 * s.audienceNorm) + intIn(r, -2, 2)));
    const aesthetic = aestheticFor(s.pack, answers.aesthetics ?? [], used);
    used.add(aesthetic);
    return { aesthetic, kit: s.pack, fit, audience };
  });
  const score = pages[0].fit;
  return {
    fanpageFit: { score, label: score >= 86 ? 'Excellent fit' : 'Strong fit' },
    untappedAudiencePct: UNTAPPED[answers.listeners] ?? UNTAPPED.lt1k,
    radar,
    topFanPages: pages.map((p) => p.aesthetic),
    pages,
    offerPack: pages[0].kit,
  };
}
