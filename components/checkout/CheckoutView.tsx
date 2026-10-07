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
          <div className="order-name"><span>{m.orderName}</span><span>{m.orderPrice}</span></div>
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
            <span className="copy">
              <span className="kicker">{m.monthly ? 'Upgrade · pay once' : 'Upgrade'}</span>
              <span className="t">4× your content, 4× your reach</span>
              <span className="b">Posting 4× a day brings more than 4× the impact. Get all four packs of this month — 120 videos instead of 30.</span>
              <span className="p"><b>{m.upgrade.add}</b> · {m.upgrade.total} <s>$148</s></span>
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
        </div>}
      </div>

      <PayCard order={order} m={m} />
    </div>
  );
}
