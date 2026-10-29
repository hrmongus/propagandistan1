'use client';

import { useEffect, useRef } from 'react';

/**
 * Keeps a row of fixed-size visuals on one line: zooms `row` down just enough to fit inside `box`'s content width
 * (never up), and re-fits whenever the box resizes.
 */
export function useFitRow<B extends HTMLElement, R extends HTMLElement>() {
  const box = useRef<B>(null);
  const row = useRef<R>(null);
  useEffect(() => {
    const b = box.current!, r = row.current!;
    const fit = () => {
      r.style.zoom = '';
      const cs = getComputedStyle(b);
      const room = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const s = Math.min(1, room / r.scrollWidth);
      r.style.zoom = s < 1 ? String(Math.floor(s * 1000) / 1000) : '';
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, []);
  return { box, row };
}
