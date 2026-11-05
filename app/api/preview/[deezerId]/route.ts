import { freshPreviewUrl } from '@/lib/analyzer/deezer';

/*
 * Stable audio URL for <audio src>: every request mints a freshly signed Deezer preview URL (they expire after
 * 15 min) and redirects to it. The MP3 itself streams straight from Deezer's CDN, which allows any origin.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ deezerId: string }> }) {
  const { deezerId } = await params;
  if (!/^\d{1,15}$/.test(deezerId)) return new Response('bad id', { status: 400 });
  const url = await freshPreviewUrl(deezerId).catch(() => null);
  if (!url) return new Response('no preview', { status: 404 });
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } });
}
