import type { PackId } from './types';

/*
 * Pack fit sheet: how well each quiz answer suits each FanpageKit pack. Copied from the Pack Fit Matrix artifact
 * (https://claude.ai/artifact/3WAL68kHJuFZa8i2KWGq51); update both together. B = best fit, F = fit, N = no fit.
 * Questions marked "not relevant" there (listeners, goal, blocker, gender, tried, daily time, release, experience)
 * are left out on purpose.
 */

export type FitLevel = 'B' | 'F' | 'N';
export type FitQuestion = 'genre' | 'aesthetics' | 'age' | 'moments';

export const PACK_FIT: Record<PackId, Record<FitQuestion, Record<string, FitLevel>>> = {
  golden: {
    genre: { afrobeats: 'F', country: 'F', electronic: 'N', folk: 'B', hiphop: 'N', indie: 'B', kpop: 'B', latin: 'B', lofi: 'B', metal: 'N', other: 'F', pop: 'B', reggaeton: 'F', rnb: 'F', rock: 'B' },
    aesthetics: { balletcore: 'F', 'clean-girl': 'F', coastal: 'F', coquette: 'F', cottagecore: 'F', cyberpunk: 'N', 'dark-academia': 'N', fairycore: 'B', gorpcore: 'F', grunge: 'N', 'light-academia': 'F', 'mob-wife': 'F', noir: 'N', 'old-money': 'B', streetwear: 'N', synthwave: 'N', vaporwave: 'F', weirdcore: 'F', western: 'F', y2k: 'B' },
    age: { '13-17': 'B', '18-24': 'B', '25-34': 'F', '35-44': 'F', '45+': 'F' },
    moments: { chill: 'B', confidence: 'F', dreamy: 'B', 'feel-good': 'B', gym: 'N', heartbreak: 'B', 'night-drive': 'N', nostalgia: 'B', party: 'N', rebellion: 'N', romance: 'B', study: 'F' },
  },
  midnight: {
    genre: { afrobeats: 'B', country: 'N', electronic: 'B', folk: 'N', hiphop: 'B', indie: 'F', kpop: 'F', latin: 'F', lofi: 'B', metal: 'B', other: 'F', pop: 'F', reggaeton: 'B', rnb: 'B', rock: 'B' },
    aesthetics: { balletcore: 'N', 'clean-girl': 'N', coastal: 'N', coquette: 'N', cottagecore: 'N', cyberpunk: 'B', 'dark-academia': 'B', fairycore: 'N', gorpcore: 'N', grunge: 'F', 'light-academia': 'N', 'mob-wife': 'B', noir: 'B', 'old-money': 'N', streetwear: 'B', synthwave: 'F', vaporwave: 'B', weirdcore: 'F', western: 'F', y2k: 'F' },
    age: { '13-17': 'F', '18-24': 'B', '25-34': 'B', '35-44': 'B', '45+': 'F' },
    moments: { chill: 'F', confidence: 'B', dreamy: 'F', 'feel-good': 'F', gym: 'B', heartbreak: 'B', 'night-drive': 'B', nostalgia: 'F', party: 'B', rebellion: 'B', romance: 'N', study: 'F' },
  },
  coastal: {
    genre: { afrobeats: 'F', country: 'B', electronic: 'B', folk: 'B', hiphop: 'F', indie: 'B', kpop: 'F', latin: 'B', lofi: 'B', metal: 'F', other: 'F', pop: 'B', reggaeton: 'F', rnb: 'B', rock: 'B' },
    aesthetics: { balletcore: 'N', 'clean-girl': 'N', coastal: 'B', coquette: 'N', cottagecore: 'N', cyberpunk: 'F', 'dark-academia': 'F', fairycore: 'N', gorpcore: 'F', grunge: 'B', 'light-academia': 'F', 'mob-wife': 'F', noir: 'F', 'old-money': 'N', streetwear: 'B', synthwave: 'F', vaporwave: 'F', weirdcore: 'F', western: 'B', y2k: 'F' },
    age: { '13-17': 'F', '18-24': 'B', '25-34': 'B', '35-44': 'B', '45+': 'B' },
    moments: { chill: 'B', confidence: 'F', dreamy: 'B', 'feel-good': 'B', gym: 'F', heartbreak: 'F', 'night-drive': 'F', nostalgia: 'B', party: 'N', rebellion: 'N', romance: 'B', study: 'F' },
  },
  forest: {
    genre: { afrobeats: 'F', country: 'B', electronic: 'N', folk: 'B', hiphop: 'F', indie: 'B', kpop: 'F', latin: 'F', lofi: 'F', metal: 'N', other: 'F', pop: 'B', reggaeton: 'F', rnb: 'F', rock: 'B' },
    aesthetics: { balletcore: 'N', 'clean-girl': 'F', coastal: 'B', coquette: 'F', cottagecore: 'B', cyberpunk: 'N', 'dark-academia': 'N', fairycore: 'B', gorpcore: 'B', grunge: 'F', 'light-academia': 'F', 'mob-wife': 'N', noir: 'N', 'old-money': 'F', streetwear: 'F', synthwave: 'F', vaporwave: 'F', weirdcore: 'F', western: 'B', y2k: 'B' },
    age: { '13-17': 'B', '18-24': 'B', '25-34': 'B', '35-44': 'B', '45+': 'B' },
    moments: { chill: 'B', confidence: 'B', dreamy: 'B', 'feel-good': 'B', gym: 'F', heartbreak: 'F', 'night-drive': 'N', nostalgia: 'B', party: 'N', rebellion: 'F', romance: 'B', study: 'F' },
  },
};

/** Points per level. A no fit costs more than a fit earns, so one clash outweighs one mild match. */
export const FIT_POINTS: Record<FitLevel, number> = { B: 2, F: 1, N: -2 };

/** How much each question counts. Genre decides the most; age the least. */
export const FIT_WEIGHTS: Record<FitQuestion, number> = { genre: 2, aesthetics: 1.5, moments: 1, age: 0.5 };

/** Final tie-break when two packs score the same: Midnight City first (the best-selling pack so far). */
export const PACK_PRIORITY: PackId[] = ['midnight', 'golden', 'coastal', 'forest'];
