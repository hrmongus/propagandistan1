import { rng } from '@/lib/analyzer/metrics';
import { RADAR_LABELS, type RadarKey } from '@/lib/analyzer/metrics';

/*
 * Charts drawn as inline SVG, matching the mock-ups. The growth lines are illustrative fixed shapes with
 * S4A-style daily noise, not a forecast (HANDOFF.md §5.6).
 */

const fmt = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));

/** A jagged line from (x0, y0) to (x1, y1) following `shape(t)` (0→1), with seeded daily noise. */
function jagged(seed: number, x0: number, x1: number, y0: number, y1: number, shape: (t: number) => number, noise: number, n = 80) {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const jitter = i === 0 || i === n ? 0 : (r() - 0.5) * noise * (0.4 + t);
    const spike = i > 4 && i < n - 1 && r() < 0.05 ? -noise * 2.4 * r() : 0;
    pts.push([x0 + (x1 - x0) * t, Math.min(y0, y0 + (y1 - y0) * shape(t) + jitter + spike)]);
  }
  return pts;
}
const d = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Screen 04: today → month 6 card. Re-draws as the goal changes. */
export function GoalChart({ today, goal, goalValue }: { today: string; goal: string | null; goalValue: number }) {
  const pts = jagged(7 + goalValue, 6, 312, 56, 8, (t) => t ** 1.6, 5);
  return (
    <section aria-label="Your target" className="fpb-goalcard" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 24, background: '#fff', border: '1px solid #e6e8ec' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: '#6b7280' }}>TODAY</span>
          <span style={{ font: '600 20px/1 var(--font-mono)', letterSpacing: '-.02em', color: '#6b7280' }}>{today}</span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: '#6b7280' }}>MONTH 6</span>
          <span style={{ font: '600 28px/1 var(--font-mono)', letterSpacing: '-.03em', color: goal ? '#111827' : '#c4c7cc' }}>{goal ?? '—'}</span>
        </span>
      </div>
      <svg viewBox="0 0 318 64" role="img" aria-label="Path from today to your 6-month goal" style={{ display: 'block', width: '100%', height: 'auto' }}>
        {[16, 40, 63].map((y) => <line key={y} x1="0" y1={y} x2="318" y2={y} stroke="#e5e7eb" strokeWidth="1" />)}
        <line x1="0" y1="8" x2="318" y2="8" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 4" />
        <path d={`${d(pts)} L312,63 L6,63 Z`} fill="#D6E4FB" opacity={goal ? 1 : 0.4} />
        <path d={d(pts)} fill="none" stroke="#1D6CF0" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" opacity={goal ? 1 : 0.35} />
        <circle cx="312" cy="8" r="4.5" fill="#1D6CF0" opacity={goal ? 1 : 0.35} />
      </svg>
      <span style={{ fontSize: 12, lineHeight: 1.3, color: '#6b7280' }}>This becomes the goal line on your growth chart.</span>
    </section>
  );
}

