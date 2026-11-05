'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Track = { spotifyId: string; title: string; artists: string[]; artwork: string | null; isrc: string | null; releaseDate: string | null };
type Job = { status: string; steps: Record<string, { status: string; ms?: number; error?: string }> };

/** Search → pick track (starts background analysis) → quiz (while it runs) → strategy → /s/{id}. */
export function AnalyzerFlow({ aesthetics }: { aesthetics: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searchMs, setSearchMs] = useState<number | null>(null);
  const [picked, setPicked] = useState<Track | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/analyzer/search?q=' + encodeURIComponent(q)).then((r) => r.json());
    setResults(r.tracks ?? []);
    setSearchMs(r.ms ?? null);
  };

  const pick = async (t: Track) => {
    setPicked(t);
    const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spotifyId: t.spotifyId }) }).then((r) => r.json());
    if (r.id) setJobId(r.id); else setErr(r.error ?? 'failed');
  };

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    const poll = async () => {
      const j = (await fetch('/api/analyze/' + jobId, { cache: 'no-store' }).then((r) => r.json())) as Job;
      if (!alive) return;
      setJob(j);
      if (j.status !== 'done') setTimeout(poll, 1500);
    };
    poll();
    return () => { alive = false; };
  }, [jobId]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!jobId) return;
    const f = new FormData(e.currentTarget);
    const answers = {
      listeners: f.get('listeners'), goal: f.get('goal'), aesthetics: chosen,
      age: f.get('age'), gender: f.get('gender'), region: f.get('region'), moment: f.get('moment'),
      tried: f.getAll('tried'), spend: f.get('spend'),
    };
    setBusy(true);
    // Wait for the background analysis (normally done long before the quiz is finished).
    for (let i = 0; i < 40 && job?.status !== 'done'; i++) {
      const j = (await fetch('/api/analyze/' + jobId, { cache: 'no-store' }).then((r) => r.json())) as Job;
      if (j.status === 'done') break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    const r = await fetch(`/api/analyze/${jobId}/strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(answers) }).then((r) => r.json());
    if (r.id) router.push('/s/' + r.id); else { setErr(r.error ?? 'failed'); setBusy(false); }
  };

  if (!picked)
    return (
      <section>
        <form onSubmit={search}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your song" style={{ width: 280 }} /> <button>Search</button>
          {searchMs !== null && <small> {searchMs}ms</small>}
        </form>
        <ul>
          {results.map((t) => (
            <li key={t.spotifyId} style={{ margin: '6px 0' }}>
              {t.artwork && <img src={t.artwork} alt="" width={40} height={40} style={{ verticalAlign: 'middle' }} />} {t.title} — {t.artists.join(', ')}{' '}
              <small>({t.releaseDate}, ISRC {t.isrc ?? 'none'})</small> <button onClick={() => pick(t)}>This one</button>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <section>
      <p><b>{picked.title}</b> — {picked.artists.join(', ')}</p>
      <p>
        Analysis:{' '}
        {job ? Object.entries(job.steps).map(([k, s]) => `${k} ${s.status}${s.ms ? ` (${(s.ms / 1000).toFixed(1)}s)` : ''}${s.error ? ` – ${s.error}` : ''}`).join(' · ') : 'starting…'}
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        <label>Current monthly listeners <input name="listeners" inputMode="numeric" required /></label>
        <label>Goal <select name="goal"><option>More streams</option><option>Grow followers</option><option>Get playlisted</option><option>Go viral with one song</option></select></label>
        <fieldset>
          <legend>Aesthetics (up to 3)</legend>
          {aesthetics.map((a) => (
            <label key={a} style={{ display: 'inline-block', marginRight: 10 }}>
              <input type="checkbox" checked={chosen.includes(a)} disabled={!chosen.includes(a) && chosen.length >= 3} onChange={(e) => setChosen((c) => (e.target.checked ? [...c, a] : c.filter((x) => x !== a)))} /> {a}
            </label>
          ))}
        </fieldset>
        <label>Audience age <select name="age"><option>13-17</option><option>18-24</option><option>25-34</option><option>35+</option></select></label>
        <label>Audience gender <select name="gender"><option>mostly female</option><option>mostly male</option><option>mixed</option></select></label>
        <label>Region <select name="region"><option>US</option><option>UK</option><option>Europe</option><option>Latin America</option><option>Asia</option><option>Global</option></select></label>
        <label>Listening moment <select name="moment"><option>late night drive</option><option>gym</option><option>getting ready to go out</option><option>heartbreak at 2am</option><option>studying</option><option>summer day</option></select></label>
        <fieldset>
          <legend>Tried so far</legend>
          {['Playlist pitching', 'Paid ads', 'Posting on TikTok myself', 'Fan pages', 'Nothing yet'].map((t) => <label key={t} style={{ marginRight: 10 }}><input type="checkbox" name="tried" value={t} /> {t}</label>)}
        </fieldset>
        <label>Spent so far <select name="spend"><option>$0</option><option>under $100</option><option>$100–500</option><option>$500+</option></select></label>
        <button disabled={busy}>{busy ? 'Building your strategy…' : 'See my strategy'}</button>
        {err && <p>{err}</p>}
      </form>
    </section>
  );
}
