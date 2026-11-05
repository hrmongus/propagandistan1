import { generateHooks, type HooksInput } from '@/lib/analyzer/hooks';
import { aestheticById } from '@/lib/analyzer/config';

export const maxDuration = 15;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const strs = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 60)) : undefined);

export function parseHooksInput(b: Record<string, unknown>): HooksInput | null {
  const title = str(b.title, 200), artist = str(b.artist, 200);
  const aesthetics = (strs(b.aesthetics, 3) ?? []).filter((id) => aestheticById(id));
  if (!title || !artist || !aesthetics.length) return null;
  return { title, artist, aesthetics, genres: strs(b.genres, 10), lyricLine: str(b.lyricLine, 200) || null, age: str(b.age, 20), gender: str(b.gender, 20), moments: strs(b.moments, 8) };
}

/**
 * POST /api/hooks → { pages: [{ aesthetic, hooks: [3] }], fallback, reason?, provider, ms }.
 * Always 200 with valid JSON: on LLM timeout (4s) or error the pages hold the default hooks from config/moments.
 * `forceError: true` triggers the fallback outside production (for testing).
 */
export async function POST(req: Request) {
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const input = parseHooksInput(b);
  if (!input) return Response.json({ error: 'title, artist and 1–3 known aesthetics required' }, { status: 400 });
  const forceError = b.forceError === true && process.env.VERCEL_ENV !== 'production';
  return Response.json(await generateHooks(input, { forceError }));
}
