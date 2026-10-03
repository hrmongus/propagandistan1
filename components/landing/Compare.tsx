import { DAYS, MAX, SERIES, SPLIT, monthLabel, shortDate } from '@/lib/series';

const W = 1000, H = 300;
const x = (i: number) => (i / (DAYS - 1)) * W;
const y = (v: number) => H * (1 - Math.min(v, MAX) / MAX);
const pct = (n: number) => `${n.toFixed(3)}%`;

const LINE = SERIES.vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
const FILL = `${LINE}L${W} ${H}L0 ${H}Z`;
const LAST = SERIES.vals[DAYS - 1];
const TICKS = [0, 91, 182, 273, DAYS - 1];

/** "Own the growth, don't rent spikes": one year of listeners, paid pushes on the left, daily posting on the right. */
export function Compare() {
  return (
    <div className="panel compare">
      <div className="panel-head">
        <h3 className="h3">Own the growth, don&apos;t rent spikes</h3>
        <span className="sub">Paid promotion method vs FanpageKit</span>
      </div>
      <figure className="sfa" aria-label={`Daily listeners over one year. Paid promotion produces two short spikes that fall back to the floor; FanpageKit grows steadily to ${Math.round(LAST).toLocaleString('en-US')}.`}>
        <div className="sfa-plot">
          {[MAX, MAX / 2, 0].map((v) => (
            <div key={v} className="sfa-grid" style={{ top: pct((y(v) / H) * 100) }}>
              <span>{v ? `${v / 1000}K` : '0'}</span>
            </div>
          ))}
          <div className="sfa-half left"><span>Paid promotion</span></div>
          <div className="sfa-half right"><span>FanpageKit</span></div>
          <div className="sfa-split" style={{ left: pct((x(SPLIT) / W) * 100) }} />
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path className="area" d={FILL} />
            <path className="line" d={LINE} />
          </svg>
          {SERIES.events.map(({ label, i }) => (
            <div key={label} className={'sfa-flag' + (i >= SPLIT ? ' own' : '')} style={{ left: pct((x(i) / W) * 100), top: pct((y(SERIES.vals[i]) / H) * 100) }}>
              <span>{label}</span>
            </div>
          ))}
          <div className="sfa-last" style={{ top: pct((y(LAST) / H) * 100) }} />
          <div className="sfa-tip">{shortDate(DAYS - 1)} · {Math.round(LAST).toLocaleString('en-US')}</div>
        </div>
        <div className="sfa-dates">
          {TICKS.map((i) => <span key={i}>{monthLabel(i)}</span>)}
        </div>
      </figure>
      <span className="sfa-note">Listeners · illustrative, not one artist&apos;s data</span>
    </div>
  );
}
