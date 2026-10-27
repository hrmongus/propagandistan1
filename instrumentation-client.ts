import posthog from 'posthog-js';
import type { ClientEvent } from '@/lib/analytics/events';
import { track } from '@/lib/analytics/client';
import { startMetaPixel } from '@/lib/analytics/meta';

/*
 * PostHog, initialised before the app hydrates. Without NEXT_PUBLIC_POSTHOG_KEY nothing loads or sends.
 * Pageviews (including client-side navigations), page leaves, autocaptured clicks and uncaught errors come from
 * the SDK; the funnel's custom events are listed in lib/analytics/events.ts.
 *
 * Meta Pixel, loaded alongside when NEXT_PUBLIC_META_PIXEL_ID is set (lib/analytics/meta.ts); on /upsell and /access
 * once the page hands it the buyer's details.
 */

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/*
 * Internal devices: open the site once with ?internal=1 (?internal=0 undoes it). PostHog flags the person as
 * $internal_or_test_user, which the project's test-account filter excludes, and this browser stops loading the
 * Meta Pixel so team visits don't train the ads. Works without ever buying or reaching /access.
 */
const INTERNAL_KEY = 'fk_internal';
const internalParam = new URLSearchParams(location.search).get('internal');
let internal = false;
try {
  if (internalParam === '1') localStorage.setItem(INTERNAL_KEY, '1');
  if (internalParam === '0') localStorage.removeItem(INTERNAL_KEY);
  internal = localStorage.getItem(INTERNAL_KEY) === '1';
} catch {
  internal = internalParam === '1';
}

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
      // Runs before the first pageview is captured, so even that one is flagged.
      loaded: (ph) => {
        if (internalParam === '1') ph.setInternalOrTestUser();
        if (internalParam === '0') ph.setPersonProperties({ $internal_or_test_user: false });
      },
    });
  } catch (err) {
    console.error('[analytics] PostHog init failed', err);
  }
}

if (pixelId && !internal) {
  try {
    startMetaPixel(pixelId);
  } catch (err) {
    console.error('[analytics] Meta Pixel init failed', err);
  }
}

if (key || pixelId) {
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
