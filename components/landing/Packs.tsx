'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics/client';
import { trackClick } from '@/lib/analytics/events';
import { PRICES } from '@/lib/checkout';
import { AESTHETIC_EVENT, PACKS } from '@/lib/data';
import { BundleFans, Fan } from '../Fan';
import { Seal } from './Seal';

const singles = PACKS.filter((p) => !p.bundle);
const bundle = PACKS.find((p) => p.bundle)!;
/** The monthly plan's real saving against buying a pack once, so the sign can never overstate it. */
const SUB_OFF = Math.round(((PRICES.pack - PRICES.packMonthly) / PRICES.pack) * 100);

/**
 * The offer, top to bottom: the monthly subscription (it starts with the chosen look), the one pack that's picked,
 * with its aesthetic picker under its visual, then the four-pack bundle. Every card carries the money back seal.
 */
export function Packs() {
  const [sel, setSel] = useState(0);
  const p = singles[sel];

  // the FAQ's genre chips pick an aesthetic from outside this section
  useEffect(() => {
    const onPick = (e: Event) => {
      const i = singles.findIndex((s) => s.slug === (e as CustomEvent<string>).detail);
      if (i >= 0) setSel(i);
    };
    window.addEventListener(AESTHETIC_EVENT, onPick);
    return () => window.removeEventListener(AESTHETIC_EVENT, onPick);
  }, []);

  // the picked aesthetic gives the whole page a faint tint of its colour (see --bg in globals.css)
  useEffect(() => {
    const root = document.documentElement;
    if (p.tint) root.style.setProperty('--aesthetic', p.tint);
    return () => { root.style.removeProperty('--aesthetic'); };
  }, [p.tint]);

  return (
    <section id="packs" className="section">
      <div className="packs">
        <div id="subscribe" className="sub-offer">
          <Seal uid="sub" className="seal sub-seal" />
          <div className="sub-copy">
            <span className="sub-kicker">Subscribe &amp; save</span>
            <h3 className="sub-title">A new pack every month</h3>
            <p>Start with {p.name}, then a fresh 30-video pack lands every month. Cancel any time in one click.</p>
            <div className="sub-buy">
              <span className="pack-price"><span className="now">${PRICES.packMonthly}<small>/mo</small></span><span className="was">${PRICES.pack}</span></span>
              <Link className="btn btn-green" href={`/checkout?pack=${p.slug}&plan=monthly`} {...trackClick('pack_selected', { pack: p.slug, price: PRICES.packMonthly, bundle: false, plan: 'monthly' })}>
                Subscribe — ${PRICES.packMonthly}/mo
              </Link>
            </div>
          </div>
          <span className="sub-burst" aria-label={`${SUB_OFF}% off every pack`}>
            <b>{SUB_OFF}%</b>OFF
          </span>
        </div>

        <div className="packs-grid">
          <div className="pack solo">
            <div className="solo-visual">
              <div className="fan-box">
                <Seal uid="solo" className="seal corner-seal" />
                <Fan gi={sel} size="big" />
              </div>
              {/* colourway-style picker under the visual: one photo swatch per aesthetic */}
              <div className="aesthetics">
                <span className="aesthetics-label" id="aesthetic-label">Aesthetic: <b>{p.name}</b></span>
                <div className="swatches" role="radiogroup" aria-labelledby="aesthetic-label">
                  {singles.map((s, i) => (
                    <button
                      key={s.slug}
                      type="button"
                      role="radio"
                      aria-checked={i === sel}
                      aria-label={s.name}
                      title={s.name}
                      className={'swatch' + (i === sel ? ' on' : '')}
                      onClick={() => {
                        if (i === sel) return;
                        setSel(i);
                        track('aesthetic_selected', { pack: s.slug });
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/uploads/packs/${s.slug}-1.webp`} alt="" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pack-body" key={p.slug}>
              <div className="pack-meta">
                <span>{p.n}</span>
                <span style={{ color: p.stockColor }}>{p.stock}</span>
              </div>
              <span className="pack-name">{p.name}</span>
              <span className="pack-genres">{p.genres}</span>
              <p className="pack-desc">{p.desc}</p>
              <div className="solo-buy">
                <span className="pack-price">
                  <span className="now">${p.priceN}</span>
                  <span className="was">${PRICES.packWas}</span>
                  <span className="deal">−{Math.round(((PRICES.packWas - p.priceN) / PRICES.packWas) * 100)}% · launch price</span>
                </span>
                <Link className="btn btn-outline" href={`/checkout?pack=${p.slug}`} {...trackClick('pack_selected', { pack: p.slug, price: p.priceN, bundle: false, plan: 'once' })}>{p.cta}</Link>
              </div>
            </div>
          </div>
          <div className="pack bundle">
            <div className="fan-box">
              <Seal uid="bundle" className="seal corner-seal" />
              <span className="wide"><BundleFans size="mid" /></span>
              <span className="narrow"><BundleFans size="tiny" /></span>
            </div>
            <div className="pack-body">
              <span className="bundle-kicker">Best value · {bundle.n}</span>
              <span className="pack-name">{bundle.name}</span>
              <span className="pack-genres">{bundle.genres}</span>
              <p className="pack-desc">{bundle.desc}</p>
              <div className="pack-price">
                <span className="now">${bundle.priceN}</span>
                <span className="was">{bundle.was}</span>
                <span className="save">{bundle.stock}</span>
              </div>
              <Link className="btn btn-green" href={`/checkout?pack=${bundle.slug}`} {...trackClick('pack_selected', { pack: bundle.slug, price: bundle.priceN, bundle: true, plan: 'once' })}>{bundle.cta}</Link>
            </div>
          </div>
        </div>
        <p className="licence">
          <span className="k">Licence:</span> you own everything you make with it — commercial use, unlimited posts, no
          royalties, no credit, no expiry. The only thing you can&apos;t do is resell the pack itself.
        </p>
      </div>
    </section>
  );
}
