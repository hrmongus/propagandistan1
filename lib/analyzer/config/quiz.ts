import type {
  AgeId, BlockerId, GenreId, DailyTimeId, ExperienceId, GenderId, GoalId, ListenerBracket, Option, ReleaseId, TriedId,
} from './types';

/* Quiz questions and answers, copied from the screen mock-ups (docs/fanpage-blueprint/screens 02–14). */

const I = {
  sprout: '<path d="M12 20v-8M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8z"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
};

export const GENRES: Option<GenreId>[] = [
  { id: 'hiphop', label: 'Hip-hop / Rap', icon: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>' },
  { id: 'pop', label: 'Pop', icon: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>' },
  { id: 'rnb', label: 'R&B / Soul', icon: '<path d="M12 21s-8.5-5.4-10.2-10.6C.6 6.6 3 3.5 6.4 3.5c2.1 0 3.9 1.1 5.6 3.2 1.7-2.1 3.5-3.2 5.6-3.2 3.4 0 5.8 3.1 4.6 6.9C20.5 15.6 12 21 12 21z"/>' },
  { id: 'rock', label: 'Rock', icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' },
  { id: 'latin', label: 'Latin', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>' },
  { id: 'electronic', label: 'Electronic / Dance', icon: '<path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"/>' },
  { id: 'country', label: 'Country', icon: '<path d="M3 15c0-2 4-3 9-3s9 1 9 3c0 1-4 2-9 2s-9-1-9-2z"/><path d="M7 12.5 8 6c.3-1.5 2-1.5 4 0 2-1.5 3.7-1.5 4 0l1 6.5"/>' },
  { id: 'indie', label: 'Indie / Alt', icon: '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>' },
  { id: 'afrobeats', label: 'Afrobeats', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 9h8M7 12h10M8 15h8"/>' },
  { id: 'kpop', label: 'K-pop', icon: '<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="M19 15v4M17 17h4"/>' },
  { id: 'folk', label: 'Folk / Acoustic', icon: '<path d="M12 20v-8M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>' },
  { id: 'reggaeton', label: 'Reggaeton', icon: '<path d="M3 11v2a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M19 9a4 4 0 0 1 0 6"/>' },
  { id: 'lofi', label: 'Lo-fi', icon: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>' },
  { id: 'metal', label: 'Metal', icon: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8z"/>' },
  { id: 'other', label: 'Other', icon: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>' },
];

export const LISTENER_BRACKETS: Option<ListenerBracket>[] = [
  { id: 'lt1k', label: 'Under 1K', sub: 'Just getting started', icon: I.sprout },
  { id: '1k-10k', label: '1K – 10K', sub: 'Some traction', icon: I.trend },
  { id: '10k-50k', label: '10K – 50K', sub: 'Growing', icon: I.star },
  { id: '50k-100k', label: '50K – 100K', sub: 'Breaking through', icon: I.flame },
  { id: '100k+', label: '100K+', sub: 'Established', icon: I.crown },
];

/** Short label for the chart's "Today" value. */
export const LISTENER_SHORT: Record<ListenerBracket, string> = { lt1k: '<1K', '1k-10k': '1–10K', '10k-50k': '10–50K', '50k-100k': '50–100K', '100k+': '100K+' };
/** A representative "today" value per bracket: where the goal chart's lines start. */
export const LISTENER_START: Record<ListenerBracket, number> = { lt1k: 500, '1k-10k': 5_000, '10k-50k': 25_000, '50k-100k': 75_000, '100k+': 150_000 };
/** Upper bound of each bracket, used to hide goals that aren't above it. */
export const LISTENER_CEIL: Record<ListenerBracket, number> = { lt1k: 1_000, '1k-10k': 10_000, '10k-50k': 50_000, '50k-100k': 100_000, '100k+': 500_000 };

export const GOALS: (Option<GoalId> & { value: number; short: string })[] = [
  { id: '10k', label: '10K', short: '10K', value: 10_000, sub: 'Your first real fanbase', icon: I.sprout },
  { id: '50k', label: '50K', short: '50K', value: 50_000, sub: "On every label scout's radar", icon: I.star },
  { id: '100k', label: '100K', short: '100K', value: 100_000, sub: 'Full-time artist territory', icon: I.flame },
  { id: '500k', label: '500K+', short: '500K+', value: 500_000, sub: 'Playlist and radio territory', icon: I.crown },
];

/** Goals strictly above the current bracket (HANDOFF.md: "only show goals above the current bucket"). */
export const goalsFor = (listeners: ListenerBracket | undefined) => GOALS.filter((g) => !listeners || g.value >= LISTENER_CEIL[listeners]);

export const BLOCKERS: Option<BlockerId>[] = [
  { id: 'reach', label: 'Nobody hears my music', icon: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>' },
  { id: 'money', label: 'Promo is too expensive', icon: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5C14 8.6 13.1 8 12 8c-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.6-2.5-1.5M12 6.5V8M12 16v1.5"/>' },
  { id: 'content', label: 'Making content is hard', icon: '<rect x="2" y="6" width="14" height="12" rx="3"/><path d="m16 10 6-3v10l-6-3"/>' },
  { id: 'effort', label: "It's too much work", icon: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10v4"/>' },
  { id: 'network', label: "I don't have the network", icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.5 2.7 3.5 5.5"/>' },
];

export const AGES: Option<AgeId>[] = [
  { id: '13-17', label: '13–17' }, { id: '18-24', label: '18–24' }, { id: '25-34', label: '25–34' }, { id: '35-44', label: '35–44' }, { id: '45+', label: '45+' },
];

export const GENDERS: Option<GenderId>[] = [
  { id: 'women', label: 'Mostly women', icon: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 18h6"/>' },
  { id: 'men', label: 'Mostly men', icon: '<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>' },
  { id: 'everyone', label: 'Everyone', icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.5 2.7 3.5 5.5"/>' },
];

export const TRIED: Option<TriedId>[] = [
  { id: 'playlists', label: 'Playlist pitching', icon: '<path d="M4 6h11M4 11h11M4 16h6"/><circle cx="17" cy="17" r="3"/><path d="M20 17V7"/>' },
  { id: 'ads', label: 'Ads (Meta, TikTok, Spotify)', icon: '<path d="M3 11v2a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M19 9a4 4 0 0 1 0 6"/>' },
  { id: 'own-content', label: 'Making my own content', icon: '<rect x="2" y="6" width="14" height="12" rx="3"/><path d="m16 10 6-3v10l-6-3"/>' },
  { id: 'influencers', label: 'Influencer collabs', icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.5 2.7 3.5 5.5"/>' },
  { id: 'curators', label: 'Submitting to curators and blogs', icon: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>' },
  { id: 'other', label: 'Something else', icon: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>' },
  { id: 'nothing', label: 'Nothing yet', icon: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>' },
];

export const DAILY_TIME: Option<DailyTimeId>[] = [
  { id: '5', label: '5 minutes', sub: 'Just the basics', icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' },
  { id: '15', label: '15 minutes', sub: 'A quick daily routine', icon: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/>' },
  { id: '30', label: '30 minutes', sub: 'I can commit some time', icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4"/>' },
  { id: '60', label: 'An hour or more', sub: "I'm all in", icon: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8z"/>' },
];

export const RELEASES: (Option<ReleaseId> & { urgency: string })[] = [
  { id: 'out', label: "It's already out", sub: 'I want to push it now', icon: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>', urgency: 'Your song is out. Start today and every post can send listeners straight to it.' },
  { id: 'month', label: 'In the next month', icon: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/>', urgency: 'Start now so your page has momentum on release day.' },
  { id: '3m', label: 'In 1–3 months', icon: '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9"/><path d="M17 3c0 5-5 6-5 9s5 4 5 9"/>', urgency: 'Perfect timing: you have weeks to grow your page before release.' },
  { id: 'none', label: 'No release planned', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>', urgency: 'Start with your current catalogue. Your best song is already out.' },
];

export const EXPERIENCE: Option<ExperienceId>[] = [
  { id: 'never', label: 'Never', sub: 'This is new to me', icon: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>' },
  { id: 'tried', label: "Tried, but it didn't stick", sub: 'Hard to keep posting', icon: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>' },
  { id: 'running', label: 'I run one now', sub: 'I want it to grow faster', icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>' },
];

/** Max selections per multi-select question. */
export const LIMITS = { aesthetics: 3, age: 2, moments: 3 } as const;
