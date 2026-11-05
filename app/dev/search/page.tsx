'use client';

import { useState } from 'react';

export default function DevSearch() {
  const [q, setQ] = useState('');
  const [out, setOut] = useState<unknown>(null);
  const [clientMs, setClientMs] = useState<number | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const t0 = performance.now();
    const isLink = /spotify\.com\/|^spotify:track:/.test(q.trim());
    const res = await fetch(isLink ? `/api/spotify/track?genres=1&url=${encodeURIComponent(q)}` : `/api/spotify/search?q=${encodeURIComponent(q)}`);
    setOut(await res.json());
    setClientMs(Math.round(performance.now() - t0));
  };

  return (
    <main>
      <h1 style={{ fontSize: 18 }}>/dev/search</h1>
      <form onSubmit={run}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Song name, or paste a Spotify track link" style={{ width: 420 }} /> <button>Go</button>
        {clientMs !== null && <small> round trip {clientMs}ms</small>}
      </form>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{out ? JSON.stringify(out, null, 2) : ''}</pre>
    </main>
  );
}
