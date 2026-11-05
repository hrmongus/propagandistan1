import OpenAI, { toFile } from 'openai';

/*
 * Lyrics from the 30s preview with whisper-1 (verbose_json → segment timestamps + no_speech_prob).
 * gpt-4o-mini-transcribe was tested and rejected: it hallucinates on music and returns no segments.
 * Whisper invents text on instrumentals ("thank you for watching", "♪"), so isInstrumental() filters that.
 */

export type Segment = { start: number; end: number; text: string; noSpeechProb: number; avgLogprob: number };
export type Transcript = { text: string; language: string | null; segments: Segment[]; instrumental: boolean; reason: string; lyricLine: string | null; ms: number };

const GARBAGE = /(thank(s| you) for watching|subscribe|check out my other videos|amara\.org|subtitles|субтитр|transcribed by|musical interlude|♪|\[music\]|www\.|\.com)/i;

export function isInstrumental(segments: Segment[], text: string): [boolean, string] {
  const words = text.match(/[\p{L}\p{N}']+/gu) ?? [];
  if (words.length < 4) return [true, 'too few words'];
  if (GARBAGE.test(text) && words.length < 20) return [true, 'garbage phrase'];
  const dur = segments.reduce((a, s) => a + (s.end - s.start), 0) || 1;
  const nsp = segments.reduce((a, s) => a + s.noSpeechProb * (s.end - s.start), 0) / dur;
  const lp = segments.reduce((a, s) => a + s.avgLogprob * (s.end - s.start), 0) / dur;
  const uniq = new Set(words.map((w) => w.toLowerCase())).size / words.length;
  if (lp < -1.0) return [true, `low confidence (logprob ${lp.toFixed(2)})`];
  if (nsp > 0.6 && lp < -0.7) return [true, `no speech (${nsp.toFixed(2)})`];
  if (words.length >= 8 && uniq < 0.3) return [true, 'repetition'];
  return [false, `nsp ${nsp.toFixed(2)} lp ${lp.toFixed(2)}`];
}

/** The segment overlapping the hook window most, extended to ≥4 words and trimmed to ≤12. */
export function pickLyricLine(segments: Segment[], hookStart: number, hookEnd: number) {
  if (!segments.length) return null;
  const overlap = (s: Segment) => Math.max(0, Math.min(s.end, hookEnd) - Math.max(s.start, hookStart));
  const i = segments.reduce((bi, s, j) => (overlap(s) > overlap(segments[bi]) ? j : bi), 0);
  let words = segments[i].text.trim().split(/\s+/);
  if (words.length < 4 && segments[i + 1]) words = words.concat(segments[i + 1].text.trim().split(/\s+/));
  if (words.length < 4) return null;
  // Prefer ending at a natural break within 12 words.
  let cut = Math.min(12, words.length);
  for (let j = cut; j >= 4; j--) if (/[,.!?;]$/.test(words[j - 1])) { cut = j; break; }
  return words.slice(0, cut).join(' ').replace(/[,;]$/, '');
}

export async function transcribePreview(mp3: Uint8Array, hookStart: number, hookEnd: number): Promise<Transcript> {
  const t0 = performance.now();
  const client = new OpenAI();
  const r = await client.audio.transcriptions.create({
    model: 'whisper-1',
    file: await toFile(mp3, 'preview.mp3', { type: 'audio/mpeg' }),
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });
  const segments: Segment[] = (r.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text, noSpeechProb: s.no_speech_prob, avgLogprob: s.avg_logprob }));
  const [instrumental, reason] = isInstrumental(segments, r.text);
  return {
    text: instrumental ? '' : r.text,
    language: r.language || null,
    segments: instrumental ? [] : segments,
    instrumental,
    reason,
    lyricLine: instrumental ? null : pickLyricLine(segments, hookStart, hookEnd),
    ms: Math.round(performance.now() - t0),
  };
}
