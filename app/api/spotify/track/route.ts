import { artistGenres, getTrack, parseTrackId, SpotifyError } from '@/lib/analyzer/spotify';

/** GET /api/spotify/track?url=<pasted Spotify link> → { track: SpotifyTrack, ms }. Add &genres=1 to log artist genres. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const id = parseTrackId(params.get('url') ?? '');
  if (!id) return Response.json({ error: 'invalid_url' }, { status: 400 });
  const t0 = performance.now();
  try {
    const track = await getTrack(id);
    const ms = Math.round(performance.now() - t0);
    if (params.get('genres') === '1') {
      const genres = await artistGenres(id).catch(() => null);
      console.info('[spotify/track] artist genres', id, genres === null ? 'missing' : genres.length ? genres : 'empty');
      return Response.json({ track, ms, genres });
    }
    return Response.json({ track, ms });
  } catch (e) {
    if (e instanceof Error && e.message.includes('not set')) {
      console.error('[spotify] SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing in this deployment');
      return Response.json({ error: 'spotify_not_configured' }, { status: 503 });
    }
    if (e instanceof SpotifyError && (e.status === 404 || e.status === 400)) return Response.json({ error: 'not_found' }, { status: 404 });
    console.error('[spotify/track] failed:', e instanceof Error ? e.message : e);
    return Response.json({ error: 'lookup_failed' }, { status: 502 });
  }
}
