'use client';

import { track as posthogTrack } from '@/lib/analytics/client';
import type { EventName } from './events';

/*
 * Client helper the analyzer screens call: track('step_viewed', 'quiz_goal'). Writes the event to our own
 * `events` table (drop-off per step in SQL) and mirrors the analyzer events to PostHog with the same names.
 * upsell_accepted / upsell_declined are already sent to PostHog by the upsell page, so they only go to the table.
 * Never throws and never blocks navigation (sendBeacon / keepalive).
 */

const SESSION_KEY = 'fpk_analyzer_session';
const STRATEGY_KEY = 'fpk_analyzer_strategy';

function store(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

export function sessionId() {
  const s = store();
  let id = s?.getItem(SESSION_KEY) ?? null;
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '');
    s?.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Remember the strategy once it exists, so later events (results, offer, upsell) carry it. */
export function setStrategyId(id: string) {
  store()?.setItem(STRATEGY_KEY, id);
}

export function track(name: EventName, step?: string, strategyId?: string) {
  try {
    const body = JSON.stringify({ session_id: sessionId(), strategy_id: strategyId ?? store()?.getItem(STRATEGY_KEY) ?? undefined, name, step });
    const sent = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
    if (!sent) void fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    if (name !== 'upsell_accepted' && name !== 'upsell_declined') posthogTrack(name, { step: step ?? null });
  } catch {
    /* analytics must never break the flow */
  }
}
