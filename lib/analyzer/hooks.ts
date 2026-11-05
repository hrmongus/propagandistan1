import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { aestheticById, MOMENTS, momentById } from './config';

/*
 * Text hooks for the example fan pages: 3 lowercase POV-style lines (≤10 words) per page, from one LLM call.
 * Claude (HOOKS_MODEL, default claude-haiku-5-5) when ANTHROPIC_API_KEY is set, else OpenAI gpt-4.1-mini.
 * Hard 4s budget: on timeout, error or malformed output, every page gets default hooks from config/moments.
 */

export type HooksInput = {
  title: string;
  artist: string;
  genres?: string[];
  lyricLine?: string | null;
  /** Aesthetic ids, normally the 3 top fan pages. */
  aesthetics: string[];
  age?: string;
  gender?: string;
  /** Moment ids. */
  moments?: string[];
};

export type HookPage = { aesthetic: string; hooks: string[] };
export type HooksResult = { pages: HookPage[]; fallback: boolean; reason?: string; provider: string; ms: number; usage?: { input: number; output: number } };

export const HOOKS_TIMEOUT_MS = 4000;

const SYSTEM =
  'You write on-screen text hooks for TikTok/Reels fan-page edits of a song. For each fan page aesthetic given, return exactly 3 hooks. Rules: all lowercase; ' +
  "at most 10 words each; POV or scenario style that makes a viewer stop scrolling (e.g. 'pov: 2am, empty highway, this comes on'); fit the aesthetic through " +
  'concrete images, places, outfits or objects, but never name the aesthetic; speak to the audience and listening moments given; a lyric line, if given, may ' +
  "inspire a hook but don't quote it; no hashtags, no emojis, no artist or song names; avoid cliches like 'when the beat drops' or 'hits different'; no slurs.";

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pages'],
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['aesthetic', 'hooks'],
        properties: { aesthetic: { type: 'string' }, hooks: { type: 'array', items: { type: 'string' } } },
      },
    },
  },
} as const;

const tidy = (h: string) => h.toLowerCase().replace(/["#]/g, '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 10).join(' ');

/** Default hooks: the user's moments first, then the rest in config order, rotated per page so pages differ. */
export function fallbackHooks(input: Pick<HooksInput, 'aesthetics' | 'moments'>): HookPage[] {
  const picked = (input.moments ?? []).map(momentById).filter((m) => !!m);
  const lines = [...new Set([...picked, ...MOMENTS].map((m) => m.defaultHook))];
  return input.aesthetics.map((aesthetic, i) => ({ aesthetic, hooks: [0, 1, 2].map((j) => lines[(i + j) % lines.length]) }));
}

/** Matches model output to the requested aesthetics by position or name; null if anything is missing. */
function validate(raw: unknown, ids: string[]): HookPage[] | null {
  const pages = (raw as { pages?: { aesthetic?: unknown; hooks?: unknown }[] })?.pages;
  if (!Array.isArray(pages) || pages.length < ids.length) return null;
  const out: HookPage[] = [];
  for (let i = 0; i < ids.length; i++) {
    const name = aestheticById(ids[i])?.name.toLowerCase();
    const page = pages.find((p) => typeof p.aesthetic === 'string' && (p.aesthetic === ids[i] || p.aesthetic.toLowerCase() === name)) ?? pages[i];
    const hooks = Array.isArray(page?.hooks) ? page.hooks.filter((h): h is string => typeof h === 'string' && h.trim().length > 0).map(tidy) : [];
    if (hooks.length < 3) return null;
    out.push({ aesthetic: ids[i], hooks: hooks.slice(0, 3) });
  }
  return out;
}

function userPrompt(input: HooksInput) {
  return JSON.stringify({
    song: { title: input.title, artist: input.artist, genres: input.genres?.length ? input.genres : undefined, lyric_line: input.lyricLine || undefined },
    audience: { age: input.age, gender: input.gender },
    listening_moments: (input.moments ?? []).map((id) => momentById(id)?.label ?? id),
    fan_pages: input.aesthetics.map((id) => {
      const a = aestheticById(id);
      return { aesthetic: id, name: a?.name ?? id, angle: a?.angle };
    }),
  });
}

async function callModel(input: HooksInput, signal: AbortSignal) {
  if (process.env.ANTHROPIC_API_KEY) {
    const model = process.env.HOOKS_MODEL || 'claude-haiku-5-5';
    const r = await new Anthropic({ maxRetries: 0 }).messages.create(
      { model, max_tokens: 1024, system: SYSTEM, output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } }, messages: [{ role: 'user', content: userPrompt(input) }] },
      { signal },
    );
    const text = r.content.find((b) => b.type === 'text');
    if (r.stop_reason === 'refusal' || !text || text.type !== 'text') throw new Error(`no text (${r.stop_reason})`);
    return { raw: JSON.parse(text.text) as unknown, provider: model, usage: { input: r.usage.input_tokens, output: r.usage.output_tokens } };
  }
  if (!process.env.OPENAI_API_KEY) throw new Error('no LLM key configured');
  const r = await new OpenAI({ maxRetries: 0 }).chat.completions.create(
    {
      model: 'gpt-4.1-mini',
      temperature: 0.9,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userPrompt(input) }],
      response_format: { type: 'json_schema', json_schema: { name: 'hooks', strict: true, schema: SCHEMA as unknown as Record<string, unknown> } },
    },
    { signal },
  );
  return { raw: JSON.parse(r.choices[0].message.content ?? '{}') as unknown, provider: 'gpt-4.1-mini', usage: { input: r.usage?.prompt_tokens ?? 0, output: r.usage?.completion_tokens ?? 0 } };
}

export async function generateHooks(input: HooksInput, opts: { forceError?: boolean; timeoutMs?: number } = {}): Promise<HooksResult> {
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  const fallback = (reason: string): HooksResult => ({ pages: fallbackHooks(input), fallback: true, reason, provider: 'defaults', ms: ms() });
  if (!input.aesthetics.length) return fallback('no aesthetics');
  if (opts.forceError) return fallback('forced error');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? HOOKS_TIMEOUT_MS);
  try {
    const r = await callModel(input, ctrl.signal);
    const pages = validate(r.raw, input.aesthetics);
    if (!pages) return fallback('malformed output');
    return { pages, fallback: false, provider: r.provider, ms: ms(), usage: r.usage };
  } catch (e) {
    const reason = ctrl.signal.aborted ? 'timeout' : (e instanceof Error ? e.message : String(e)).slice(0, 200);
    console.warn('[hooks] fallback:', reason);
    return fallback(reason);
  } finally {
    clearTimeout(timer);
  }
}
