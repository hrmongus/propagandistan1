/*
 * Deezer public API, server-side only (the API sends no CORS headers; the preview CDN does). Preview URLs are
 * signed and expire 15 minutes after issue, so we store the Deezer track id and mint a fresh URL per play
 * (see app/api/preview/[deezerId]/route.ts).
 */

export type DeezerMatch = { deezerId: number; preview: string | null; duration: number; via: 'isrc' | 'search' };

type DzTrack = { id: number; title: string; preview?: string; duration: number; artist: { name: string }; error?: unknown };

async function dz<T>(path: string): Promise<T> {
  const res = await fetch('https://api.deezer.com/' + path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  return res.json() as Promise<T>;
}

const norm = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)|\[.*?\]| - .*/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export async function findOnDeezer(isrc: string | null, artist: string, title: string): Promise<DeezerMatch | null> {
  if (isrc) {
    const t = await dz<DzTrack>(`track/isrc:${encodeURIComponent(isrc.toUpperCase())}`);
    if (!t.error) return { deezerId: t.id, preview: t.preview || null, duration: t.duration, via: 'isrc' };
  }
  const q = `artist:"${artist}" track:"${title}"`;
  const s = await dz<{ data?: DzTrack[] }>(`search?q=${encodeURIComponent(q)}`);
  const hit = s.data?.find((c) => norm(c.artist.name) === norm(artist) && (norm(c.title).includes(norm(title)) || norm(title).includes(norm(c.title))));
  return hit ? { deezerId: hit.id, preview: hit.preview || null, duration: hit.duration, via: 'search' } : null;
}

/** A freshly signed preview URL (valid ~15 min), or null if Deezer has none for this track. */
export async function freshPreviewUrl(deezerId: number | string) {
  const t = await dz<DzTrack>(`track/${encodeURIComponent(String(deezerId))}`);
  return t.error ? null : t.preview || null;
}
