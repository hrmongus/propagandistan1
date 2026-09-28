'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & { src: string };

/** Muted looping video that only plays while it is near the viewport. */
export const LazyVideo = forwardRef<HTMLVideoElement, Props>(function LazyVideo(props, ref) {
  const el = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => el.current!, []);

  useEffect(() => {
    const v = el.current;
    if (!v || !('IntersectionObserver' in window)) return;
    // React doesn't render the `muted` attribute on the server, and browsers only autoplay muted video.
    v.muted = true;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: '100px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return <video ref={el} muted loop playsInline preload="metadata" {...props} />;
});
