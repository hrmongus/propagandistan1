'use client';

import { useEffect, useRef, useState } from 'react';
import { ANATOMY_VIDEO } from '@/lib/data';
import { LazyVideo } from '../LazyVideo';

/** Where each part sits in the reel, as fractions of the 9:16 video frame (desktop callouts, beside the phone). */
const PARTS = [
  { n: '01', t: 'Text hook', b: 'So relatable you keep watching.', at: { x: 0.83, y: 0.215 } },
  { n: '02', t: 'Visual', b: 'Picked to trigger the right emotion.', at: { x: 0.93, y: 0.34 } },
  { n: '03', t: 'Lyrics', b: 'On screen, so the focus stays on the music.', at: { x: 0.74, y: 0.475 } },
  { n: '04', t: 'Sound', b: 'Your track, playing the whole time.', at: null },
] as const;

/**
 * Phone layout: notes sit on the reel, side by side in its two black bands (above the hook text, and between the
 * picture and the handle, left of the action rail), so none covers the video. Lines are fixed in the reel's own
 * pixels (308 × 548 unscaled, exactly 9:16), so they can't drift from the boxes. `from` is where a line leaves its
 * box, `to` its dot.
 */
const SCREEN = { w: 308, h: 548 };
const OVERLAY = [
  { box: { left: 6, width: 146, bottom: SCREEN.h - 92 }, from: [64, 92], to: [64, 102] },
  { box: { left: 156, width: 146, bottom: SCREEN.h - 92 }, from: [284, 92], to: [284, 184] },
  { box: { left: 6, width: 124, top: 388 }, from: [82, 388], to: [82, 304] },
  { box: { left: 134, width: 124, bottom: SCREEN.h - 469 }, from: [162, 469], to: [162, 519] },
] as const;

const WIDTH = 770;
/** A part reveals once its spot on the reel scrolls above this share of the viewport — where the eye already is. */
const REVEAL_AT = 0.7;

let probe: HTMLDivElement | null = null;
/**
 * The viewport height with the browser's toolbars showing (100svh). Mobile browsers slide their address bar in and
 * out while you scroll, which changes innerHeight every time; measuring from this keeps the reveal line still.
 */
