import posthog from 'posthog-js';
import type { ClientEvent, ClientEvents } from './events';

/* Browser-side PostHog. Initialised in instrumentation-client.ts; every call here is a no-op until then. */

export const analyticsEnabled = () => Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

export function track<E extends ClientEvent>(event: E, props: ClientEvents[E]) {
  if (!analyticsEnabled()) return;
  posthog.capture(event, props);
}

/** Ties this browser's anonymous history to the buyer, so the landing → checkout funnel joins their purchases. */
export function identify(email: string, props?: Record<string, unknown>) {
  if (!analyticsEnabled() || posthog.get_distinct_id() === email) return;
  posthog.identify(email, { email, ...props });
}

/** This browser's PostHog id, sent with the order so server-side purchase events land on the same person. */
export function distinctId() {
  return analyticsEnabled() ? posthog.get_distinct_id() : undefined;
}
