import { after } from 'next/server';
import { getTrack } from '@/lib/analyzer/spotify';
import { createJob } from '@/lib/analyzer/store';
import { runAnalysis } from '@/lib/analyzer/pipeline';

// The background work (Deezer + analysis + Whisper) takes ~5–15s; after() runs within this route's max duration.
export const maxDuration = 60;

/** Starts steps 2–4 for a Spotify track and returns a job id to poll at GET /api/analyze/{id}. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { spotifyId?: string } | null;
  if (!body?.spotifyId || !/^[A-Za-z0-9]{22}$/.test(body.spotifyId)) return Response.json({ error: 'spotifyId required' }, { status: 400 });
  try {
    const track = await getTrack(body.spotifyId);
    const id = await createJob(track);
    after(() => runAnalysis(id, track).catch((e) => console.error('[analyze] pipeline crashed', id, e)));
    return Response.json({ id, track });
  } catch (e) {
    console.error('[analyze]', e);
    return Response.json({ error: 'could not start analysis' }, { status: 502 });
  }
}
