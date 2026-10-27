'use client';

import { useEffect, useRef } from 'react';
import { trackMetaPurchases, type MetaPurchase as Purchase } from '@/lib/analytics/meta';

/** Sends the order's paid events to the Meta Pixel once on mount; props come from metaBrowserPurchases. */
export function MetaPurchase({ events, match }: { events: Purchase[]; match: Record<string, string> }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackMetaPurchases(events, match);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);
  return null;
}
