import config from './aesthetics.json';

/*
 * The 20 aesthetics and how well each fits a track. Spotify returns no genres in Development Mode, so matching
 * uses only audio features (energy, tempo, mode). Each dimension scores by distance from the range centre;
 * tempo also accepts half/double time because trap is often detected at half speed.
 */

export type Pack = 'golden' | 'midnight' | 'coastal' | 'forest';
export type Aesthetic = { name: string; energy: [number, number]; tempo: [number, number]; mode: 'major' | 'minor' | 'any'; pack: Pack };
export type AestheticScore = { name: string; pack: Pack; pct: number };

export const AESTHETICS = config as Aesthetic[];

const fromCentre = (x: number, [lo, hi]: [number, number]) => Math.abs(x - (lo + hi) / 2) / ((hi - lo) / 2);

export function matchAesthetics(energy: number, bpm: number, mode: string): AestheticScore[] {
  const raw = AESTHETICS.map((a) => {
    const tempos = [bpm, bpm * 2, bpm / 2].map((b, i) => fromCentre(b, a.tempo) + (i ? 0.15 : 0));
    const dt = Math.min(...tempos), de = fromCentre(energy, a.energy);
    const dm = a.mode === mode ? 0 : a.mode === 'any' ? 0.35 : 0.8;
    return { name: a.name, pack: a.pack, s: Math.exp(-(0.5 * de ** 2 + 0.35 * dt ** 2 + dm ** 2)) };
  });
  const top = Math.max(...raw.map((r) => r.s));
  const topPct = 80 + 14 * top; // the best match lands at 80–94% depending on how clean the fit is
  return raw.map((r) => ({ name: r.name, pack: r.pack, pct: Math.round((topPct * r.s) / top) })).sort((a, b) => b.pct - a.pct);
}
