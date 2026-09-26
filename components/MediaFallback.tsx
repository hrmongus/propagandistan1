'use client';

import { useEffect } from 'react';

/**
 * Missing artwork degrades to the gradient/dark placeholder behind it; tool logos fall back to their initial.
 * Also catches images that failed before hydration.
 */
export function MediaFallback() {
  useEffect(() => {
    const mark = (img: HTMLImageElement) => {
      if (img.dataset.fallback === 'initial') img.parentElement?.setAttribute('data-noimg', '');
      else img.setAttribute('data-broken', '');
    };
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) mark(e.target);
    };
    document.addEventListener('error', onError, true);
    document.querySelectorAll('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) mark(img);
    });
    return () => document.removeEventListener('error', onError, true);
  }, []);
  return null;
}
