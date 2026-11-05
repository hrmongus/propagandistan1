import { analyzeMp3 } from '@/lib/analyzer/audio';
import { pickLyricLine, transcribePreview } from '@/lib/analyzer/transcribe';

export const maxDuration = 60;

/*
 * Fallback for tracks Deezer doesn't have: analyze an uploaded MP3 directly (spike only, not wired into the
 * flow). Only the first ~30s are analyzed so results are comparable with previews. Vercel caps request bodies
 * at 4.5MB, so a full-length upload would need direct-to-storage upload in production.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File) || file.size > 4_400_000) return Response.json({ error: 'MP3 under 4.4MB required' }, { status: 400 });
  const mp3 = new Uint8Array(await file.arrayBuffer());
  try {
    const [analysis, transcript] = await Promise.all([analyzeMp3(mp3), transcribePreview(mp3, 0, 10)]);
    if (!transcript.instrumental) transcript.lyricLine = pickLyricLine(transcript.segments, analysis.hookStart, analysis.hookEnd);
    return Response.json({ analysis, transcript });
  } catch (e) {
    console.error('[analyzer/upload]', e);
    return Response.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
