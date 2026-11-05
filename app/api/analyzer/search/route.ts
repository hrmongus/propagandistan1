import { searchTracks } from '@/lib/analyzer/spotify';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q) return Response.json({ tracks: [] });
  const t0 = performance.now();
  try {
    const tracks = await searchTracks(q);
    return Response.json({ tracks, ms: Math.round(performance.now() - t0) });
  } catch (e) {
    console.error('[analyzer/search]', e);
    return Response.json({ error: 'search failed' }, { status: 502 });
  }
}
