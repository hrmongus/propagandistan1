'use client';

/* eslint-disable @next/next/no-img-element */
import { Caveat } from 'next/font/google';
import { useEffect, useRef } from 'react';

const hand = Caveat({ subsets: ['latin'], weight: '700', display: 'swap' });

type Pt = [number, number];
/** A handwritten note: where its centre sits, its tilt in degrees and its size, all in the image's pixels. */
type Note = { x: number; y: number; rot: number; size: number };
type Chart = { src: string; w: number; h: number; pen: number; paid: Pt[]; own: Pt[]; paidNote: Note; ownNote: Note };

/** Points along a smooth curve through `pts` (Catmull-Rom), `per` samples between each pair. */
function spline(pts: Pt[], per = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, d: number, e: number) =>
        0.5 * (2 * b + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * A felt-tip loop: a freehand path through hand-placed points (which overshoot the start, so the ends don't meet),
 * turned into a filled outline whose width follows pen pressure — light where the stroke starts, heavier through
 * the middle, wobbling a little, then lifting off. Returns the ink shape and its centre line (used to draw it on).
 */
function stroke(pts: Pt[], pen: number, seed: number) {
  const c = spline(pts);
  const n = c.length - 1;
  const L: Pt[] = [], R: Pt[] = [];
  c.forEach(([x, y], i) => {
    const t = i / n;
    const [ax, ay] = c[Math.max(0, i - 1)], [bx, by] = c[Math.min(n, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    const press = Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 1.05)), 0.55);
    const w = (pen / 2) * (0.25 + 0.75 * press) * (1 + 0.22 * Math.sin(t * 11 + seed) + 0.1 * Math.sin(t * 29 + seed * 3));
    L.push([x + nx * w, y + ny * w]);
    R.push([x - nx * w, y - ny * w]);
  });
  const f = ([x, y]: Pt) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  return {
    ink: `M${L.map(f).join('L')}L${R.reverse().map(f).join('L')}Z`,
    line: `M${c.map(f).join('L')}`,
  };
}

// loops in each image's own pixels, ringing the paid spikes and the climb clear of the axis labels and the tooltip,
// with a note written in the empty space above each
const WIDE: Chart = {
  src: '/uploads/compare/growth-wide.webp', w: 2000, h: 615, pen: 10,
  paid: [[810, 322], [650, 298], [455, 306], [312, 322], [246, 378], [240, 462], [292, 530], [425, 558], [600, 560], [762, 546], [866, 500], [904, 432], [878, 366], [800, 318], [690, 296]],
  paidNote: { x: 480, y: 266, rot: -4, size: 72 },
  ownNote: { x: 1420, y: 214, rot: -10, size: 72 },
  own: [[1850, 130], [1745, 158], [1590, 212], [1425, 284], [1250, 368], [1125, 445], [1078, 505], [1118, 550], [1215, 556], [1372, 518], [1560, 446], [1742, 366], [1880, 298], [1964, 258], [1986, 192], [1958, 130], [1878, 112], [1770, 146]],
};
const SQUARE: Chart = {
  src: '/uploads/compare/growth-square.webp', w: 1440, h: 1440, pen: 15,
  paid: [[565, 905], [422, 818], [298, 798], [214, 852], [188, 975], [214, 1122], [292, 1232], [422, 1276], [562, 1264], [662, 1196], [702, 1078], [668, 968], [592, 910], [480, 858]],
  paidNote: { x: 440, y: 700, rot: -4, size: 96 },
  ownNote: { x: 960, y: 540, rot: -12, size: 96 },
  own: [[1318, 316], [1252, 402], [1158, 602], [1058, 802], [958, 982], [858, 1122], [800, 1205], [828, 1270], [904, 1266], [1022, 1168], [1142, 998], [1262, 818], [1362, 636], [1416, 498], [1420, 378], [1378, 318], [1300, 334], [1214, 430]],
};

const Label = ({ n, className, children }: { n: Note; className: string; children: string }) => (
  <text className={'ink-note ' + className} x={n.x} y={n.y} fontSize={n.size} textAnchor="middle" transform={`rotate(${n.rot} ${n.x} ${n.y})`} style={hand.style}>
    {children}
  </text>
);

const Annotated = ({ c, id, className }: { c: Chart; id: string; className: string }) => {
  const paid = stroke(c.paid, c.pen, 1.7), own = stroke(c.own, c.pen, 4.3);
  return (
    <div className={'sfa-shot ' + className}>
      <img src={c.src} alt="" width={c.w} height={c.h} loading="lazy" decoding="async" />
      <svg viewBox={`0 0 ${c.w} ${c.h}`} aria-hidden="true">
        {/* each ink shape is revealed by its centre line drawing itself on, inside a mask */}
        <mask id={`${id}-paid`} maskUnits="userSpaceOnUse"><path className="ink-reveal paid" d={paid.line} pathLength={1} strokeWidth={c.pen * 3} /></mask>
        <mask id={`${id}-own`} maskUnits="userSpaceOnUse"><path className="ink-reveal own" d={own.line} pathLength={1} strokeWidth={c.pen * 3} /></mask>
        <path className="ink paid" d={paid.ink} mask={`url(#${id}-paid)`} />
        <path className="ink own" d={own.ink} mask={`url(#${id}-own)`} />
        <Label n={c.paidNote} className="paid">Paid promo</Label>
        <Label n={c.ownNote} className="own">Fanpages</Label>
      </svg>
    </div>
  );
};

/** "Own the growth, don't rent spikes": a year of listeners, paid pushes circled in red, daily posting in green. */
export function Compare() {
  const fig = useRef<HTMLElement>(null);

  // without JS (or with reduced motion) the loops are simply there; otherwise they're hidden ('ink-armed') until the
  // chart is well in view, then draw themselves on ('ink-drawn')
  useEffect(() => {
    const el = fig.current!;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.replace('ink-armed', 'ink-drawn'); io.disconnect(); }
    }, { threshold: 0.6 });
    el.classList.add('ink-armed');
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="panel compare">
      <div className="panel-head">
        <h3 className="h3">Own the growth, don&apos;t rent spikes</h3>
        <span className="sub">Paid promotion method vs FanpageKit</span>
      </div>
      <figure ref={fig} className="sfa" aria-label="Daily listeners over one year. Paid promotion produces two short spikes that fall back to the floor; FanpageKit grows steadily to 21,914.">
        <Annotated c={WIDE} id="cmp-wide" className="wide" />
        <Annotated c={SQUARE} id="cmp-square" className="square" />
      </figure>
      <span className="sfa-note">Listeners · illustrative, not one artist&apos;s data</span>
    </div>
  );
}
