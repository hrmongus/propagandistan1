import { afterEach, describe, expect, it, vi } from 'vitest';
import { fallbackHooks, generateHooks } from './hooks';
import { MOMENTS } from './config';

const input = { title: 'Song', artist: 'Artist', aesthetics: ['noir', 'y2k', 'western'], moments: ['gym'] };

describe('fallbackHooks', () => {
  it('gives 3 hooks for every page, user moments first, pages differ', () => {
    const pages = fallbackHooks(input);
    expect(pages.map((p) => p.aesthetic)).toEqual(input.aesthetics);
    expect(pages.every((p) => p.hooks.length === 3)).toBe(true);
    expect(pages[0].hooks[0]).toBe(MOMENTS.find((m) => m.id === 'gym')!.defaultHook);
    expect(pages[0].hooks).not.toEqual(pages[1].hooks);
  });
});

describe('generateHooks fallback paths', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it('falls back on timeout without waiting for the model', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test';
    // A network call that never answers, but honours the abort signal like real fetch.
    vi.stubGlobal('fetch', (_url: unknown, init?: { signal?: AbortSignal }) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));
    const t0 = Date.now();
    const r = await generateHooks(input, { timeoutMs: 200 });
    expect(Date.now() - t0).toBeLessThan(1500);
    expect(r.fallback).toBe(true);
    expect(r.reason).toBe('timeout');
    expect(r.pages).toEqual(fallbackHooks(input));
  });

  it('falls back on an API error', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test';
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: { message: 'boom' } }), { status: 500, headers: { 'content-type': 'application/json' } }));
    const r = await generateHooks(input);
    expect(r.fallback).toBe(true);
    expect(r.pages).toHaveLength(3);
  });

  it('falls back on malformed model output', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test';
    const completion = { id: 'x', object: 'chat.completion', created: 0, model: 'gpt-4.1-mini', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '{"pages":[{"aesthetic":"noir","hooks":["one"]}]}' } }] };
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify(completion), { status: 200, headers: { 'content-type': 'application/json' } }));
    const r = await generateHooks(input);
    expect(r).toMatchObject({ fallback: true, reason: 'malformed output' });
  });

  it('falls back with no key configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const r = await generateHooks(input);
    expect(r.fallback).toBe(true);
  });
});
