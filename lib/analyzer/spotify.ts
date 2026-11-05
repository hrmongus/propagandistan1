/*
 * Spotify Web API, client-credentials flow (no user login), token cached until it expires. Development Mode apps
 * get a stripped track object: no `popularity` (we return null), no preview_url; artists come back without genres,
 * popularity or followers. Search is capped at 10 results. Details in docs/analyzer/TECH-SETUP.md.
 */

export type SpotifyTrack = {
  id: string;
  title: string;
  artists: string[];
  artworkUrl: string | null;
  releaseDate: string | null;
  /** Always null for a Development Mode app: Spotify removed the field (Feb 2026). Kept so the shape is stable. */
  popularity: number | null;
  /** open.spotify.com link, required for attribution (link back to Spotify wherever we show its data). */
  spotifyUrl: string;
};

let token: { value: string; expires: number } | null = null;

async function accessToken() {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  // Trim: keys pasted into a dashboard often carry a trailing space or newline, which Spotify rejects as invalid_client.
  const id = process.env.SPOTIFY_CLIENT_ID?.trim(), secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 200);
    throw new Error(`Spotify token ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: d.access_token, expires: Date.now() + d.expires_in * 1000 };
  return token.value;
}

export class SpotifyError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function api<T>(path: string, retry = true): Promise<T> {
  const res = await fetch('https://api.spotify.com/v1/' + path, { headers: { Authorization: 'Bearer ' + (await accessToken()) }, cache: 'no-store' });
  if (res.status === 401 && retry) { token = null; return api(path, false); } // token revoked early
  if (!res.ok) throw new SpotifyError(res.status, `Spotify ${path.split('?')[0]} ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

type RawTrack = {
  id: string; name: string; popularity?: number; artists: { id: string; name: string }[];
  album: { images?: { url: string }[]; release_date?: string }; external_urls?: { spotify?: string };
};

const toTrack = (t: RawTrack): SpotifyTrack => ({
  id: t.id,
  title: t.name,
  artists: t.artists.map((a) => a.name),
  artworkUrl: t.album.images?.[0]?.url ?? null,
  releaseDate: t.album.release_date ?? null,
  popularity: typeof t.popularity === 'number' ? t.popularity : null,
  spotifyUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
});

/** Max 10 results: Development Mode rejects limit > 10. */
export async function searchTracks(q: string, limit = 10) {
  const d = await api<{ tracks: { items: RawTrack[] } }>(`search?type=track&limit=${Math.min(Math.max(limit, 1), 10)}&q=${encodeURIComponent(q)}`);
  return d.tracks.items.map(toTrack);
}

/** Accepts an open.spotify.com track link (any locale prefix, ?si=…), a spotify:track: URI, or a bare id. */
export function parseTrackId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?track\/([A-Za-z0-9]{22})/) ?? s.match(/^spotify:track:([A-Za-z0-9]{22})$/) ?? s.match(/^([A-Za-z0-9]{22})$/);
  return m ? m[1] : null;
}

export async function getTrack(id: string) {
  return toTrack(await api<RawTrack>(`tracks/${encodeURIComponent(id)}`));
}

/** Artist genres, for logging: empty for Development Mode apps (verified live 2026-11-05). */
export async function artistGenres(trackId: string) {
  const t = await api<RawTrack>(`tracks/${encodeURIComponent(trackId)}`);
  const a = await api<{ genres?: string[] }>(`artists/${t.artists[0].id}`);
  return a.genres ?? null;
}
