import { lcg } from './data';

/*
 * Seeded daily-listener series for the "Own the growth" chart (Spotify-for-Artists style).
 * One continuous year: the first half is paid promotion (a playlist spike, then a Meta ads plateau, each
 * decaying back to the floor), the second half is daily faceless posting (compounding growth).
 */

export const DAYS = 364;
export const SPLIT = DAYS / 2;
export const MAX = 30000;
const END = Date.UTC(2026, 8, 24);

function build() {
  const rnd = lcg(11);
  const noise = (amp: number) => 1 + (rnd() - 0.5) * 2 * amp;
  const week = (i: number) => 1 + 0.07 * Math.sin((i / 7) * Math.PI * 2 + 1.2);
  const vals: number[] = [];

  // paid promotion
  const PLAYLIST = 44, META = 104, META_DAYS = 34;
  for (let i = 0; i < SPLIT; i++) {
    let v = 760 * week(i) * noise(0.18);
    if (rnd() < 0.035) v *= 1.4 + rnd() * 0.5; // the odd stray post
    // playlist add: overnight spike, gone within a month
    if (i >= PLAYLIST) v += 9400 * Math.exp(-(i - PLAYLIST) / 5.5) * noise(0.14) + (i - PLAYLIST < 30 ? 260 * noise(0.5) : 0);
    // meta ads: ramp to a noisy plateau while the budget runs, collapse when it stops
    if (i >= META) {
      const on = i - META;
      const level = on < 4 ? (on + 1) / 4 : on < META_DAYS ? 1 - on * 0.004 : Math.exp(-(on - META_DAYS) / 6);
      v += 5600 * level * week(i) * noise(0.1);
    }
    vals.push(v);
  }

  // daily faceless posting: the floor moves up every week, with clips that pop and settle
  const start = vals[SPLIT - 1], target = 22800;
  const pops: [number, number][] = [];
  let wob = 0;
  for (let i = SPLIT; i < DAYS; i++) {
    const t = (i - SPLIT) / (DAYS - SPLIT - 1);
    wob = wob * 0.9 + (rnd() - 0.5) * 0.05;
    if (rnd() < 0.06 && i < DAYS - 12) pops.push([i, 0.12 + rnd() * 0.22]);
    let r = (start + (target - start) * Math.pow(t, 1.35)) * (1 + wob) * week(i) * noise(0.07);
    for (const [d, b] of pops) if (i >= d && i < d + 8) r *= 1 + b * Math.exp(-(i - d) / 2.5);
    vals.push(r);
  }
  const peak = (from: number, to: number) => {
    let best = from;
    for (let i = from; i < to; i++) if (vals[i] > vals[best]) best = i;
    return best;
  };
  return {
    vals,
    events: [
      { label: 'Playlist pitching', i: peak(PLAYLIST, PLAYLIST + 3) },
      { label: 'Meta ads', i: peak(META, META + 8) },
      { label: 'FanpageKit', i: SPLIT + 92 },
    ],
  };
}

export const SERIES = build();

/** `9/24/26` for day i. */
export const shortDate = (i: number) => {
  const d = new Date(END - (DAYS - 1 - i) * 864e5);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${String(d.getUTCFullYear()).slice(2)}`;
};

/** `Sep 2025` for day i. */
export const monthLabel = (i: number) =>
  new Date(END - (DAYS - 1 - i) * 864e5).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
