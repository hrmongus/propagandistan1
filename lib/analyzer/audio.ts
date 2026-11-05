import { MPEGDecoder } from 'mpg123-decoder';
import { Essentia, EssentiaWASM } from 'essentia.js';

/*
 * Audio analysis of a 30s MP3 preview: Essentia.js (WASM) for BPM and key, plain RMS for energy and the hook
 * window. ~2.7s per preview on a 1-vCPU container. All timestamps are relative to the preview, not the song.
 */

export type AudioAnalysis = {
  bpm: number;
  bpmConfidence: number;
  key: string;
  mode: 'major' | 'minor';
  keyStrength: number;
  energy: number; // 0–100
  rmsDb: number;
  hookStart: number; // seconds into the preview
  hookEnd: number;
  mood: string;
  ms: number;
};

let essentia: Essentia | null = null;

/** -24 dBFS → 0, -7 dBFS → 100. Loudness only, so loud masters of quiet songs read high (known limitation). */
export const energyFromRms = (rmsDb: number) => Math.max(0, Math.min(100, Math.round(((rmsDb + 24) / 17) * 100)));

export function moodLabel(mode: string, energy: number, bpm: number) {
  const fast = bpm >= 115, hi = energy >= 60, lo = energy < 35;
  if (mode === 'minor') return hi ? (fast ? 'Dark, restless' : 'Heavy, brooding') : lo ? 'Melancholic' : 'Bittersweet';
  return hi ? (fast ? 'Euphoric' : 'Confident') : lo ? 'Dreamy, calm' : fast ? 'Carefree' : 'Warm';
}

export async function analyzeMp3(buf: ArrayBuffer | Uint8Array): Promise<AudioAnalysis> {
  const t0 = performance.now();
  essentia ??= new Essentia(EssentiaWASM);
  // One decoder per file: reusing one after reset() throws MPG123_ERR.
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const { channelData, sampleRate } = decoder.decode(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
  decoder.free();
  const n = channelData[0]?.length ?? 0;
  if (n < sampleRate * 5) throw new Error('preview too short to analyze');
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = channelData.length > 1 ? (channelData[0][i] + channelData[1][i]) / 2 : channelData[0][i];

  const v = essentia.arrayToVector(mono);
  const r = essentia.RhythmExtractor2013(v, 208, 'multifeature', 40);
  const k = essentia.KeyExtractor(v, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'bgate', sampleRate, 0.0001, 440, 'cosine', 'hann');
  v.delete?.();

  const hop = Math.floor(sampleRate / 2), frames: number[] = [];
  for (let s = 0; s + hop <= n; s += hop) {
    let a = 0;
    for (let i = s; i < s + hop; i++) a += mono[i] * mono[i];
    frames.push(Math.sqrt(a / hop));
  }
  const db = frames.map((x) => 20 * Math.log10(x + 1e-9));
  const loud = frames.filter((x) => x > 1e-4);
  const rmsDb = 20 * Math.log10(Math.sqrt(loud.reduce((a, x) => a + x * x, 0) / Math.max(1, loud.length)) + 1e-9);
  const W = 20; // 10s window in 0.5s frames
  let best = -Infinity, bestI = 0;
  for (let i = 0; i + W <= db.length; i++) {
    const m = db.slice(i, i + W).reduce((a, x) => a + x, 0) / W;
    if (m > best) { best = m; bestI = i; }
  }
  const bpm = Math.round(r.bpm * 10) / 10, energy = energyFromRms(rmsDb), mode = k.scale === 'minor' ? 'minor' : 'major';
  return {
    bpm, bpmConfidence: Math.round(r.confidence * 100) / 100, key: k.key, mode, keyStrength: Math.round(k.strength * 100) / 100,
    energy, rmsDb: Math.round(rmsDb * 10) / 10, hookStart: bestI / 2, hookEnd: bestI / 2 + 10, mood: moodLabel(mode, energy, bpm),
    ms: Math.round(performance.now() - t0),
  };
}