function stableVh() {
  if (!probe) {
    probe = document.createElement('div');
    // 100vh first as the fallback for browsers without svh
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
}

const Heart = () => <svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" /></svg>;
const Bubble = () => <svg viewBox="0 0 24 24"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5z" /></svg>;
const Send = () => <svg viewBox="0 0 24 24"><path d="M21.5 3 10 13.5M21.5 3l-6.8 18-4.7-7.5L2.5 9z" /></svg>;
const Home = () => <svg viewBox="0 0 24 24"><path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z" /></svg>;
const Search = () => <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>;
const Plus = () => <svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><path d="M12 8v8M8 12h8" /></svg>;
const ReelsIcon = () => <svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><path d="M3.5 8.5h17M9 3.5l2.5 5M14.5 3.5l2.5 5M10.5 12.2v4.6l4-2.3z" /></svg>;
const Note = () => <svg viewBox="0 0 24 24" className="fill"><path d="M9 18.5a3 3 0 1 1-2-2.8V5l12-2.5v12.5a3 3 0 1 1-2-2.8V6.6L9 8.2z" /></svg>;

/**
 * "Anatomy of one reel": an iPhone playing a reel, with numbered callouts wired to each part by connector lines.
 * Nothing pins: as the page scrolls, each part reveals when its spot on the reel passes REVEAL_AT of the viewport, so
 * the notes arrive where the reader is looking. Wide screens put the callouts beside the phone (scaled down under
 * 770px); under 640px they sit on the reel itself, in its black areas (see OVERLAY).
 */
export function Anatomy() {
  const grid = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLSpanElement | null)[]>([]);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  // how many parts are revealed; it only ever grows, so a part never blinks out when scrolling back
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const update = () => {
      const r = stage.current!.getBoundingClientRect();
      const line = stableVh() * REVEAL_AT;
      // each part's own spot on the reel (the phone notes' dots, as a share of the reel's height)
      const passed = OVERLAY.filter((o) => r.top + (o.to[1] / SCREEN.h) * r.height < line).length;
      setShown((n) => Math.max(n, passed));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);


  useEffect(() => {
    const el = grid.current!;
    const narrow = window.matchMedia('(max-width: 640px)');

    /**
     * An element's position inside the grid in layout pixels, walking offsetParents. Unlike getBoundingClientRect
     * this ignores the grid's scale transform, so the SVG (scaled with the grid) can use it as-is in every browser.
     */
    const pos = (n: HTMLElement) => {
      let x = 0, y = 0;
      for (let e: HTMLElement | null = n; e && e !== el; e = e.offsetParent as HTMLElement | null) {
        x += e.offsetLeft + (e.offsetParent && e.offsetParent !== el ? (e.offsetParent as HTMLElement).clientLeft : 0);
        y += e.offsetTop + (e.offsetParent && e.offsetParent !== el ? (e.offsetParent as HTMLElement).clientTop : 0);
      }
      return { x, y };
    };

    const measure = () => {
      const boxesEl = boxes.current as HTMLDivElement[];
      const at = anchors.current.map((a) => {
        const p = pos(a!);
        return { x: p.x + a!.offsetWidth / 2, y: p.y + a!.offsetHeight / 2 };
      });
      const parts = boxesEl[0]?.offsetParent as HTMLElement | null;
      // hidden (the phone layout, or mid-resize into it): nothing to measure
      if (!parts) return;
      const hs = boxesEl.map((c) => c.offsetHeight);
      const ys = at.map((a) => a.y);
      const origin = pos(parts);
      const tops = place(ys.map((y) => y - origin.y), hs, parts.offsetHeight);
      PARTS.forEach((_, i) => {
        const c = boxesEl[i];
        c.style.top = `${tops[i]}px`;
        // lines aim where each box is going, not where it is mid-transition
        const { x: x1, y: y1 } = at[i];
        const y2 = origin.y + tops[i] + hs[i] / 2;
        const x2 = origin.x + c.offsetLeft;
        const xm = x2 - 28;
        lines.current[i]?.setAttribute('d', `M${x1} ${y1}L${xm} ${y1}L${xm} ${y2}L${x2} ${y2}`);
        dots.current[i]?.setAttribute('cx', String(x1));
        dots.current[i]?.setAttribute('cy', String(y1));
      });
    };

    /** Centre each box on its target; boxes that would overlap are stacked as a group centred on their targets. */
    const place = (ys: number[], hs: number[], room: number) => {
      const GAP = narrow.matches ? 8 : 14;
      type Group = { ids: number[]; top: number; h: number };
      const fit = (ids: number[]): Group => {
        let off = 0, sum = 0;
        for (const i of ids) { sum += ys[i] - off - hs[i] / 2; off += hs[i] + GAP; }
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
      const tops: number[] = [];
      for (const g of groups) {
        let y = Math.max(0, Math.min(g.top, room - g.h));
        for (const i of g.ids) { tops[i] = y; y += hs[i] + GAP; }
      }
      return tops;
    };

    /** Scale the grid with a transform (not CSS zoom, which browsers measure differently) to fit the width. */
    let last = '';
    const onResize = (force?: unknown) => {
      const W = el.parentElement!.clientWidth;
      // only a width change re-lays out; a phone's toolbar sliding in and out changes the height alone
      const key = `${W}x${narrow.matches}`;
      if (key === last && force !== true) return;
      last = key;
      el.style.transform = el.style.width = el.style.marginLeft = el.style.marginBottom = '';
      // phones may scale the phone up to the screen width; desktop only ever scales down
      const z = Math.round(Math.max(0.6, narrow.matches ? Math.min(1.3, W / 334) : Math.min(1, W / WIDTH)) * 1000) / 1000;
      // the layout width that fills the clip once scaled: 720px beside-layout on desktop, the full width on phones
      const lw = narrow.matches ? W / z : Math.max(W, WIDTH) === W ? W : WIDTH;
      if (lw !== W) {
        el.style.width = `${lw}px`;
        el.style.marginLeft = `${(W - lw) / 2}px`;
      }
      el.style.transform = z !== 1 ? `scale(${z})` : '';
      // a transform doesn't change layout size, so give back (or make) the space the scale frees (or needs)
      el.style.marginBottom = z !== 1 ? `${-(1 - z) * el.offsetHeight}px` : '';
      // phones draw their callouts inside the phone from fixed coordinates; only desktop measures
      if (!narrow.matches) measure();
    };

    onResize(true);
    document.fonts?.ready.then(() => onResize(true));
    const ro = new ResizeObserver(onResize);
    ro.observe(el.parentElement!);
    window.addEventListener('resize', onResize);
    return () => { ro.disconnect(); window.removeEventListener('resize', onResize); };
  }, []);

  const state = (i: number) => (i < shown ? ' on' : '') + (i === shown - 1 ? ' cur' : '');

  return (
    <div id="anatomy" className="panel anatomy">
      <div className="panel-head">
        <h3 className="h3">Anatomy of one reel</h3>
        <span className="sub">Four parts. Each one does a job.</span>
      </div>
      <div className="anatomy-clip">
        <div className="anatomy-grid" ref={grid}>
          <svg className="anatomy-svg" fill="none" aria-hidden="true">
            {PARTS.map((p, i) => (
              <g key={p.n} className={(p.at ? '' : 'audio') + state(i)}>
                <path ref={(e) => { lines.current[i] = e; }} d="" pathLength={1} />
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
              {/* the reel itself, exactly 9:16; everything placed on the video lives in here */}
              <div className="phone-stage" ref={stage}>
                <div className="phone-video">
                  <LazyVideo src={ANATOMY_VIDEO} />
                  {PARTS.map((p, i) =>
                    p.at ? (
                      <span key={p.n} className={'anchor' + state(i)} data-n={p.n} ref={(e) => { anchors.current[i] = e; }} style={{ left: `${p.at.x * 100}%`, top: `${p.at.y * 100}%` }} />
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
                    <span className={'anchor inline' + state(3)} data-n="04" ref={(e) => { anchors.current[3] = e; }} />
                  </div>
                </div>
                <span className="phone-disc" />
                <svg className="ov-lines" viewBox={`0 0 ${SCREEN.w} ${SCREEN.h}`} fill="none" aria-hidden="true">
                  {OVERLAY.map((o, i) => (
                    <g key={i} className={(PARTS[i].at ? '' : 'audio') + state(i)}>
                      <path d={`M${o.to[0]} ${o.to[1]}L${o.from[0]} ${o.from[1]}`} pathLength={1} />
                      <circle cx={o.to[0]} cy={o.to[1]} r="3.5" />
                    </g>
                  ))}
                </svg>
                {OVERLAY.map((o, i) => (
                  <div key={i} className={'ov' + (PARTS[i].at ? '' : ' audio') + state(i)} style={o.box}>
                    <span className="t"><span className="num">{PARTS[i].n}</span>{PARTS[i].t}</span>
                    <span className="b">{PARTS[i].b}</span>
                  </div>
                ))}
              </div>
              <div className="phone-tabs">
                <Home /><Search /><Plus /><span className="on"><ReelsIcon /></span><span className="me" />
              </div>
              <span className="home-bar" />
            </div>
          </div>

          <div className="parts">
            {PARTS.map((p, i) => (
              <div key={p.n} className={'part' + (p.at ? '' : ' audio') + state(i)} ref={(e) => { boxes.current[i] = e; }}>
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
      <div className={'anatomy-hint' + (shown === PARTS.length ? ' done' : '')} aria-hidden="true">
        <span className="mouse" />
        <span>Scroll to reveal</span>
        <span className="dots">
          {PARTS.map((p, i) => <span key={p.n} className={i < shown ? 'on' : undefined} />)}
        </span>
      </div>
    </div>
  );
}
