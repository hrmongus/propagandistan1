'use client';

import Link from 'next/link';
import { useState } from 'react';
import { track } from '@/lib/analytics/client';
import { trackClick } from '@/lib/analytics/events';
import { checkoutModel, PRICES, type Order, type Plan } from '@/lib/checkout';
import { PACKS } from '@/lib/data';
import { SERIES, SPLIT } from '@/lib/series';
import { Fan } from '../Fan';
import { TrackView } from '../TrackView';
import { PayCard } from './PayCard';

const FLAMES = [
  { left: '6%', size: 10, bg: '#FF6A00', dur: '1.4s', delay: '0s' },
  { left: '18%', size: 7, bg: '#FFB000', dur: '1.1s', delay: '.2s' },
  { left: '31%', size: 12, bg: '#FF3D00', dur: '1.6s', delay: '.5s' },
  { left: '44%', size: 8, bg: '#FFC933', dur: '1.2s', delay: '.35s' },
  { left: '57%', size: 11, bg: '#FF6A00', dur: '1.5s', delay: '.1s' },
  { left: '70%', size: 7, bg: '#FFB000', dur: '1.05s', delay: '.6s' },
  { left: '83%', size: 10, bg: '#FF3D00', dur: '1.35s', delay: '.25s' },
  { left: '93%', size: 8, bg: '#FFC933', dur: '1.25s', delay: '.45s' },
];

/*
 * Subscription chart, Spotify-for-Artists style: daily listeners over six months of posting (the growth half of the
 * landing page's series). Paying once: the blue stops after month 1 and a grey dashed line shows it fading back.
 */
const GW = 600, GH = 120;
const POSTING = SERIES.vals.slice(SPLIT, SPLIT + 180);
const G_MAX = Math.max(...POSTING) * 1.08;
const gx = (i: number) => (i / (POSTING.length - 1)) * GW;
const gy = (v: number) => GH * (1 - v / G_MAX);
const path = (vals: number[], from = 0) => vals.map((v, i) => `${i ? 'L' : 'M'}${gx(i + from).toFixed(1)} ${gy(v).toFixed(1)}`).join('');
const MONTH = 30;
const GROW_LINE = path(POSTING);
const GROW_AREA = `${GROW_LINE}L${GW} ${GH}L0 ${GH}Z`;
const FIRST = POSTING.slice(0, MONTH + 1);
const FIRST_LINE = path(FIRST);
const FIRST_AREA = `${FIRST_LINE}L${gx(MONTH)} ${GH}L0 ${GH}Z`;
// stop posting after month 1: listeners drift back toward where they started
const FADE = POSTING.slice(MONTH).map((_, k) => POSTING[0] + (POSTING[MONTH] - POSTING[0]) * Math.exp(-k / 18));
const FADE_LINE = path(FADE, MONTH);
const LAST = POSTING[POSTING.length - 1];

function SubGrowth({ monthly }: { monthly: boolean }) {
  const endY = monthly ? gy(LAST) : gy(FADE[FADE.length - 1]);
  return (
    <figure className={monthly ? 'sub-growth on' : 'sub-growth'} aria-label={monthly ? 'Listeners keep climbing over six months of posting' : 'Listeners fade after you stop posting at month one'}>
      <div className="sg-plot">
        <svg viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none" aria-hidden="true">
          {monthly ? (
            <>
              <path className="area" d={GROW_AREA} />
              <path className="line" d={GROW_LINE} />
            </>
          ) : (
            <>
              {/* what keeping going would have looked like */}
              <path className="ghost" d={GROW_LINE} />
              <path className="area" d={FIRST_AREA} />
              <path className="line" d={FIRST_LINE} />
              <path className="fade" d={FADE_LINE} />
            </>
          )}
        </svg>
        <span className={monthly ? 'sg-dot' : 'sg-dot off'} style={{ top: `${(endY / GH) * 100}%` }} />
        <span className="sg-tip">{monthly ? `Month 6 · ${Math.round(LAST).toLocaleString('en-US')}` : 'Stopped posting'}</span>
      </div>
      <div className="sg-months">{[1, 2, 3, 4, 5, 6].map((n) => <span key={n}>M{n}</span>)}</div>
      <figcaption>Consistency pays off — every month you post stacks on the last.</figcaption>
    </figure>
  );
}

