/*
 * Spotify Web API, client-credentials flow (no user login). Development Mode apps get a stripped track object:
 * no popularity, no preview_url; artists have no genres/followers. ISRC is present. See docs/analyzer/NOTES.md.
 */

export type SpotifyTrack = {
  spotifyId: string;
  title: string;
  artists: string[];
  artwork: string | null;
  isrc: string | null;
  releaseDate: string | null;
  durationMs: number;
};

let token: { value: string; expires: number } | null = null;

async function accessToken() {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const id = process.env.SPOTIFY_CLIENT_ID, secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}`);
  const d = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: d.access_token, expires: Date.now() + d.expires_in * 1000 };
  return token.value;
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch('https://api.spotify.com/v1/' + path, { headers: { Authorization: 'Bearer ' + (await accessToken()) }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Spotify ${path.split('?')[0]} ${res.status}`);
  return res.json() as Promise<T>;
}

type RawTrack = {
  id: string; name: string; duration_ms: number; artists: { name: string }[];
  external_ids?: { isrc?: string }; album: { images?: { url: string }[]; release_date?: string };
};

const toTrack = (t: RawTrack): SpotifyTrack => ({
  spotifyId: t.id,
  title: t.name,
  artists: t.artists.map((a) => a.name),
  artwork: t.album.images?.[0]?.url ?? null,
  isrc: t.external_ids?.isrc?.toUpperCase() ?? null,
  releaseDate: t.album.release_date ?? null,
  durationMs: t.duration_ms,
});

/** Max 10 results: Development Mode rejects limit > 10. */
export async function searchTracks(q: string, limit = 10) {
  const d = await api<{ tracks: { items: RawTrack[] } }>(`search?type=track&limit=${Math.min(limit, 10)}&q=${encodeURIComponent(q)}`);
  return d.tracks.items.map(toTrack);
}

export async function getTrack(id: string) {
  return toTrack(await api<RawTrack>(`tracks/${encodeURIComponent(id)}`));
}
