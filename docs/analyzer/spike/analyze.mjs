import fs from "node:fs";
import { MPEGDecoder } from "mpg123-decoder";
import { Essentia, EssentiaWASM } from "essentia.js";
const t0 = performance.now();
const essentia = new Essentia(EssentiaWASM);
const tInit = performance.now() - t0;

export function mood(mode, energy, bpm) {
  const fast = bpm >= 115, hi = energy >= 60, lo = energy < 35;
  if (mode === "minor") return hi ? (fast ? "Dark, restless" : "Heavy, brooding") : lo ? "Melancholic" : "Bittersweet";
  return hi ? (fast ? "Euphoric" : "Confident") : lo ? "Dreamy, calm" : fast ? "Carefree" : "Warm";
}

export async function analyze(buf) {
  const decoder = new MPEGDecoder(); await decoder.ready;
  const t = performance.now();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(buf)); decoder.free();
  const n = channelData[0].length, mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = channelData.length > 1 ? (channelData[0][i] + channelData[1][i]) / 2 : channelData[0][i];
  const tDecode = performance.now() - t;
  const v = essentia.arrayToVector(mono);
  const r = essentia.RhythmExtractor2013(v, 208, "multifeature", 40);
  const k = essentia.KeyExtractor(v, true, 4096, 4096, 12, 3500, 60, 25, 0.2, "bgate", sampleRate, 0.0001, 440, "cosine", "hann");
  // RMS per 0.5s frame
  const hop = Math.floor(sampleRate / 2), frames = [];
  for (let s = 0; s + hop <= n; s += hop) { let a = 0; for (let i = s; i < s + hop; i++) a += mono[i] * mono[i]; frames.push(Math.sqrt(a / hop)); }
  const db = frames.map(x => 20 * Math.log10(x + 1e-9));
  const loud = frames.filter(x => x > 1e-4);
  const rmsDb = 20 * Math.log10(Math.sqrt(loud.reduce((a, x) => a + x * x, 0) / Math.max(1, loud.length)) + 1e-9);
  const energy = Math.max(0, Math.min(100, Math.round((rmsDb + 30) / 22 * 100))); // -30 dBFS→0, -8 dBFS→100
  const W = 20; let best = 0, bestI = 0; // 10s window
  for (let i = 0; i + W <= db.length; i++) { const m = db.slice(i, i + W).reduce((a, x) => a + x, 0) / W; if (i === 0 || m > best) { best = m; bestI = i; } }
  const bpm = Math.round(r.bpm * 10) / 10, mode = k.scale;
  const out = { bpm, bpm_confidence: Math.round(r.confidence * 100) / 100, key: k.key, mode, key_strength: Math.round(k.strength * 100) / 100,
    energy, rms_db: Math.round(rmsDb * 10) / 10, hook_start: bestI / 2, hook_end: bestI / 2 + 10, mood: mood(mode, energy, bpm),
    ms_decode: Math.round(tDecode), ms_total: Math.round(performance.now() - t) };
  r.ticks.delete?.(); v.delete?.();
  return out;
}

if (process.argv[2]) {
  const dir = process.argv[2], res = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".mp3"))) { res[f.replace(".mp3", "")] = await analyze(fs.readFileSync(dir + "/" + f)); }
  fs.writeFileSync("analysis.json", JSON.stringify(res, null, 1));
  console.log("init ms", Math.round(tInit), "rss MB", Math.round(process.memoryUsage().rss / 1e6));
  const ts = JSON.parse(fs.readFileSync("testset.json"));
  for (const t of ts) { const a = res[t.id]; if (a) console.log(`${t.cat.padEnd(14)} ${String(a.bpm).padStart(6)} (c${a.bpm_confidence}) ${(a.key + " " + a.mode).padEnd(9)} E${String(a.energy).padStart(3)} hook ${a.hook_start}-${a.hook_end}s ${a.mood.padEnd(15)} ${a.ms_total}ms | ${t.artist.slice(0, 18)} - ${t.name.slice(0, 28)}`); }
}
