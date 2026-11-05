/* Analyzer funnel events, stored in Supabase `events` (POST /api/event). Shared by the server route and the client helper. */

export const EVENT_NAMES = ['track_selected', 'step_viewed', 'email_submitted', 'results_viewed', 'offer_clicked', 'upsell_accepted', 'upsell_declined'] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export const isEventName = (s: unknown): s is EventName => typeof s === 'string' && (EVENT_NAMES as readonly string[]).includes(s);
export const isSessionId = (s: unknown): s is string => typeof s === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(s);
export const isStep = (s: unknown): s is string => typeof s === 'string' && /^[a-z0-9_-]{1,40}$/.test(s);
