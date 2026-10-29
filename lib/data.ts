/* Page content, lifted from the Claude Design source. */

import { BUNDLE_SAVE, FOUR_SINGLES, PACK_CTA, PRICES } from './prices';

export function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function fmtK(n: number) {
  if (n < 1000) return String(n);
  return n >= 10000 ? Math.round(n / 1000) + 'K' : (n / 1000).toFixed(1) + 'K';
}

/* ---------- hero reels ---------- */
const HERO_SRCS = [1, 2, 3, 4, 5, 6, 7].map((n) => `/uploads/hero-${n}.mp4`);

export const ANATOMY_VIDEO = '/uploads/hero-4.mp4';

export type HeroVideo = { src: string; views: string; streams: string; conv: string };

export const HERO_VIDEOS: HeroVideo[] = (() => {
  const rnd = lcg(7);
  return HERO_SRCS.map((src) => {
    const views = Math.round(10000 + rnd() * 190000);
    const pct = 1 + rnd() * 4;
    return { src, views: fmtK(views), streams: fmtK(Math.round((views * pct) / 100)), conv: pct.toFixed(1) + '%' };
  });
})();

/* ---------- fan-page accounts ---------- */
export type Account = {
  handle: string; platform: string;
  s1: string; l1: string; s2: string; l2: string; s3: string; l3: string;
  /** Screenshots live at /uploads/pages/page{page}_s1…s6.webp; s1 doubles as the avatar. */
  note: string; page: number;
};

export const ACCOUNTS: Account[] = [
  { handle: '@sombr.archive', platform: 'Instagram', s1: '214', l1: 'posts', s2: '412K', l2: 'followers', s3: '3', l3: 'following', note: 'Fan-run. Started nine months before the first viral week.', page: 1 },
  { handle: '@gigi.perez.files', platform: 'TikTok', s1: '9', l1: 'following', s2: '683K', l2: 'followers', s3: '8.4M', l3: 'likes', note: 'Same 8-second hook, posted daily. No face.', page: 2 },
  { handle: '@alexwarren.moments', platform: 'Instagram', s1: '168', l1: 'posts', s2: '297K', l2: 'followers', s3: '6', l3: 'following', note: 'Cinematic B-roll under the chorus. Nothing else.', page: 3 },
  { handle: '@royel.otis.daily', platform: 'TikTok', s1: '4', l1: 'following', s2: '521K', l2: 'followers', s3: '6.1M', l3: 'likes', note: 'Runs on found footage and one lyric line at a time.', page: 4 },
  { handle: '@lola.young.hq', platform: 'Instagram', s1: '93', l1: 'posts', s2: '188K', l2: 'followers', s3: '2', l3: 'following', note: 'Ninety-three cuts of the same song.', page: 5 },
  { handle: '@bennysings.clips', platform: 'TikTok', s1: '11', l1: 'following', s2: '246K', l2: 'followers', s3: '3.9M', l3: 'likes', note: 'Built the whole audience before the album dropped.', page: 6 },
  { handle: '@wave2earth.reels', platform: 'Instagram', s1: '141', l1: 'posts', s2: '329K', l2: 'followers', s3: '5', l3: 'following', note: 'Zero budget. Zero appearances. All fan-page.', page: 7 },
  { handle: '@chaotic.good.roster', platform: 'TikTok', s1: '7', l1: 'following', s2: '858K', l2: 'followers', s3: '12.7M', l3: 'likes', note: 'Chaotic Good runs this format for every artist they sign.', page: 8 },
  { handle: '@djo.tapes', platform: 'Instagram', s1: '122', l1: 'posts', s2: '264K', l2: 'followers', s3: '4', l3: 'following', note: 'Lo-fi film scans. One song, one mood.', page: 9 },
  { handle: '@dominic.fike.cuts', platform: 'TikTok', s1: '6', l1: 'following', s2: '437K', l2: 'followers', s3: '5.2M', l3: 'likes', note: 'Skate footage, VHS grain, chorus only.', page: 10 },
  { handle: '@holly.humberstone.diary', platform: 'Instagram', s1: '87', l1: 'posts', s2: '153K', l2: 'followers', s3: '3', l3: 'following', note: 'Night drives and one lyric a day.', page: 11 },
  { handle: '@thexx.archive', platform: 'TikTok', s1: '5', l1: 'following', s2: '392K', l2: 'followers', s3: '4.8M', l3: 'likes', note: 'Same edit language across every release.', page: 12 },
];

/* ---------- how it works ---------- */
export const TOOLS = ['CapCut', 'DaVinci Resolve', 'Final Cut Pro', 'Premiere Pro', 'Canva', 'iMovie', 'Edits', 'Instagram', 'TikTok'].map((name) => ({
  name,
  logo: '/uploads/logos/' + name.toLowerCase().replace(/[^a-z]+/g, '-') + '.png',
}));

