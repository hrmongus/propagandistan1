'use client';

import { useEffect, useRef, useState } from 'react';
import { ANATOMY_VIDEO } from '@/lib/data';
import { LazyVideo } from '../LazyVideo';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** "Anatomy of one reel": connector lines from the callouts to the reel, scroll parallax, scales down under 780px. */
export function Anatomy() {
  const grid = useRef<HTMLDivElement>(null);
  const reel = useRef<HTMLDivElement>(null);
  const lyric = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);
  const c3 = useRef<HTMLDivElement>(null);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const anatomy = grid.current!;
    let zoom = 1, parallax = 0, raf = 0;

    const measureLines = () => {
      const b = anatomy.getBoundingClientRect();
      const rel = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { l: (r.left - b.left) / zoom, r: (r.right - b.left) / zoom, t: (r.top - b.top) / zoom, b: (r.bottom - b.top) / zoom, cy: ((r.top + r.bottom) / 2 - b.top) / zoom };
      };
      const B1 = rel(c1.current!), B2 = rel(c2.current!), B3 = rel(c3.current!);
      const RR = rel(reel.current!), LY = rel(lyric.current!), PR = rel(pill.current!);
      const elbow = (x1: number, y1: number, x2: number, y2: number) => {
        const xm = (x1 + x2) / 2;
        return `M${x1} ${y1}L${xm} ${y1}L${xm} ${y2}L${x2} ${y2}`;
      };
      const t1 = { x: RR.l, y: RR.t + (RR.b - RR.t) * 0.22 }, t2 = { x: RR.r, y: LY.cy }, t3 = { x: RR.l, y: PR.cy };
      const set = (i: number, d: string, p: { x: number; y: number }) => {
        lines.current[i]?.setAttribute('d', d);
        dots.current[i]?.setAttribute('cx', String(p.x));
        dots.current[i]?.setAttribute('cy', String(p.y));
      };
      set(0, elbow(B1.r, B1.cy, t1.x, t1.y), t1);
      set(1, elbow(B2.l, B2.cy, t2.x, t2.y), t2);
      set(2, elbow(B3.r, B3.cy, t3.x, t3.y), t3);
    };

    const onResize = () => {
      const avail = anatomy.parentElement!.clientWidth;
      const z = Math.round(Math.min(1, avail / 780) * 1000) / 1000;
      if (z !== zoom) {
        zoom = z;
        anatomy.style.zoom = String(z);
        anatomy.style.width = z < 1 ? '780px' : '100%';
      }
      measureLines();
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const r = anatomy.getBoundingClientRect();
        const p = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        if (Math.abs(p - parallax) > 0.002) {
          parallax = p;
          c1.current!.style.transform = `translateY(${(p * 28).toFixed(1)}px)`;
          c2.current!.style.transform = `translateY(${(p * -18).toFixed(1)}px)`;
          c3.current!.style.transform = `translateY(${(p * 40).toFixed(1)}px)`;
        }
        measureLines();
      });
    };

    const onBoth = () => { onResize(); onScroll(); };
    onBoth();
    const timers = [setTimeout(onScroll, 300), setTimeout(onScroll, 1200)];
    document.fonts?.ready.then(onBoth);
    window.addEventListener('resize', onBoth);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onBoth);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const toggleMute = () => {
    const v = video.current;
    const next = !muted;
    setMuted(next);
    if (!v) return;
    v.muted = next;
    if (!next) {
      v.volume = 1;
      v.play().catch(() => {});
    }
  };

  return (
    <div className="panel anatomy">
      <div className="panel-head">
        <h3 className="h3">Anatomy of one reel</h3>
        <span className="sub">Three parts. Each one does a job.</span>
      </div>
      <div className="anatomy-clip">
        <div className="anatomy-grid" ref={grid}>
          <svg className="anatomy-svg" fill="none" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path ref={(el) => { lines.current[i] = el; }} className={i === 2 ? 'audio' : undefined} d="" />
                <circle ref={(el) => { dots.current[i] = el; }} className={i === 2 ? 'audio' : undefined} cx="-10" cy="-10" r="3.5" />
              </g>
            ))}
          </svg>
          <div className="callouts-left">
            <div className="callout" ref={c1}>
              <span className="k">Footage</span>
              <span className="t">Cinematic edits that carry emotion</span>
              <span className="b">Graded, paced and cut to hold attention in the first second — and to feel like the song.</span>
            </div>
            <div className="callout" ref={c3}>
              <span className="k audio">Audio</span>
              <span className="t">Your track, one tap from Spotify</span>
              <span className="b">Attached from the platform’s library, so every view is credited to your release.</span>
            </div>
          </div>
          <div className="reel-hero" ref={reel}>
            <LazyVideo ref={video} src={ANATOMY_VIDEO} />
            <button className="mute-btn" type="button" aria-label="Toggle sound" aria-pressed={!muted} onClick={toggleMute}>
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m23 9-6 6" /><path d="m17 9 6 6" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" /></svg>
              )}
            </button>
            <div className="lyric-anchor" ref={lyric} />
            <div className="reel-chrome">
              <span className="handle">@heartisthekey</span>
              <div className="audio-pill" ref={pill}>
                <span className="dot" />
                <span className="name">Heart Is The Key · Original audio</span>
                <span className="arrow">→</span>
              </div>
            </div>
          </div>
          <div className="callouts-right">
            <div className="callout" ref={c2}>
              <span className="k">Overlay</span>
              <span className="t">Text that points at the music</span>
              <span className="b">A lyric or a line about the song — so the viewer listens instead of just watching.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
