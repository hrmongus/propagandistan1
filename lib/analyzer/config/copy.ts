import { ASSET } from './packs';

/*
 * Copy that isn't tied to one question. Items marked TODO(launch) are placeholders from HANDOFF.md §8 that must be
 * replaced with real, verified content before the funnel goes live.
 */

/** TODO(launch): real customer count. While null, the landing shows "Loved by independent artists" without a number. */
export const ARTIST_COUNT: string | null = null;

/** Landing strip "Used by all major labels". Names as text, no logos (logos imply endorsement, HANDOFF.md §8). */
export const MAJOR_LABELS = ['Universal Music', 'Sony Music', 'Warner Music'];

/** Landing FAQ (HANDOFF.md §6 says these answers still needed writing; drafted here, review before launch). */
export const LANDING_FAQ: { q: string; a: string }[] = [
  { q: 'Are you using my song to train AI?', a: "No. We only read your track's public details from Spotify. We never store your audio or use it to train AI." },
  { q: 'How does the Blueprint Builder work?', a: 'Pick your song, answer 9 quick questions about your audience and goals, and we build a fan page plan around them: 3 page concepts, hooks written for your song and a 6-month growth path.' },
  { q: 'Is my song safe with you?', a: "Yes. Nothing is published or shared. Your Blueprint is saved under a private link that only you get by email." },
  { q: "Why is it free? What's the catch?", a: 'No catch. The Blueprint shows you what fan pages can do for your song. If you want ready-made content to run them, we sell FanpageKit packs, but you never have to buy anything.' },
];

/** Results FAQ (HANDOFF.md §6, verbatim). */
export const RESULTS_FAQ: { q: string; a: string }[] = [
  { q: 'Do I need to show my face?', a: 'No. Faceless fan pages never show you. Your song is the focal point of every post.' },
  { q: 'How much time does it take?', a: 'About 4 minutes per post. The content is ready-made, so you only add your song and post.' },
  { q: 'Do I need editing skills?', a: 'No. Step-by-step guides for CapCut, Canva, iMovie and more walk you through every post.' },
  { q: 'Which platforms does it work on?', a: 'Instagram Reels and TikTok. Every clip is vertical and ready to post. You attach your track as the platform audio.' },
  { q: 'How fast will I see results?', a: 'It depends on your song and how consistently you post. Fan pages grow with steady daily posting, so start as early as you can.' },
  { q: 'Is this a subscription?', a: 'No. One-time payment. The pack is yours to keep, with a commercial licence and no royalties or credit required.' },
  { q: "What if it doesn't work for me?", a: "You're covered by our 30-day money-back guarantee." },
];

export type Proof = { initial: string; avatar?: string; name: string; meta: string; verified: boolean; stars: number; quote: string; image: string | null; imageAlt: string; caption?: string; position?: string };

/** Artist reviews with their Spotify for Artists screenshots (assets/proof/n.jpg) and face photos (assets/avatars/n.jpg). */
export const LANDING_AVATARS = [1, 2, 3, 4, 5].map((n) => ASSET(`avatars/${n}.jpg`));

export const PROOF: Proof[] = [
  { initial: 'L', avatar: ASSET('avatars/4.jpg'), name: '@lennoxvale', meta: 'Austin, Texas', verified: true, stars: 5, quote: 'consistency pays big in listeners', image: ASSET('proof/1.jpg'), imageAlt: 'Spotify for Artists: 1,853,687 listeners and 7,987,904 streams, Jan 25 to Sep 22, 2026' },
  { initial: 'M', avatar: ASSET('avatars/1.jpg'), name: '@miraellison', meta: 'Portland, Oregon', verified: true, stars: 5, quote: 'my streams grow crazy!', image: ASSET('proof/2.jpg'), imageAlt: 'Spotify for Artists: 6,502,946 streams and 1,467,028 listeners, March to August' },
  { initial: 'C', avatar: ASSET('avatars/3.jpg'), name: '@cassidyrowe', meta: 'Nashville, Tennessee', verified: true, stars: 5, quote: 'faceless is the way to go. saved me for sure', image: ASSET('proof/3.jpg'), imageAlt: 'Spotify for Artists chart rising from near zero to over 2,000 per day, April to July' },
  { initial: 'J', name: '@juniperkade', meta: 'Denver, Colorado', verified: true, stars: 5, quote: 'ditched all paid promo. fanpages are better than all the rest combined', image: ASSET('proof/4.jpg'), imageAlt: 'Spotify for Artists chart rising from under 1,000 to over 40,000 per day, Apr 20 to Sep 17, 2026' },
  { initial: 'T', avatar: ASSET('avatars/2.jpg'), name: '@theoashford', meta: 'Brooklyn, New York', verified: true, stars: 5, quote: 'my monthly listeners almost doubled 2nd month in a row', image: ASSET('proof/5.jpg'), imageAlt: 'Spotify for Artists: 1,904,255 listeners and 8,048,093 streams, April to August' },
  { initial: 'S', avatar: ASSET('avatars/5.jpg'), name: '@sablequin', meta: 'Chicago, Illinois', verified: true, stars: 5, quote: 'never thought i will reach this number this fast', image: ASSET('proof/6.jpg'), imageAlt: 'Spotify for Artists: 5,177,789 streams and 1,330,921 listeners, Mar 20 to Sep 18, 2026' },
];

