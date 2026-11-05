/* Types for the analyzer's content config. Components import data from '@/lib/analyzer/config', never inline it. */

export type PackId = 'golden' | 'midnight' | 'coastal' | 'forest';

export type Pack = { id: PackId; name: string; previewClipUrl: string };

export type Aesthetic = {
  id: string;
  name: string;
  /** Genres this aesthetic suits; Spotify returns no artist genres in Development Mode, so this is for copy/LLM context. */
  genres: string[];
  /** Exactly 4 example image URLs. */
  images: [string, string, string, string];
  /** Example fan page handle, e.g. "@oldmoney.sounds". */
  handle: string;
  /** One-line content angle for this kind of page. */
  angle: string;
  pack: PackId;
};

export type Moment = { id: string; label: string; defaultHook: string };

export type ListenerBracket = 'lt1k' | '1k-10k' | '10k-50k' | '50k-100k' | '100k+';

export type QuizOption = { id: string; label: string };
export type QuizQuestion =
  | { id: string; type: 'single'; prompt: string; options: QuizOption[] }
  | { id: string; type: 'multi'; prompt: string; options: QuizOption[]; max?: number };

/** What the quiz produces. Keys match quiz question ids. */
export type QuizAnswers = {
  listeners: ListenerBracket;
  goal?: string;
  blocker?: string;
  /** Aesthetic ids in pick order (1–3). */
  aesthetics: string[];
  age?: string;
  gender?: string;
  /** Moment ids. */
  moments?: string[];
  time?: string;
  release?: string;
  experience?: string;
};
