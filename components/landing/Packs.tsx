'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics/client';
import { trackClick } from '@/lib/analytics/events';
import { PRICES } from '@/lib/checkout';
import { AESTHETIC_EVENT, PACKS } from '@/lib/data';
import { BundleFans, Fan } from '../Fan';
import { Seal } from './Seal';

const singles = PACKS.filter((p) => !p.bundle);
const bundle = PACKS.find((p) => p.bundle)!;

/**
 * The offer: the one pack that's picked, with its aesthetic picker under its visual, then the four-pack bundle.
 * Both cards carry the money-back badge. The monthly plan is offered at checkout.
 */
export function Packs() {
  const [sel, setSel] = useState(0);
  // which way the preview slides in (+1 from the right, -1 from the left) and whether the visitor has tried it yet
  const [dir, setDir] = useState(1);
  const [touched, setTouched] = useState(false);
  const [hint, setHint] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const swipeX = useRef<number | null>(null);
  const bundleBox = useRef<HTMLDivElement>(null);
  const bundleRow = useRef<HTMLSpanElement>(null);

  // scale the bundle's row of fans to the space it has, so it stays one row at every width
  useEffect(() => {
    const box = bundleBox.current!, row = bundleRow.current!;
    const fit = () => {
      row.style.zoom = '';
      const cs = getComputedStyle(box);
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const s = Math.min(1, room / row.scrollWidth);
      row.style.zoom = s < 1 ? String(Math.floor(s * 1000) / 1000) : '';
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);
  const p = singles[sel];

  const pick = (i: number, method: 'swatch' | 'arrow' | 'swipe') => {
    const next = (i + singles.length) % singles.length;
    setTouched(true);
    if (next === sel) return;
    setDir(i > sel ? 1 : -1);
    setSel(next);
    track('aesthetic_selected', { pack: singles[next].slug, method });
  };

  // the first time the card is on screen, the preview nudges sideways once, like a swipe, to show it can be changed
  useEffect(() => {
    const el = card.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setHint(true); io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the FAQ's genre chips pick an aesthetic from outside this section
  useEffect(() => {
    const onPick = (e: Event) => {
      const i = singles.findIndex((s) => s.slug === (e as CustomEvent<string>).detail);
      if (i >= 0) setSel(i);
    };
    window.addEventListener(AESTHETIC_EVENT, onPick);
    return () => window.removeEventListener(AESTHETIC_EVENT, onPick);
  }, []);

  return (
    <section id="packs" className="section">
      <div className="packs">
        <div className="packs-grid">
          {/* the card takes on a faint tint of the picked aesthetic's colour (--tint) */}
          <div className={'pack solo' + (hint && !touched ? ' hinting' : '')} ref={card} style={{ '--tint': p.tint } as React.CSSProperties}>
            <div className="solo-visual">
              <div
                className="fan-box"
                onPointerDown={(e) => { swipeX.current = e.clientX; }}
                onPointerUp={(e) => {
                  const dx = swipeX.current == null ? 0 : e.clientX - swipeX.current;
                  swipeX.current = null;
                  if (Math.abs(dx) > 40) pick(sel + (dx < 0 ? 1 : -1), 'swipe');
                }}
                onPointerCancel={() => { swipeX.current = null; }}
              >
                <Seal variant="pill" className="corner-badge" />
                <button type="button" className="fan-arrow prev" aria-label="Previous aesthetic" onClick={() => pick(sel - 1, 'arrow')}>‹</button>
                <span className="fan-slide" key={p.slug} style={{ '--from': `${dir * 40}px` } as React.CSSProperties}>
                  <Fan gi={sel} size="big" />
                </span>
                <button type="button" className="fan-arrow next" aria-label="Next aesthetic" onClick={() => pick(sel + 1, 'arrow')}>›</button>
                {!touched && <span className="swipe-hint" aria-hidden="true"><i />Swipe to explore {singles.length} aesthetics</span>}
              </div>
              {/* colourway-style picker under the visual: one named photo swatch per aesthetic */}
              <div className="aesthetics">
                <span className="aesthetics-label" id="aesthetic-label">Choose your aesthetic <b>{sel + 1}/{singles.length}</b></span>
                <div className="swatches" role="radiogroup" aria-labelledby="aesthetic-label">
                  {singles.map((s, i) => (
                    <button
                      key={s.slug}
                      type="button"
                      role="radio"
                      aria-checked={i === sel}
                      className={'swatch' + (i === sel ? ' on' : '')}
                      style={{ '--i': i } as React.CSSProperties}
                      onClick={() => pick(i, 'swatch')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/uploads/packs/${s.slug}-1.webp`} alt="" loading="lazy" decoding="async" />
                      <span className="nm">{s.name}</span>
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
            {/* one row of four fans at full size, scaled down only when the space is narrower (never wraps) */}
            <div className="fan-box" ref={bundleBox}>
              <span className="bundle-row" ref={bundleRow}><BundleFans size="xl" /></span>
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
              <div className="bundle-buy">
                <Link className="btn btn-green" href={`/checkout?pack=${bundle.slug}`} {...trackClick('pack_selected', { pack: bundle.slug, price: bundle.priceN, bundle: true, plan: 'once' })}>{bundle.cta}</Link>
                <Seal variant="inline" />
              </div>
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
