import posthog from 'posthog-js';
import type { ClientEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/client';

/*
 * PostHog, initialised before the app hydrates. Without NEXT_PUBLIC_POSTHOG_KEY nothing loads or sends.
 * Pageviews (including client-side navigations), page leaves, autocaptured clicks and uncaught errors come from
 * the SDK; the funnel's custom events are listed in lib/analytics/events.ts.
 */

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  try {
    posthog.init(key, {
      // Proxied through our own domain (next.config.ts rewrites) so ad blockers don't drop events.
      api_host: '/ingest',
      ui_host: (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace('.i.posthog.com', '.posthog.com'),
      defaults: '2026-08-30',
      person_profiles: 'identified_only',
      capture_exceptions: true,
      debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === '1',
    });
  } catch (err) {
    console.error('[analytics] PostHog init failed', err);
  }

  // Server components mark links with trackClick() (data-ph-event / data-ph-props); send those events on click.
  document.addEventListener(
    'click',
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-ph-event]');
      if (!el?.dataset.phEvent) return;
      try {
        track(el.dataset.phEvent as ClientEvent, JSON.parse(el.dataset.phProps || '{}'));
      } catch {
        // malformed props — drop the event, never the click
      }
    },
    { capture: true },
  );
}
