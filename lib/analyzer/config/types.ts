/* Types for the Fanpage Blueprint content config. Screens import data from '@/lib/analyzer/config', never inline it. */

export type PackId = 'golden' | 'midnight' | 'coastal' | 'forest';

export type Pack = {
  id: PackId;
  /** Display name, e.g. "Golden Hour". */
  name: string;
  /** Slug used by the site's checkout and fulfilment (lib/data.ts PACKS). */
  checkoutSlug: 'golden-hour' | 'midnight-city' | 'coastal-drive' | 'forest-trail';
  /** Cover image (placeholder until the real pack frame is uploaded). */
  cover: string;
  previewClipUrl: string;
  /** Three mood words for the pack's footage, e.g. "Warm · nostalgic · bittersweet". */
  vibe: string;
  /** One line on the feeling the pack gives a song. */
  feel: string;
};

export type Aesthetic = {
  id: string;
  name: string;
  /** Genre line shown on the mood board, e.g. "Jazz · soft piano · restrained pop". */
  genres: string;
  /** Mood-board images: the first is the tall one. */
  images: string[];
  /** Example fan page handle (without @). */
  handle: string;
  /** One-line niche description used on the example page and as LLM context. */
  angle: string;
  pack: PackId;
};

export type MomentId =
  | 'gym' | 'study' | 'chill' | 'party' | 'romance' | 'heartbreak' | 'night-drive' | 'confidence' | 'nostalgia' | 'rebellion' | 'feel-good' | 'dreamy';
export type Moment = { id: MomentId; label: string; icon: string; defaultHook: string };

export type ListenerBracket = 'lt1k' | '1k-10k' | '10k-50k' | '50k-100k' | '100k+';
export type GoalId = '10k' | '50k' | '100k' | '500k';
export type BlockerId = 'reach' | 'money' | 'content' | 'effort' | 'network';
export type AgeId = '13-17' | '18-24' | '25-34' | '35-44' | '45+';
export type GenderId = 'women' | 'men' | 'everyone';
export type TriedId = 'playlists' | 'ads' | 'own-content' | 'influencers' | 'curators' | 'other' | 'nothing';
export type DailyTimeId = '5' | '15' | '30' | '60';
export type GenreId = 'pop' | 'hiphop' | 'rnb' | 'indie' | 'rock' | 'electronic' | 'country' | 'latin' | 'folk' | 'other';
export type ReleaseId = 'out' | 'month' | '3m' | 'none';
export type ExperienceId = 'never' | 'tried' | 'running';

/** A selectable answer. `icon` is SVG inner markup (24×24 viewBox, stroke icons). */
export type Option<T extends string = string> = { id: T; label: string; sub?: string; icon?: string };

/** What the quiz produces (HANDOFF.md §4). */
export type QuizAnswers = {
  genre?: GenreId;
  listeners: ListenerBracket;
  goal?: GoalId;
  blocker?: BlockerId;
  /** Aesthetic ids in pick order (max 3); [0] is the #1 best option. */
  aesthetics: string[];
  /** Max 2. */
  age?: AgeId[];
  gender?: GenderId;
  /** Max 3. */
  moments?: MomentId[];
  tried?: TriedId[];
  dailyTime?: DailyTimeId;
  release?: ReleaseId;
  experience?: ExperienceId;
};
