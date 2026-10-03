'use client';

import { useEffect, useRef } from 'react';

/** Sets `data-in` on its div the first time it scrolls into view, so CSS can start entrance animations. */
export function InView({ className, children }: { className?: string; children: React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const d = el.current;
    if (!d) return;
    if (!('IntersectionObserver' in window)) { d.dataset.in = ''; return; }
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { d.dataset.in = ''; io.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(d);
    return () => io.disconnect();
  }, []);
  return <div ref={el} className={className}>{children}</div>;
}
