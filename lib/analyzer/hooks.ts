import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/*
 * Text hooks for the example fan-page videos: 3 lowercase POV-style lines, ≤10 words, per recommended page.
 * Uses Claude (HOOKS_MODEL, default claude-haiku-5-5) when ANTHROPIC_API_KEY is set, otherwise OpenAI gpt-4.1-mini.
 */

export type HookContext = {
  mood: string; bpm: number; energy: number; aesthetic: string;
  age?: string; gender?: string; region?: string; moment?: string;
};
export type HookResult = { hooks: string[]; provider: string; ms: number; inputTokens: number; outputTokens: number };

const SYSTEM =
  'You write on-screen text hooks for TikTok/Reels fan-page edits of a song. Return exactly 3 hooks. Rules: all lowercase; at most 10 words each; ' +
  "POV or scenario style that makes a viewer stop scrolling (e.g. 'pov: 2am, empty highway, this comes on'); match the song's mood and the aesthetic; " +
  'speak to the target audience and listening moment; no hashtags, no emojis, no artist or song names, never name the aesthetic itself ' +
  "(show it through concrete images, places, outfits, objects), avoid cliches like 'when the beat drops' or 'hits different', no slurs.";

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['hooks'],
  properties: { hooks: { type: 'array', items: { type: 'string' } } },
} as const;

const clean = (hooks: unknown): string[] =>
  (Array.isArray(hooks) ? hooks : [])
    .filter((h): h is string => typeof h === 'string')
    .map((h) => h.toLowerCase().trim().split(/\s+/).slice(0, 10).join(' '))
    .slice(0, 3);

export async function generateHooks(ctx: HookContext): Promise<HookResult> {
  const t0 = performance.now();
  if (process.env.ANTHROPIC_API_KEY) {
    const model = process.env.HOOKS_MODEL || 'claude-haiku-5-5';
    const r = await new Anthropic().messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: JSON.stringify(ctx) }],
    });
    const text = r.content.find((b) => b.type === 'text');
    if (r.stop_reason === 'refusal' || !text || text.type !== 'text') throw new Error(`hooks: no text (${r.stop_reason})`);
    return { hooks: clean(JSON.parse(text.text).hooks), provider: model, ms: Math.round(performance.now() - t0), inputTokens: r.usage.input_tokens, outputTokens: r.usage.output_tokens };
  }
  const r = await new OpenAI().chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.9,
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: JSON.stringify(ctx) }],
    response_format: { type: 'json_schema', json_schema: { name: 'hooks', strict: true, schema: SCHEMA as unknown as Record<string, unknown> } },
  });
  return {
    hooks: clean(JSON.parse(r.choices[0].message.content ?? '{}').hooks),
    provider: 'gpt-4.1-mini',
    ms: Math.round(performance.now() - t0),
    inputTokens: r.usage?.prompt_tokens ?? 0,
    outputTokens: r.usage?.completion_tokens ?? 0,
  };
}
