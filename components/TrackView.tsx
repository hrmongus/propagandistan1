'use client';

import { useEffect, useRef } from 'react';
import { identify, track } from '@/lib/analytics/client';
import type { ClientEvent, ClientEvents } from '@/lib/analytics/events';

/** Sends `event` once when a page mounts, so server-rendered pages can report a view with their own properties. */
export function TrackView<E extends ClientEvent>({ event, props, email }: { event: E; props: ClientEvents[E]; email?: string | null }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (email) identify(email);
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);
  return null;
}
