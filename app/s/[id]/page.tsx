import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VideoCard } from '@/components/analyzer/VideoCard';
import { LeadForm } from '@/components/analyzer/LeadForm';
import { getStrategy } from '@/lib/analyzer/pipeline';

export const metadata: Metadata = { title: 'Your fan page strategy', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Hook = { aesthetic: string; pack: string; pct: number; hooks: string[]; error?: string };

/** Permanent results link (used in emails). Bare, unstyled: proves the data and audio still load later. */
export default async function Strategy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9]{10}$/.test(id)) notFound();
  const s = await getStrategy(id).catch(() => null);
  if (!s) notFound();

  const track = s.track as { title?: string; artists?: string[]; artwork?: string; deezerId?: number | null };
  const a = s.analysis as { bpm?: number; key?: string; mode?: string; energy?: number; mood?: string; hookStart?: number; hookEnd?: number; lyricLine?: string | null; instrumental?: boolean | null; fallback?: boolean };
  const hooks = (s.hooks ?? []) as Hook[];
  const scores = (s.aesthetic_scores ?? []) as { name: string; pct: number }[];
  const answers = s.answers as { listeners?: string; goal?: string };
  const start = Number(String(answers.listeners ?? '').replace(/\D/g, '')) || 500;

  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>
      <h1 style={{ fontSize: 20 }}>{track.title} — {track.artists?.join(', ')}</h1>
      {a.fallback ? (
        <p>We couldn&apos;t analyze the audio for this track (not on Deezer). Showing a general strategy.</p>
      ) : (
        <p>
          {a.bpm} BPM · {a.key} {a.mode} · energy {a.energy}/100 · mood: {a.mood} · hook at {a.hookStart}–{a.hookEnd}s of the preview
          {a.instrumental ? ' · instrumental' : ''}
        </p>
      )}

      <h2 style={{ fontSize: 16 }}>Example fan page videos</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {hooks.map((h, i) => (
          <VideoCard key={h.aesthetic} id={`${id}-${i}`} pack={h.pack} hook={h.hooks[0] ?? ''} lyric={a.lyricLine} deezerId={track.deezerId} hookStart={a.hookStart ?? 0} hookEnd={a.hookEnd ?? 10} label={`${h.aesthetic} (${h.pct}%)`} />
        ))}
      </div>
      {!a.instrumental && <p>Lyric line: <input defaultValue={a.lyricLine ?? ''} placeholder="Add a lyric line" style={{ width: 320 }} /> (edit this line)</p>}

      <h2 style={{ fontSize: 16 }}>Hooks per page</h2>
      <ul>{hooks.map((h) => <li key={h.aesthetic}><b>{h.aesthetic}</b>: {h.hooks.join(' · ') || `(failed: ${h.error})`}</li>)}</ul>

      <h2 style={{ fontSize: 16 }}>Aesthetic match</h2>
      <ol>{scores.slice(0, 8).map((x) => <li key={x.name}>{x.name} {x.pct}%</li>)}</ol>

      <h2 style={{ fontSize: 16 }}>Growth (placeholder numbers)</h2>
      <p>Now {start.toLocaleString()} monthly listeners → 90 days with 3 fan pages: ~{(start * 4).toLocaleString()}–{(start * 9).toLocaleString()} (illustrative).</p>

      <h2 style={{ fontSize: 16 }}>Offer</h2>
      <p>[offer block goes here]</p>

      <h2 style={{ fontSize: 16 }}>Email me this strategy</h2>
      <LeadForm id={id} />
    </main>
  );
}