/* ---------- packs ---------- */
export type Pack = {
  n: string; stock: string; stockColor: string; slug: string; name: string; genres: string;
  desc: string; priceN: number; was: string; cta: string; bundle: boolean;
  /** The pack's dominant colour, read from its footage; tints the landing page when its aesthetic is picked. */
  tint?: string;
  /**
   * Who the look tends to reach, shown on the upsell as "who each pack reaches". Positioning from the footage and
   * genres, not measured data; adjust it to what your own pages' insights show.
   */
  audience?: string[];
};

export const PACKS: Pack[] = [
  { n: 'Pack 01', stock: '41 of 200 left', stockColor: '#F5F5F7', slug: 'golden-hour', name: 'Golden Hour', genres: 'Indie · Singer-songwriter · Bedroom pop · Alt-R&B', desc: 'Warm, hazy, golden-hour footage. Built for songs that sound like a memory.', priceN: PRICES.pack, was: '', cta: PACK_CTA, bundle: false, tint: '#E08A3C', audience: ['Women 18–34', 'Indie & bedroom pop', 'Nostalgia edits'] },
  { n: 'Pack 02', stock: '128 of 200 left', stockColor: '#6E6E73', slug: 'midnight-city', name: 'Midnight City', genres: 'Rap · Trap · Drill · Hyperpop', desc: 'Night cities, headlights, motion. High contrast, hard cuts.', priceN: PRICES.pack, was: '', cta: PACK_CTA, bundle: false, tint: '#4466E0', audience: ['Men 18–30', 'Rap & trap', 'Night-drive edits'] },
  { n: 'Pack 03', stock: '176 of 200 left', stockColor: '#6E6E73', slug: 'coastal-drive', name: 'Coastal Drive', genres: 'Pop · Dance · Alt-pop · Surf rock', desc: 'Coast roads, sea light, wind in the frame. Bright, open, moving.', priceN: PRICES.pack, was: '', cta: PACK_CTA, bundle: false, tint: '#2FB0B8', audience: ['Gen Z 16–24', 'Pop & dance', 'Summer & travel'] },
  { n: 'Pack 04', stock: '200 of 200 left', stockColor: '#6E6E73', slug: 'forest-trail', name: 'Forest Trail', genres: 'Folk · Acoustic · Ambient · Country', desc: 'Woodland, weather, slow light. Quiet and unhurried.', priceN: PRICES.pack, was: '', cta: PACK_CTA, bundle: false, tint: '#6FA83A', audience: ['Adults 25–44', 'Folk & acoustic', 'Slow living'] },
  { n: 'Bundle · all four', stock: `Save $${BUNDLE_SAVE}`, stockColor: '#30D158', slug: 'bundle', name: 'All four packs', genres: '120 videos · every genre above', desc: 'Golden Hour, Midnight City, Coastal Drive and Forest Trail. Four months of posting, one download.', priceN: PRICES.bundle, was: `$${FOUR_SINGLES}`, cta: `Get the bundle — $${PRICES.bundle}`, bundle: true },
];

/** Window event (detail: pack slug) that asks the packs section to switch aesthetic, e.g. from an FAQ answer. */
export const AESTHETIC_EVENT = 'fpk:aesthetic';

export const PACK_SLUGS = ['golden-hour', 'midnight-city', 'coastal-drive', 'forest-trail'];

export const GRADS = [
  ['linear-gradient(160deg,#6B3E4A,#2A1E2B)', 'linear-gradient(160deg,#8CA7B5,#3E4A52)', 'linear-gradient(160deg,#E0A060,#3A2A3A)', 'linear-gradient(160deg,#9B5F72,#2B2530)', 'linear-gradient(160deg,#F0B070,#4A3020)'],
  ['linear-gradient(160deg,#1E2A44,#0B0E18)', 'linear-gradient(160deg,#3A2A55,#101018)', 'linear-gradient(160deg,#C0392B,#1A0D10)', 'linear-gradient(160deg,#2C4A6E,#0A0F18)', 'linear-gradient(160deg,#5A2A6A,#120A18)'],
  ['linear-gradient(160deg,#2E6E8A,#0E1E2A)', 'linear-gradient(160deg,#9FCBD8,#3A5560)', 'linear-gradient(160deg,#E8C9A0,#4A3A2A)', 'linear-gradient(160deg,#4A8FA8,#102030)', 'linear-gradient(160deg,#D9B37A,#2A3A40)'],
  ['linear-gradient(160deg,#3E5C3A,#14200F)', 'linear-gradient(160deg,#8A7A55,#2A2415)', 'linear-gradient(160deg,#A9B7C6,#3C4A55)', 'linear-gradient(160deg,#C58F5A,#2E2015)', 'linear-gradient(160deg,#6E8A6A,#1A2418)'],
];
