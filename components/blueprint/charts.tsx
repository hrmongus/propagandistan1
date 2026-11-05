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

/* ---------- Screen 04: Spotify-for-Artists-style goal chart ---------- */

const S4A = { ink: '#121212', muted: '#6a6a6a', grid: '#e1e1e1', base: '#b3b3b3', blue: '#1D6CF0', fill: '#D6E4FB', grey: '#b3b3b3' };

/** Round axis maximum: 1, 2, 2.5 or 5 × 10^n, at least `v`. */
function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((x) => x >= v) ?? 10 * p;
}

/** Daily series with S4A-like jitter and the occasional spike. `shape(t)` runs 0→1 over the 6 months. */
function series(seed: number, n: number, from: number, to: number, shape: (t: number) => number, jitter: number, spikes: number, spikeSize = 0.45) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = from + (to - from) * shape(t);
    if (i === 0 || i === n - 1) return base;
    const spike = r() < spikes ? base * spikeSize * (0.5 + r()) : 0;
    return Math.max(0, base * (1 + (r() - 0.5) * jitter) + spike);
  });
}

/**
 * Screen 04: grey line = where they are now, growing slowly from their listener bracket; blue line = the path to the
 * goal they pick, a hockey stick that gets steeper the bigger the jump. Illustrative shapes, not a forecast.
 */
export function GoalChart({ start, today, goal, goalValue }: { start: number; today: string; goal: string | null; goalValue: number }) {
  const N = 120;
  const W = 340, H = 200, L = 58, R = 8, T = 10, B = 26;
  const max = niceMax(Math.max(goalValue || 0, start * 1.6));
  const x = (i: number) => L + ((W - L - R) * i) / (N - 1);
  const y = (v: number) => T + (H - T - B) * (1 - Math.min(v, max * 1.08) / max);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');

  // Without fan pages: barely moves (+15% over 6 months).
  const flat = series(11 + start, N, start, start * 1.15, (t) => t, 0.05, 0.02, 0.08);
  // With fan pages: hockey stick, steeper the larger the multiple from today to the goal.
  const ratio = goalValue ? Math.max(1.5, goalValue / start) : 1;
  const k = Math.min(4.2, 1.4 + Math.log10(ratio) * 1.1);
  const stick = goalValue ? series(7 + goalValue, N, start, goalValue, (t) => t ** k, 0.14, 0.02) : null;
  if (stick) stick[N - 1] = goalValue;

  const now = new Date();
  const months = [0, 2, 4, 6].map((m) => ({ i: Math.round(((N - 1) * m) / 6), label: m === 0 ? 'Today' : new Date(now.getFullYear(), now.getMonth() + m, 1).toLocaleString('en-US', { month: 'short' }) + ' 1' }));
  const font = 'var(--font-geist), -apple-system, sans-serif';

  return (
    <section aria-label="Your 6-month path" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 16px 14px', borderRadius: 24, background: '#fff', border: '1px solid #e6e6e6', color: S4A.ink }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: `700 22px/1.1 ${font}`, letterSpacing: '-0.035em' }}>Listeners, next 6 months</span>
        <span style={{ fontSize: 13, color: S4A.muted }}>Today – {months[3].label.replace(' 1', '')} · Worldwide</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 12px', borderRadius: 8 }}>
          <div style={{ fontSize: 12.5, color: S4A.muted }}>Today</div>
          <div style={{ font: `700 18px/1.3 ${font}`, letterSpacing: '-0.02em', color: '#535353' }}>{today}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f3f3f3' }}>
          <div style={{ fontSize: 12.5, color: S4A.muted }}>Month 6 goal</div>
          <div style={{ font: `700 18px/1.3 ${font}`, letterSpacing: '-0.02em', color: goal ? S4A.ink : '#c4c4c4' }}>{goalValue ? goalValue.toLocaleString('en-US') : 'Pick below'}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={goal ? `Without fan pages you stay around ${today}; with fan pages the line climbs to ${goal} by month 6` : `Without fan pages you stay around ${today}`} style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} stroke={f === 0 ? S4A.base : S4A.grid} strokeWidth={f === 0 ? 1.2 : 1} />
            <text x={L - 8} y={y(max * f) + 4} textAnchor="end" fontFamily={font} fontSize="11.5" fill={S4A.muted}>{Math.round(max * f).toLocaleString('en-US')}</text>
          </g>
        ))}
        {stick && <path d={`${path(stick)}L${x(N - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={S4A.fill} />}
        <path d={path(flat)} fill="none" stroke={S4A.grey} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        {stick && <path key={goalValue} className="fpb-anim-step" d={path(stick)} fill="none" stroke={S4A.blue} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />}
        {months.map((m) => (
          <text key={m.i} x={x(m.i)} y={H - 6} textAnchor={m.i === 0 ? 'start' : m.i === N - 1 ? 'end' : 'middle'} fontFamily={font} fontSize="11.5" fill={S4A.muted}>{m.label}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: S4A.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: S4A.grey }} />Without fan pages</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: goal ? 1 : 0.4 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: S4A.blue }} />With fan pages</span>
      </div>
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
