'use client';

import { useEffect, useRef } from 'react';
import { ANATOMY_VIDEO } from '@/lib/data';
import { LazyVideo } from '../LazyVideo';

/** Where each part sits in the reel, as fractions of the 9:16 video frame. */
const PARTS = [
  { n: '01', t: 'Text hook', b: 'So relatable you keep watching.', at: { x: 0.83, y: 0.215 } },
  { n: '02', t: 'Visual', b: 'Picked to trigger the right emotion.', at: { x: 0.93, y: 0.34 } },
  { n: '03', t: 'Lyrics', b: 'On screen, so the focus stays on the music.', at: { x: 0.74, y: 0.475 } },
  { n: '04', t: 'Sound', b: 'Your track, playing the whole time.', at: null },
] as const;

const WIDTH = 720;

const Heart = () => <svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" /></svg>;
const Bubble = () => <svg viewBox="0 0 24 24"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5z" /></svg>;
const Send = () => <svg viewBox="0 0 24 24"><path d="M21.5 3 10 13.5M21.5 3l-6.8 18-4.7-7.5L2.5 9z" /></svg>;
const Note = () => <svg viewBox="0 0 24 24" className="fill"><path d="M9 18.5a3 3 0 1 1-2-2.8V5l12-2.5v12.5a3 3 0 1 1-2-2.8V6.6L9 8.2z" /></svg>;

/** "Anatomy of one reel": a phone playing a reel, with numbered callouts wired to each part. Scales down under 720px; stacks under 640px. */
export function Anatomy() {
  const grid = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLSpanElement | null)[]>([]);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    const el = grid.current!;
    let zoom = 1;

    const measure = () => {
      const b = el.getBoundingClientRect();
      const ys = anchors.current.map((a) => (a ? (a.getBoundingClientRect().top - b.top) / zoom : 0));
      place(ys);
      PARTS.forEach((_, i) => {
        const a = anchors.current[i]?.getBoundingClientRect();
        const c = boxes.current[i]?.getBoundingClientRect();
        if (!a || !c) return;
        const x1 = (a.left + a.width / 2 - b.left) / zoom, y1 = (a.top + a.height / 2 - b.top) / zoom;
        const x2 = (c.left - b.left) / zoom, y2 = ((c.top + c.bottom) / 2 - b.top) / zoom;
        const xm = x2 - 28;
        lines.current[i]?.setAttribute('d', `M${x1} ${y1}L${xm} ${y1}L${xm} ${y2}L${x2} ${y2}`);
        dots.current[i]?.setAttribute('cx', String(x1));
        dots.current[i]?.setAttribute('cy', String(y1));
      });
    };

    /** Centre each callout on its anchor; callouts that would overlap are stacked as a group centred on their anchors. */
    const place = (ys: number[]) => {
      const hs = boxes.current.map((c) => c?.offsetHeight ?? 0);
      const parent = boxes.current[0]?.offsetParent as HTMLElement | null;
      const top0 = parent ? (parent.getBoundingClientRect().top - el.getBoundingClientRect().top) / zoom : 0;
      const GAP = 14;
      type Group = { ids: number[]; top: number; h: number };
      const fit = (ids: number[]): Group => {
        let off = 0, sum = 0;
        for (const i of ids) { sum += ys[i] - top0 - off - hs[i] / 2; off += hs[i] + GAP; }
        return { ids, top: sum / ids.length, h: off - GAP };
      };
      const groups = ys.map((_, i) => fit([i]));
      for (let merged = true; merged; ) {
        merged = false;
        for (let g = 1; g < groups.length; g++) {
          if (groups[g - 1].top + groups[g - 1].h + GAP > groups[g].top) {
            groups.splice(g - 1, 2, fit([...groups[g - 1].ids, ...groups[g].ids]));
            merged = true;
            break;
          }
        }
      }
      for (const g of groups) {
        let y = Math.max(0, Math.min(g.top, (parent?.offsetHeight ?? Infinity) - g.h));
        for (const i of g.ids) { boxes.current[i]!.style.top = `${y}px`; y += hs[i] + GAP; }
      }
    };

    const stacked = window.matchMedia('(max-width: 640px)');

    const onResize = () => {
      if (stacked.matches) {
        // Narrow screens stack the cards under the phone and mark the parts with numbered badges instead of lines.
        zoom = 1;
        el.style.zoom = el.style.width = '';
        boxes.current.forEach((c) => { if (c) c.style.top = ''; });
        return;
      }
      const z = Math.round(Math.min(1, el.parentElement!.clientWidth / WIDTH) * 1000) / 1000;
      if (z !== zoom) {
        zoom = z;
        el.style.zoom = String(z);
        el.style.width = z < 1 ? `${WIDTH}px` : '100%';
      }
      measure();
    };

    onResize();
    document.fonts?.ready.then(onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="panel anatomy">
      <div className="panel-head">
        <h3 className="h3">Anatomy of one reel</h3>
        <span className="sub">Four parts. Each one does a job.</span>
      </div>
      <div className="anatomy-clip">
        <div className="anatomy-grid" ref={grid}>
          <svg className="anatomy-svg" fill="none" aria-hidden="true">
            {PARTS.map((p, i) => (
              <g key={p.n} className={p.at ? undefined : 'audio'}>
                <path ref={(e) => { lines.current[i] = e; }} d="" />
                <circle ref={(e) => { dots.current[i] = e; }} cx="-10" cy="-10" r="4.5" />
              </g>
            ))}
          </svg>

          <div className="phone" aria-hidden="true">
            <div className="phone-screen">
              <div className="phone-status">
                <span>9:41</span>
                <span className="island" />
                <span className="sys">
                  <svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".8" /><rect x="5" y="5.5" width="3" height="6.5" rx=".8" /><rect x="10" y="3" width="3" height="9" rx=".8" /><rect x="15" y="0" width="3" height="12" rx=".8" /></svg>
                  <svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="8" rx="2" /><rect x="23.5" y="4" width="1.8" height="4" rx=".9" opacity=".4" /></svg>
                </span>
              </div>
              <div className="phone-title">Reels</div>
              <div className="phone-video">
                <LazyVideo src={ANATOMY_VIDEO} />
                {PARTS.map((p, i) =>
                  p.at ? (
                    <span key={p.n} className="anchor" data-n={p.n} ref={(e) => { anchors.current[i] = e; }} style={{ left: `${p.at.x * 100}%`, top: `${p.at.y * 100}%` }} />
                  ) : null,
                )}
              </div>
              <div className="phone-rail">
                <span><Heart />84K</span>
                <span><Bubble />1.2K</span>
                <span><Send />9.8K</span>
                <span className="more">•••</span>
              </div>
              <div className="phone-meta">
                <div className="who"><span className="avatar" />@sadgirl.audio</div>
                <div className="track">
                  <Note />
                  <span>Mira Vale · baby doll</span>
                  <span className="anchor inline" data-n="04" ref={(e) => { anchors.current[3] = e; }} />
                </div>
              </div>
              <span className="phone-disc" />
            </div>
          </div>

          <div className="parts">
            {PARTS.map((p, i) => (
              <div key={p.n} className={'part' + (p.at ? '' : ' audio')} ref={(e) => { boxes.current[i] = e; }}>
                <span className="num">{p.n}</span>
                <div>
                  <span className="t">{p.t}</span>
                  <span className="b">{p.b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
