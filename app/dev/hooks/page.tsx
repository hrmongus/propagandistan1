'use client';

import { useState } from 'react';
import { AESTHETICS, MOMENTS } from '@/lib/analyzer/config';

export default function DevHooks() {
  const [out, setOut] = useState<unknown>(null);
  const [clientMs, setClientMs] = useState<number | null>(null);

  const run = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get('title'), artist: f.get('artist'), lyricLine: f.get('lyricLine'),
      genres: String(f.get('genres') || '').split(',').map((g) => g.trim()).filter(Boolean),
      aesthetics: [f.get('a1'), f.get('a2'), f.get('a3')].filter(Boolean),
      age: f.get('age'), gender: f.get('gender'), moments: f.getAll('moments'), forceError: f.get('forceError') === 'on',
    };
    const t0 = performance.now();
    const res = await fetch('/api/hooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setOut(await res.json());
    setClientMs(Math.round(performance.now() - t0));
  };

  const select = (name: string, def: string) => (
    <select name={name} defaultValue={def}>{AESTHETICS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
  );

  return (
    <main>
      <h1 style={{ fontSize: 18 }}>/dev/hooks</h1>
      <form onSubmit={run} style={{ display: 'grid', gap: 6, maxWidth: 560 }}>
        <input name="title" defaultValue="Heart Is the Key" placeholder="Title" />
        <input name="artist" defaultValue="Lubó" placeholder="Artist" />
        <input name="genres" placeholder="Genres, comma separated (optional)" />
        <input name="lyricLine" placeholder="Lyric line (optional)" />
        <div>{select('a1', 'noir')} {select('a2', 'synthwave')} {select('a3', 'streetwear')}</div>
        <div>
          <select name="age" defaultValue="18-24"><option>13-17</option><option>18-24</option><option>25-34</option><option>35+</option></select>{' '}
          <select name="gender" defaultValue="mixed"><option value="female">Mostly women</option><option value="male">Mostly men</option><option value="mixed">Mixed</option></select>
        </div>
        <div>{MOMENTS.map((m) => <label key={m.id} style={{ marginRight: 8 }}><input type="checkbox" name="moments" value={m.id} defaultChecked={m.id === 'night-drive'} /> {m.label}</label>)}</div>
        <label><input type="checkbox" name="forceError" /> Force an error (fallback test; ignored in production)</label>
        <button>Generate</button>
      </form>
      {clientMs !== null && <p>round trip {clientMs}ms</p>}
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{out ? JSON.stringify(out, null, 2) : ''}</pre>
    </main>
  );
}