/** Screen 17: 0 / 1 / 3 pages over 6 months, dashed goal line; the 3-page line crosses the goal around month 5. */
export function GrowthChart({ goalValue, seed }: { goalValue: number; seed: number }) {
  const X0 = 40, X1 = 270, Y0 = 180, YG = 30; // axes: y=180 is 0, y=30 is the goal
  const none = jagged(seed + 1, X0, X1, Y0 - 4, Y0 - 14, (t) => t, 1.5);
  const one = jagged(seed + 2, X0, X1, Y0 - 4, Y0 - (Y0 - YG) * 0.52, (t) => t ** 1.25, 4);
  const three = jagged(seed + 3, X0, X1, Y0 - 4, YG - 2, (t) => (t < 0.83 ? (t / 0.83) ** 1.5 * 0.985 : 0.985 + (t - 0.83) * 0.09), 6);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox="0 0 340 230" role="img" aria-label={`Illustrative listener growth over 6 months with 0, 1 and 3 fan pages; 3 pages crosses the ${goalValue.toLocaleString('en-US')} goal around month 5`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      {ticks.map((t) => {
        const y = Y0 - (Y0 - YG) * t;
        return (
          <g key={t}>
            <line x1={X0} x2={X1} y1={y} y2={y} stroke={t === 0 ? '#b3b3b3' : '#e6e6e6'} />
            <text x="32" y={y + 4} textAnchor="end" fontFamily="var(--font-geist), sans-serif" fontSize="10" fill="#6a6a6a">{fmt(Math.round(goalValue * t))}</text>
          </g>
        );
      })}
      <line x1={X0} x2={X1} y1={YG} y2={YG} stroke="#121212" strokeWidth="1.2" strokeDasharray="4 4" />
      <text x="44" y="24" fontFamily="var(--font-geist), sans-serif" fontSize="10" fontWeight="600" fill="#121212">Your goal: {goalValue.toLocaleString('en-US')}</text>
      <path d={`${d(three)} L${X1},${Y0} L${X0},${Y0} Z`} fill="#D6E4FB" />
      <path d={d(none)} fill="none" stroke="#b3b3b3" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d(one)} fill="none" stroke="#8DB3F6" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d(three)} fill="none" stroke="#1D6CF0" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X1} cy={three[three.length - 1][1]} r="4" fill="#1D6CF0" />
      <text x="278" y={none[none.length - 1][1] + 3} fontFamily="var(--font-geist), sans-serif" fontSize="10" fill="#6a6a6a">No pages</text>
      <text x="278" y={one[one.length - 1][1] + 3} fontFamily="var(--font-geist), sans-serif" fontSize="10" fill="#535353">1 page</text>
      <text x="278" y={three[three.length - 1][1] + 16} fontFamily="var(--font-geist), sans-serif" fontSize="10" fontWeight="600" fill="#1D6CF0">3 pages</text>
      <text x={X0} y="200" fontFamily="var(--font-geist), sans-serif" fontSize="10" fill="#6a6a6a">Today</text>
      <text x={(X0 + X1) / 2 + 3} y="200" textAnchor="middle" fontFamily="var(--font-geist), sans-serif" fontSize="10" fill="#6a6a6a">Month 3</text>
      <text x={X1} y="200" textAnchor="end" fontFamily="var(--font-geist), sans-serif" fontSize="10" fill="#6a6a6a">Month 6</text>
    </svg>
  );
}

/** Screen 17: six-axis short-form profile. */
export function Radar({ values }: { values: Record<RadarKey, number> }) {
  const keys: RadarKey[] = ['hook', 'emotion', 'replay', 'relatability', 'shareability', 'visualFit'];
  const cx = 150, cy = 128, R = 84;
  const pt = (i: number, f: number): [number, number] => {
    const a = (-90 + i * 60) * (Math.PI / 180);
    return [+(cx + Math.cos(a) * R * f).toFixed(1), +(cy + Math.sin(a) * R * f).toFixed(1)];
  };
  const ring = (f: number) => keys.map((_, i) => pt(i, f).join(',')).join(' ');
  const shape = keys.map((k, i) => pt(i, values[k] / 100));
  const label = (i: number) => {
    const k = keys[i], v = values[k], name = RADAR_LABELS[k];
    const font = { fontFamily: 'var(--font-geist), sans-serif', fontSize: 12, fontWeight: 600, fill: '#F5F5F7' } as const;
    const mono = { fontFamily: 'var(--font-geist-mono), monospace', fill: '#A1A1A6' } as const;
    if (i === 0) return <text key={k} x={cx} y={18} textAnchor="middle" {...font}>{name} <tspan {...mono}>{v}</tspan></text>;
    if (i === 3) return <text key={k} x={cx} y={234} textAnchor="middle" {...font}>{name} <tspan {...mono}>{v}</tspan></text>;
    const right = i < 3, y = i === 1 || i === 5 ? 78 : 176;
    return (
      <g key={k}>
        <text x={right ? 236 : 64} y={y} textAnchor={right ? 'start' : 'end'} {...font}>{name}</text>
        <text x={right ? 236 : 64} y={y + 15} textAnchor={right ? 'start' : 'end'} fontSize="11" {...mono}>{v}</text>
      </g>
    );
  };
  return (
    <svg viewBox="-24 0 348 256" role="img" aria-label={`Short-form profile: ${keys.map((k) => `${RADAR_LABELS[k].toLowerCase()} ${values[k]}`).join(', ')}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      {[1, 0.75, 0.5, 0.25].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="#2E2E32" strokeWidth="1" />)}
      {keys.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2E2E32" />; })}
      <polygon points={shape.map((p) => p.join(',')).join(' ')} fill="#22D46B" fillOpacity="0.16" stroke="#22D46B" strokeWidth="2.5" strokeLinejoin="round" />
      {shape.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#22D46B" />)}
      {keys.map((_, i) => label(i))}
    </svg>
  );
}
