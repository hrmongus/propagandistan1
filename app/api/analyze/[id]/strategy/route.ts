import { buildStrategy, getStrategy, type QuizAnswers } from '@/lib/analyzer/pipeline';

export const maxDuration = 30;

/** Quiz submitted: steps 5–6 (aesthetic match + hooks), saved as a strategy reachable at /s/{id}. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answers = ((await req.json().catch(() => null)) ?? {}) as QuizAnswers;
  try {
    const t0 = performance.now();
    const s = await buildStrategy(id, answers);
    const ms = Math.round(performance.now() - t0);
    return Response.json({ id: s.id, ms, strategy: await getStrategy(s.id) });
  } catch (e) {
    console.error('[analyze/strategy]', id, e);
    return Response.json({ error: 'could not build strategy' }, { status: 500 });
  }
}
