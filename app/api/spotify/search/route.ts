import { searchTracks } from '@/lib/analyzer/spotify';

/** GET /api/spotify/search?q= → { tracks: SpotifyTrack[], ms } (max 10). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim().slice(0, 200);
  if (!q) return Response.json({ tracks: [], ms: 0 });
  const t0 = performance.now();
  try {
    const tracks = await searchTracks(q);
    return Response.json({ tracks, ms: Math.round(performance.now() - t0) });
  } catch (e) {
    console.error('[spotify/search]', e);
    return Response.json({ error: 'search_failed' }, { status: 502 });
  }
}
