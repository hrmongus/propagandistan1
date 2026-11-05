import { findOnDeezer } from './deezer';
import { analyzeMp3, moodLabel, type AudioAnalysis } from './audio';
import { pickLyricLine, transcribePreview, type Transcript } from './transcribe';
import { matchAesthetics } from './aesthetics';
import { generateHooks } from './hooks';
import { getJob, sb, slug, updateJob, type Job, type StepStatus } from './store';
import type { SpotifyTrack } from './spotify';

/*
 * Steps 2–4 (Deezer → audio analysis + lyrics) run in the background after POST /api/analyze; steps 5–6
 * (aesthetics + hooks) run when the quiz is submitted. Every step degrades: a failure is recorded and the
 * results page renders with whatever is there (no audio → upload/edit fallbacks, no lyrics → hook text only).
 */

export type QuizAnswers = {
  listeners?: string; goal?: string; aesthetics?: string[];
  age?: string; gender?: string; region?: string; moment?: string;
  tried?: string[]; spend?: string;
};

type Steps = Job['steps'];

const time = async <T>(fn: () => Promise<T>) => {
  const t0 = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - t0) };
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

export async function runAnalysis(jobId: string, track: SpotifyTrack) {
  const steps: Steps = { deezer: { status: 'running' }, audio: { status: 'pending' }, lyrics: { status: 'pending' } };
  const set = async (k: string, status: StepStatus, extra: { ms?: number; error?: string } = {}, patch: Partial<Job> = {}) => {
    steps[k] = { status, ...extra };
    await updateJob(jobId, { steps, ...patch });
  };
  await updateJob(jobId, { steps });

  let mp3: Uint8Array | null = null;
  try {
    const { value: m, ms } = await time(async () => {
      const match = await findOnDeezer(track.isrc, track.artists[0] ?? '', track.title);
      if (!match?.preview) return { match, bytes: null };
      const res = await fetch(match.preview, { cache: 'no-store' });
      if (!res.ok) throw new Error(`preview download ${res.status}`);
      return { match, bytes: new Uint8Array(await res.arrayBuffer()) };
    });
    mp3 = m.bytes;
    const deezer = m.match ? { deezerId: m.match.deezerId, via: m.match.via, duration: m.match.duration, hasPreview: !!m.match.preview } : null;
    await set('deezer', m.match ? (mp3 ? 'done' : 'failed') : 'failed', { ms, error: m.match ? (mp3 ? undefined : 'no preview on Deezer') : 'not on Deezer' }, { deezer });
  } catch (e) {
    await set('deezer', 'failed', { error: errMsg(e) });
  }

  if (!mp3) {
    await set('audio', 'skipped');
    await set('lyrics', 'skipped', {}, { status: 'done' });
    return;
  }

  steps.audio = { status: 'running' };
  steps.lyrics = { status: 'running' };
  await updateJob(jobId, { steps });
  // Transcribe in parallel with analysis; the lyric line is picked once the hook window is known.
  const [audio, lyrics] = await Promise.allSettled([time(() => analyzeMp3(mp3!)), time(() => transcribePreview(mp3!, 0, 10))]);

  let analysis: AudioAnalysis | null = null;
  if (audio.status === 'fulfilled') {
    analysis = audio.value.value;
    steps.audio = { status: 'done', ms: audio.value.ms };
  } else steps.audio = { status: 'failed', error: errMsg(audio.reason) };

  let transcript: Transcript | null = null;
  if (lyrics.status === 'fulfilled') {
    transcript = lyrics.value.value;
    if (analysis && !transcript.instrumental) transcript.lyricLine = pickLyricLine(transcript.segments, analysis.hookStart, analysis.hookEnd);
    steps.lyrics = { status: 'done', ms: lyrics.value.ms };
  } else steps.lyrics = { status: 'failed', error: errMsg(lyrics.reason) };

  await updateJob(jobId, { steps, analysis, transcript, status: 'done' });
}

/** Fallback when audio analysis failed: neutral values so aesthetics/hooks still produce something. */
const NEUTRAL = { bpm: 110, energy: 55, mode: 'major', mood: moodLabel('major', 55, 110) };

export async function buildStrategy(jobId: string, answers: QuizAnswers) {
  const job = await getJob(jobId);
  if (!job) throw new Error('job not found');
  const a = (job.analysis ?? null) as AudioAnalysis | null;
  const base = a ? { bpm: a.bpm, energy: a.energy, mode: a.mode, mood: a.mood } : NEUTRAL;

  const t0 = performance.now();
  const scores = matchAesthetics(base.energy, base.bpm, base.mode);
  // Recommended pages: the user's picks first (in match order), filled up to 3 with the best matches.
  const picked = new Set(answers.aesthetics ?? []);
  const recs = [...scores.filter((s) => picked.has(s.name)), ...scores.filter((s) => !picked.has(s.name))].slice(0, 3);
  const msMatch = Math.round(performance.now() - t0);

  const hookRuns = await Promise.allSettled(
    recs.map((r) => generateHooks({ ...base, aesthetic: r.name, age: answers.age, gender: answers.gender, region: answers.region, moment: answers.moment })),
  );
  const hooks = recs.map((r, i) => {
    const h = hookRuns[i];
    return h.status === 'fulfilled'
      ? { aesthetic: r.name, pack: r.pack, pct: r.pct, hooks: h.value.hooks, provider: h.value.provider, ms: h.value.ms, tokens: [h.value.inputTokens, h.value.outputTokens] }
      : { aesthetic: r.name, pack: r.pack, pct: r.pct, hooks: [] as string[], error: errMsg(h.reason) };
  });

  const t = job.transcript as Transcript | null;
  const id = slug(10);
  const row = {
    id,
    job_id: jobId,
    answers,
    track: { ...job.track, deezerId: (job.deezer as { deezerId?: number } | null)?.deezerId ?? null },
    analysis: { ...(a ?? {}), fallback: !a, instrumental: t?.instrumental ?? null, lyricLine: t?.lyricLine ?? null, language: t?.language ?? null },
    hooks,
    aesthetic_scores: scores,
  };
  const { error } = await sb().from('strategies').insert(row);
  if (error) throw error;
  return { id, msMatch };
}

export async function getStrategy(id: string) {
  const { data, error } = await sb().from('strategies').select('id, created_at, answers, track, analysis, hooks, aesthetic_scores').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