/** Upgrade visual: one pack lit, three waiting; tick it and all four light up. */
function FourX({ on, lit }: { on: boolean; lit: number }) {
  return (
    <span className="fourx" aria-hidden="true">
      <span className="fx-fans">
        {[0, 1, 2, 3].map((g) => (
          <span key={g} className={on || g === lit ? 'fx-fan lit' : 'fx-fan'} style={{ transitionDelay: on ? `${g * 70}ms` : '0ms' }}>
            <Fan gi={g} size="tiny" />
          </span>
        ))}
      </span>
      <span className="fx-num">4×</span>
      <span className="fx-count"><b>{on ? 120 : 30}</b> videos{on ? '' : ' → 120'}</span>
    </span>
  );
}

export function CheckoutView({ initial }: { initial: Order }) {
  const [bundleUp, setBundleUp] = useState(initial.bundleUp);
  const [plan, setPlan] = useState<Plan>(initial.plan);
  const order: Order = { pack: initial.pack, bundleUp, plan };
  const m = checkoutModel(order);
  const packIndex = ['golden-hour', 'midnight-city', 'coastal-drive', 'forest-trail'].indexOf(m.sel.slug);

  return (
    <div className="co-grid">
      <TrackView event="checkout_viewed" props={{ pack: initial.pack, plan: initial.plan, bundle_up: initial.bundleUp }} />
      <div className="co-left">
        <div className="card order">
          <div className="order-top">
            <span className="k">Your order</span>
            <Link className="link-btn" href="/#packs" {...trackClick('checkout_change_pack_clicked', { pack: initial.pack })}>Change pack</Link>
          </div>
          <div className="order-fans">
            {m.isBundleOrder ? (
              <div className="order-bundle">
                {PACKS.filter((p) => !p.bundle).map((p, g) => (
                  <div className="cell" key={p.slug}>
                    <span className="wide"><Fan gi={g} size="mid" /></span>
                    <span className="narrow"><Fan gi={g} size="small" /></span>
                    <span className="name">{p.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="row"><Fan gi={packIndex} size="big" /></div>
            )}
          </div>
          <div className="order-name"><span>{m.orderName}</span><span className="op">{m.orderWas && <><span className="deal">−{m.dealPct}% · launch price</span><s className="was">{m.orderWas}</s></>}{m.orderPrice}</span></div>
          <div className="order-items">
            {m.items.map(([k, v]) => (
              <div className="order-item" key={k}>
                <span className="k"><span className="tick">✓</span>{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {!m.sel.bundle && (
          <button className={m.bundleUp ? 'bundle-up on' : 'bundle-up'} type="button" aria-pressed={m.bundleUp} onClick={() => { setBundleUp(!m.bundleUp); if (!m.bundleUp) setPlan('once'); track('checkout_bundle_toggled', { pack: initial.pack, enabled: !m.bundleUp }); }}>
            {m.bundleUp && (
              <div className="flames">
                {FLAMES.map((f, i) => (
                  <span key={i} style={{ left: f.left, width: f.size, height: f.size, background: f.bg, animationDuration: f.dur, animationDelay: f.delay }} />
                ))}
                <div className="glow" />
              </div>
            )}
            <FourX on={m.bundleUp} lit={packIndex} />
            <span className="copy">
              <span className="kicker">{m.monthly ? 'Upgrade · pay once' : 'Upgrade'}</span>
              <span className="t">4× your content, 4× your reach</span>
              <span className="b">Posting 4× a day brings more than 4× the impact. Get all four packs of this month — 120 videos instead of 30.</span>
              <span className="p"><b>{m.upgrade.add}</b> · {m.upgrade.total} <s>${PRICES.fourSingles}</s></span>
            </span>
            <span className="check">{m.bundleUp ? '✓' : ''}</span>
          </button>
        )}

        {!m.sel.bundle && <div className="card sub-card">
          <span className="k">Pay once, or subscribe and save ${m.subSave} a month</span>
          <div className="sub-opts" role="radiogroup">
            {m.plans.map((u) => {
              const on = (m.monthly ? 'monthly' : 'once') === u.id;
              const pick = () => {
                setPlan(u.id);
                if (u.id === 'monthly') setBundleUp(false);
                if (!on) track('checkout_plan_selected', { pack: initial.pack, plan: u.id });
              };
              return (
                <button key={u.id} className={on ? 'sub-opt on' : 'sub-opt'} type="button" role="radio" aria-checked={on} onClick={pick}>
                  <span className="ring"><i /></span>
                  <span className="txt"><span className="t">{u.title}</span><span className="b">{u.body}</span></span>
                  <span className="pr"><span className="now">{u.price}</span>{u.was && <span className="was">{u.was}</span>}</span>
                </button>
              );
            })}
          </div>
          <SubGrowth monthly={m.monthly} />
        </div>}
      </div>

      <PayCard order={order} m={m} />
    </div>
  );
}
