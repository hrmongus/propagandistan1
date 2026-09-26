'use client';

import { useEffect, useRef, useState } from 'react';
import { SERIES, type Series } from '@/lib/series';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Chart({ S, id, flags, tip }: { S: Series; id: string; flags: [string, number][]; tip: string }) {
  return (
    <div className="chart-panel">
      <svg viewBox="0 0 400 210" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1F5FD8" stopOpacity=".28" />
            <stop offset="1" stopColor="#1F5FD8" stopOpacity=".05" />
          </linearGradient>
        </defs>
        <line className="grid" x1="0" y1="20" x2="400" y2="20" />
        <line className="grid" x1="0" y1="105" x2="400" y2="105" />
        <line className="grid" x1="0" y1="190" x2="400" y2="190" />
        <line className="axis0" x1="18" y1="20" x2="18" y2="190" />
        <path d={S.fill} fill={`url(#${id})`} />
        <path className="line" d={S.line} />
        <line className="last" x1={S.lx} y1="20" x2={S.lx} y2={S.ly} />
      </svg>
      <div className="axis-pill" style={{ top: 26 }}>30K</div>
      <div className="axis-pill" style={{ top: 115 }}>15K</div>
      <div className="axis-pill zero">0</div>
      <div className="chart-dot" style={{ left: `calc(14px + (100% - 28px) * ${S.lxf})`, top: `calc(14px + 220px * ${S.lyf})` }} />
      {flags.map(([label, i]) => {
        const p = S.at(i);
        return (
          <div key={label} className="chart-flag" style={{ left: `calc(14px + (100% - 28px) * ${p.xf})`, top: `calc(14px + 220px * ${p.yf} - 46px)` }}>
            <span>{label}</span>
            <span />
          </div>
        );
      })}
      <div className="chart-tip">{tip}</div>
      <div className="chart-dates"><span>Mar 24</span><span>Sep 24</span></div>
    </div>
  );
}

/** "Spikes you rent, or a curve you own": draggable before/after comparison. */
export function Compare() {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [split, setSplitState] = useState(50);
  const setSplit = (pct: number) => setSplitState(clamp(pct, 18, 82));

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || !box.current) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const r = box.current.getBoundingClientRect();
      setSplitState(clamp(((x - r.left) / r.width) * 100, 18, 82));
    };
    const end = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };
  }, []);

  return (
    <div className="panel compare">
      <div className="panel-head">
        <h3 className="h3">Spikes you rent, or a curve you own</h3>
        <span className="sub">Drag the divider · illustrative, not one artist&apos;s data</span>
      </div>
      <div className="compare-copy">
        <p><span className="lead">Before — the usual methods.</span> Every push buys a spike. The spike decays in ten days and you&apos;re back where you started, minus the budget.</p>
        <p><span className="lead">After — daily faceless posting.</span> No spike to point at. Every clip keeps surfacing, the audio page keeps collecting taps, and the floor moves up.</p>
      </div>
      <div className="compare-box" ref={box}>
        <div className="compare-layer">
          <div className="compare-label right"><span className="small">Listeners · Last 6 months</span><span className="big">Daily faceless posting</span></div>
          <Chart S={SERIES.R} id="fillR" flags={[['FanpageKit', 128]]} tip={`9/24/26 • ${SERIES.R.lv.toLocaleString('en-US')}`} />
        </div>
        <div className="compare-layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <div className="compare-label"><span className="big">The usual methods</span><span className="small">Listeners · Last 6 months</span></div>
          <Chart S={SERIES.L} id="fillL" flags={[['Playlist pitching', 44], ['Meta ads', 104]]} tip={`9/24/26 • ${SERIES.L.lv.toLocaleString('en-US')}`} />
        </div>
        <div
          className="compare-handle"
          style={{ left: `${split}%` }}
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={18}
          aria-valuemax={82}
          aria-valuenow={Math.round(split)}
          tabIndex={0}
          onMouseDown={(e) => { dragging.current = true; e.preventDefault(); }}
          onTouchStart={() => { dragging.current = true; }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { setSplit(split - 2); e.preventDefault(); }
            if (e.key === 'ArrowRight') { setSplit(split + 2); e.preventDefault(); }
          }}
        >
          <span className="bar" />
          <span className="knob"><span>‹</span><span>›</span></span>
        </div>
      </div>
    </div>
  );
}
