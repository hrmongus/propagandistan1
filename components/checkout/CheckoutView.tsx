'use client';

import Link from 'next/link';
import { useState } from 'react';
import { track } from '@/lib/analytics/client';
import { trackClick } from '@/lib/analytics/events';
import { checkoutModel, type Order, type Plan } from '@/lib/checkout';
import { PACKS } from '@/lib/data';
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

/** Upgrade visual: their pack, plus the three it adds (marked +); tick it and all four light up. */
function FourX({ on, lit }: { on: boolean; lit: number }) {
  return (
    <span className="fourx" aria-hidden="true">
      <span className="fx-fans">
        {[0, 1, 2, 3].map((g) => (
          <span key={g} className={on || g === lit ? 'fx-fan lit' : 'fx-fan'} style={{ transitionDelay: on ? `${g * 70}ms` : '0ms' }}>
            <Fan gi={g} size="tiny" />
            {!on && g !== lit && <span className="fx-plus">+</span>}
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
              <span className="kicker">{m.bundleUp ? 'Added · all four packs' : 'Best value'}</span>
              <span className="t">4× your content, 4× your reach</span>
              <span className="b">All four packs: 120 videos instead of 30, a look for every song.</span>
              <span className="p">
                <span className="lbl">Add 3 more packs</span>
                <s>${m.upgrade.was}</s>
                <b>+${m.upgrade.add}</b>
                <span className="save">Save ${m.upgrade.was - m.upgrade.add}</span>
              </span>
            </span>
            <span className="check">{m.bundleUp ? '✓' : '+'}</span>
          </button>
        )}

      </div>

      <PayCard order={order} m={m} />
    </div>
  );
}
