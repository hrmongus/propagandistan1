import { checkEmail } from '@/lib/analyzer/email';
import { espTags, sendToESP } from '@/lib/analyzer/esp';
import { generateHooks } from '@/lib/analyzer/hooks';
import { getMetrics } from '@/lib/analyzer/metrics';
import { sb, slug } from '@/lib/analyzer/store';
import {
  aestheticById, AGES, BLOCKERS, DAILY_TIME, EXPERIENCE, GENDERS, GOALS, LIMITS, LISTENER_BRACKETS, MOMENTS, RELEASES, TRIED, type QuizAnswers,
} from '@/lib/analyzer/config';
import { config } from '@/lib/config';

export const maxDuration = 15;

type Track = { id: string; title: string; artists: string[]; artworkUrl?: string | null; releaseDate?: string | null; spotifyUrl?: string };

const s = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
/** A known option id, typed as that option's id union. */
const pick = <T extends string>(v: unknown, options: readonly { id: T }[]): T | undefined => options.find((o) => o.id === v)?.id;
const picks = <T extends string>(v: unknown, options: readonly { id: T }[], max: number): T[] =>
  [...new Set(Array.isArray(v) ? v : [])].map((x) => pick(x, options)).filter((x): x is T => !!x).slice(0, max);
const arr = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 60)) : []);

function parseTrack(v: unknown): Track | null {
  const t = v as Record<string, unknown> | null;
  if (!t || typeof t.id !== 'string' || !/^[A-Za-z0-9]{22}$/.test(t.id) || !s(t.title, 300)) return null;
  return {
    id: t.id, title: s(t.title, 300)!, artists: arr(t.artists, 10).length ? arr(t.artists, 10) : ['Unknown artist'],
    artworkUrl: s(t.artworkUrl, 500) ?? null, releaseDate: s(t.releaseDate, 20) ?? null, spotifyUrl: s(t.spotifyUrl, 200) ?? `https://open.spotify.com/track/${t.id}`,
  };
}

function parseAnswers(v: unknown): QuizAnswers | null {
  const a = (v ?? {}) as Record<string, unknown>;
  const listeners = pick(a.listeners, LISTENER_BRACKETS);
  if (!listeners) return null;
  return {
    listeners,
    goal: pick(a.goal, GOALS),
    blocker: pick(a.blocker, BLOCKERS),
    aesthetics: arr(a.aesthetics, 3).filter((id) => aestheticById(id)),
    age: picks(a.age, AGES, LIMITS.age),
    gender: pick(a.gender, GENDERS),
    moments: picks(a.moments, MOMENTS, LIMITS.moments),
    tried: picks(a.tried, TRIED, TRIED.length),
    dailyTime: pick(a.dailyTime, DAILY_TIME),
    release: pick(a.release, RELEASES),
    experience: pick(a.experience, EXPERIENCE),
  };
}

/**
 * POST /api/strategy { track, answers, lyricLine?, firstName?, email } → { id, results_url }.
 * Validates, computes metrics, generates hooks (≤4s, falls back to defaults), saves the row, hands the lead to the ESP.
 */
export async function POST(req: Request) {
  const t0 = performance.now();
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const email = checkEmail(b.email);
  if (!email.ok) return Response.json({ error: email.error }, { status: 400 });
  const track = parseTrack(b.track), answers = parseAnswers(b.answers);
  if (!track) return Response.json({ error: 'invalid_track' }, { status: 400 });
  if (!answers) return Response.json({ error: 'invalid_answers' }, { status: 400 });
  const firstName = s(b.firstName, 80) ?? null, lyricLine = s(b.lyricLine, 200) ?? null;

  const metrics = getMetrics(track.id, answers);
  const hooks = await generateHooks({ title: track.title, artist: track.artists[0], lyricLine, aesthetics: metrics.topFanPages, age: answers.age?.join(', '), gender: answers.gender, moments: answers.moments });

  const row = {
    first_name: firstName, email: email.email, track, answers, metrics, lyric_line: lyricLine,
    hooks: { pages: hooks.pages, fallback: hooks.fallback, provider: hooks.provider },
  };
  let id = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    id = slug(8);
    const { error } = await Promise.resolve()
      .then(() => sb().from('strategies').insert({ id, ...row }))
      .catch((e: unknown) => ({ error: { code: 'config', message: e instanceof Error ? e.message : String(e) } }));
    if (!error) break;
    if (error.code !== '23505' || attempt === 2) {
      console.error('[strategy] insert failed', error);
      return Response.json({ error: 'save_failed' }, { status: 500 });
    }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ? config.siteUrl : new URL(req.url).origin;
  const results_url = `${origin}/s/${id}`;
  await sendToESP({ email: email.email, first_name: firstName, results_url, tags: espTags(answers) }).catch((e) => console.error('[strategy] ESP failed', e));

  return Response.json({ id, results_url, ms: Math.round(performance.now() - t0), hooks_ms: hooks.ms, hooks_fallback: hooks.fallback });
}
