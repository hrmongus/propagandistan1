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
    if (e instanceof Error && e.message.includes('not set')) {
      console.error('[spotify] SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing in this deployment');
      return Response.json({ error: 'spotify_not_configured' }, { status: 503 });
    }
    console.error('[spotify/search] failed:', e instanceof Error ? e.message : e);
    return Response.json({ error: 'search_failed' }, { status: 502 });
  }
}
