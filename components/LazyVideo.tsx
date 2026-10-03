'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { posterFor } from '@/lib/media';

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
  /** Above the fold: start buffering immediately instead of waiting to near the viewport. */
  priority?: boolean;
};

/**
 * Muted looping video. Shows its first-frame poster instantly, starts buffering well before it
 * scrolls into view, and only plays while it is near the viewport.
 */
export const LazyVideo = forwardRef<HTMLVideoElement, Props>(function LazyVideo({ priority, ...props }, ref) {
  const el = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => el.current!, []);

  useEffect(() => {
    const v = el.current;
    if (!v) return;
    // React doesn't render the `muted` attribute on the server, and browsers only autoplay muted video.
    v.muted = true;
    if (!('IntersectionObserver' in window)) {
      v.preload = 'auto';
      v.play().catch(() => {});
      return;
    }
    // Far margin: fetch ahead of the scroll so the video is ready by the time it is seen.
    const warm = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return;
        v.preload = 'auto';
        warm.disconnect();
      },
      { rootMargin: '1200px 1200px' },
    );
    const near = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: '200px' },
    );
    warm.observe(v);
    near.observe(v);
    return () => {
      warm.disconnect();
      near.disconnect();
    };
  }, []);

  return (
    <video
      ref={el}
      muted
      loop
      playsInline
      poster={posterFor(props.src)}
      preload={priority ? 'auto' : 'none'}
      autoPlay={priority}
      {...props}
    />
  );
});
