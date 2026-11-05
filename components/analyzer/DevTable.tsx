'use client';

import { useState } from 'react';

/*
 * Runs the real pipeline (same API routes as the user flow) on every test-set track, 4 at a time, and shows one
 * row per track. Costs are estimates from list prices: whisper-1 $0.006/min; hooks by token usage.
 */

type Step = { status: string; ms?: number; error?: string };
type Row = {
  id: string; state: string; title?: string; artist?: string; isrc?: string | null;
  steps?: Record<string, Step>; deezer?: { deezerId: number; via: string; hasPreview: boolean } | null;
  analysis?: { bpm: number; key: string; mode: string; energy: number; mood: string; hookStart: number; hookEnd: number; bpmConfidence: number } | null;
  transcript?: { text: string; instrumental: boolean; reason: string; lyricLine: string | null; language: string | null } | null;
  hooks?: { aesthetic: string; hooks: string[]; provider?: string; ms?: number; tokens?: [number, number] }[];
  top3?: string; strategyId?: string; msTotal?: number; msStrategy?: number; cost?: number;
};

const ANSWERS = { listeners: '1000', goal: 'More streams', aesthetics: [], age: '18-24', gender: 'mixed', region: 'US', moment: 'late night drive', tried: ['Nothing yet'], spend: '$0' };
// $ per 1M tokens [input, output]
const PRICES: Record<string, [number, number]> = { 'gpt-4.1-mini': [0.4, 1.6], 'claude-haiku-5-5': [0.1, 0.5] };

export function DevTable({ ids }: { ids: string[] }) {
  const [rows, setRows] = useState<Row[]>(ids.map((id) => ({ id, state: 'queued' })));
  const [running, setRunning] = useState(false);
  const patch = (id: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const runOne = async (id: string) => {
    const t0 = performance.now();
    try {
      patch(id, { state: 'analyzing' });
      const start = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spotifyId: id }) }).then((r) => r.json());
      if (!start.id) throw new Error(start.error ?? 'start failed');
      patch(id, { title: start.track.title, artist: start.track.artists?.[0], isrc: start.track.isrc });
      let job: Row & { status?: string } = { id, state: '' };
      for (let i = 0; i < 90; i++) {
        job = await fetch('/api/analyze/' + start.id, { cache: 'no-store' }).then((r) => r.json());
        patch(id, { steps: job.steps, deezer: job.deezer, analysis: job.analysis, transcript: job.transcript });
        if (job.status === 'done') break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      patch(id, { state: 'strategy' });
      const s = await fetch(`/api/analyze/${start.id}/strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ANSWERS) }).then((r) => r.json());
      const hooks = (s.strategy?.hooks ?? []) as NonNullable<Row['hooks']>;
      const scores = (s.strategy?.aesthetic_scores ?? []) as { name: string; pct: number }[];
      const whisperCost = job.steps?.lyrics?.status === 'done' ? 0.003 : 0;
      const hookCost = hooks.reduce((a, h) => { const p = PRICES[h.provider ?? ''] ?? [0, 0]; return a + ((h.tokens?.[0] ?? 0) * p[0] + (h.tokens?.[1] ?? 0) * p[1]) / 1e6; }, 0);
      patch(id, { state: 'done', hooks, top3: scores.slice(0, 3).map((x) => `${x.name} ${x.pct}%`).join(', '), strategyId: s.id, msStrategy: s.ms, msTotal: Math.round(performance.now() - t0), cost: whisperCost + hookCost });
    } catch (e) {
      patch(id, { state: 'error: ' + (e as Error).message });
    }
  };

  const runAll = async () => {
    setRunning(true);
    const queue = [...ids];
    await Promise.all(Array.from({ length: 4 }, async () => { for (let id = queue.shift(); id; id = queue.shift()) await runOne(id); }));
    setRunning(false);
  };

  const done = rows.filter((r) => r.state === 'done');
  const s = (st?: Step) => (st ? `${st.status}${st.ms ? ` ${(st.ms / 1000).toFixed(1)}s` : ''}` : '');
  return (
    <>
      <p>
        <button onClick={runAll} disabled={running}>{running ? 'Running…' : `Run all ${ids.length}`}</button>{' '}
        {done.length > 0 && `done ${done.length} · Deezer match ${done.filter((r) => r.deezer?.hasPreview).length}/${done.length} · avg cost $${(done.reduce((a, r) => a + (r.cost ?? 0), 0) / done.length).toFixed(4)}`}
      </p>
      <table border={1} cellPadding={4} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Track</th><th>Spotify</th><th>ISRC</th><th>Deezer</th><th>BPM / key / energy / mood</th><th>Hook</th><th>Transcript</th><th>Instr.</th><th>Lyric line</th><th>Hooks</th><th>Top 3</th><th>Time per step</th><th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ verticalAlign: 'top' }}>
              <td>{r.artist} – {r.title}<br /><small>{r.state}</small>{r.strategyId && <><br /><a href={'/s/' + r.strategyId}>/s/{r.strategyId}</a></>}</td>
              <td>{r.title ? 'ok' : ''}</td>
              <td>{r.isrc ?? (r.title ? 'none' : '')}</td>
              <td>{r.deezer ? `${r.deezer.via}${r.deezer.hasPreview ? '' : ' (no preview)'}` : r.steps?.deezer?.error ?? ''}</td>
              <td>{r.analysis && `${r.analysis.bpm} (c${r.analysis.bpmConfidence}) / ${r.analysis.key} ${r.analysis.mode} / ${r.analysis.energy} / ${r.analysis.mood}`}</td>
              <td>{r.analysis && `${r.analysis.hookStart}–${r.analysis.hookEnd}s`}</td>
              <td style={{ maxWidth: 260 }}>{r.transcript?.text?.slice(0, 160)}</td>
              <td>{r.transcript ? (r.transcript.instrumental ? `yes (${r.transcript.reason})` : 'no') : ''}</td>
              <td>{r.transcript?.lyricLine}</td>
              <td style={{ maxWidth: 300 }}>{r.hooks?.map((h) => <div key={h.aesthetic}><b>{h.aesthetic}</b>: {h.hooks.join(' · ')}</div>)}</td>
              <td>{r.top3}</td>
              <td>deezer {s(r.steps?.deezer)}<br />audio {s(r.steps?.audio)}<br />lyrics {s(r.steps?.lyrics)}<br />strategy {r.msStrategy ? (r.msStrategy / 1000).toFixed(1) + 's' : ''}<br />total {r.msTotal ? (r.msTotal / 1000).toFixed(1) + 's' : ''}</td>
              <td>{r.cost !== undefined && `$${r.cost.toFixed(4)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