/** TODO(launch): label logos need permission (HANDOFF.md §8); empty slots keep the space until then. */
export const LABEL_LOGOS: { name: string; src: string | null }[] = [
  { name: 'Label', src: null }, { name: 'Label', src: null }, { name: 'Label', src: null }, { name: 'Label', src: null },
];

/**
 * Analyzing screen status lines (one every ~1.6s). v1 has no audio analysis, so the mock's "reading the audio /
 * locating the hook / transcribing lyrics" steps are replaced by steps that actually happen.
 */
export const ANALYZING_STEPS = [
  'Reading your track',
  'Matching your aesthetics',
  'Mapping your audience',
  'Writing your hooks',
  'Picking your fan pages',
  'Filling your fan pages',
  'Modelling your 6-month path',
];

/** How long the analyzing screen holds, even if everything is ready sooner (HANDOFF.md: 12–15s). */
export const ANALYZING_MS = 12_500;

/** Results offer box bullets. */
export const OFFER_BULLETS: { text: string; lead?: string; badge?: string }[] = [
  { lead: 'A month of ready-to-post content', text: 'in your aesthetic' },
  { text: 'Raw clips to make even more posts' },
  { text: 'Step-by-step editing guides for CapCut, Canva and more' },
  { text: 'Posting playbook: what to post, when, and how to add your song' },
  { text: 'Fan page community', badge: 'New' },
];

/** Checkout step 1: what's inside the pack. */
export const PACK_INCLUDES: { text: string; lead?: string; signal?: boolean }[] = [
  { text: 'About $1.23 per finished post', signal: true },
  { lead: '30 ready-to-post reels', text: ', one a day for a month' },
  { text: 'Raw clips to make even more posts' },
  { text: 'Your Blueprint hooks, written for this song' },
  { text: 'Editing guides and a posting playbook' },
  { text: 'Fan page community' },
];

/**
 * Screen 09 "Real pages. Real followers.": example fan page profiles. The grids are real screenshots
 * (assets/pages/n.jpg); the handles, names and counts are PLACEHOLDERS until the real ones are supplied.
 */
export const FANPAGE_EXAMPLES = [
  { handle: 'indiepop.feels', name: 'indie pop feels', following: '12', followers: '48.2K', likes: '1.1M', grid: ASSET('pages/1.jpg'), avatar: ASSET('pages/1-avatar.jpg') },
  { handle: 'peak.anime.ost', name: 'PEAK anime songs', following: '8', followers: '36.5K', likes: '820K', grid: ASSET('pages/2.jpg'), avatar: ASSET('pages/2-avatar.jpg') },
  { handle: 'baby.kitten.daily', name: 'baby kittens', following: '3', followers: '412K', likes: '18.7M', grid: ASSET('pages/3.jpg'), avatar: ASSET('pages/3-avatar.jpg') },
  { handle: 'early2000s.nights', name: 'early 2000s nights', following: '21', followers: '67.9K', likes: '2.4M', grid: ASSET('pages/4.jpg'), avatar: ASSET('pages/4-avatar.jpg') },
  { handle: 'still.miss.you.bw', name: 'still miss you', following: '5', followers: '93.1K', likes: '3.6M', grid: ASSET('pages/5.jpg'), avatar: ASSET('pages/5-avatar.jpg') },
];
