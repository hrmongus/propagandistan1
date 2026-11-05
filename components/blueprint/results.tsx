'use client';

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { createCheckoutSession } from '@/app/checkout/actions';
import { Fan } from '@/components/Fan';
import { distinctId, track as phTrack } from '@/lib/analytics/client';
import {
  GENDERS, GOALS, OFFER_BULLETS, PACK_INCLUDES, PACKS, RESULTS_FAQ, aestheticById, momentById, packById, type PackId, type QuizAnswers,
} from '@/lib/analyzer/config';
import type { Metrics } from '@/lib/analyzer/metrics';
import type { SpotifyTrack } from '@/lib/analyzer/spotify';
import { setStrategyId, track } from '@/lib/analyzer/track';
import { PACK_SLUGS, PACKS as SITE_PACKS } from '@/lib/data';
import { BUNDLE_SAVE, FOUR_SINGLES, PRICES } from '@/lib/prices';
import { GrowthChart, Radar } from './charts';
import { ProofCards } from './screens';
import { Footer, ICONS, Icon, Img, Logo, Sheet, Tick } from './ui';
import { hash } from '@/lib/analyzer/metrics';

/* Screen 17 (results) plus the two checkout sheets (18, 18b), served at /s/{id}. */

export type StrategyRow = {
  id: string;
  created_at?: string;
  first_name: string | null;
  track: SpotifyTrack;
  answers: QuizAnswers;
  metrics: Metrics;
  hooks: { pages: { aesthetic: string; hooks: string[] }[]; fallback: boolean };
  lyric_line: string | null;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const DEAL_PCT = Math.round(((PRICES.packWas - PRICES.pack) / PRICES.packWas) * 100);
const stockOf = (kit: PackId) => SITE_PACKS.find((p) => p.slug === packById(kit).checkoutSlug)?.stock ?? null;

function audienceLine(a: QuizAnswers, momentId?: string) {
  const gender = GENDERS.find((g) => g.id === a.gender)?.label.replace('Mostly ', '').toLowerCase();
  const moment = momentById(momentId ?? '')?.label.toLowerCase();
  return [a.age?.join(', '), gender, moment].filter(Boolean).join(' · ');
}

/** Reel mock: the kit's example clip (muted, looping), hook on top, optional lyric line, audio pill. */
function ReelMock({ kit, hook, lyric, title }: { kit: PackId; hook: string; lyric: string | null; title: string }) {
  const pack = packById(kit);
  return (
    <div className="fpb-reel" style={{ height: 235, borderRadius: 20 }}>
      <Img src={pack.cover} label={`Example post from the ${pack.name} kit`} style={{ position: 'absolute', inset: 0 }} />
      <video key={pack.id} src={pack.previewClipUrl} poster={pack.cover} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div className="scrim-t" /><div className="scrim-b" />
      <p style={{ position: 'absolute', top: 18, left: 10, right: 10, margin: 0, textAlign: 'center', font: '500 10.5px/1.3 var(--font-sans)', color: '#fff' }}>{hook}</p>
      {lyric && <p style={{ position: 'absolute', top: 118, left: 10, right: 10, margin: 0, textAlign: 'center', font: '500 11px/1.3 var(--font-sans)', color: '#fff' }}>{lyric}</p>}
      <div className="audio-pill" style={{ left: 8, right: 8, bottom: 8, height: 20, font: '500 9px/1 var(--font-sans)' }}>
        <Icon d={ICONS.wave} size={9} stroke={3} color="#22D46B" /><span className="fpb-ellipsis">{title}</span>
      </div>
    </div>
  );
}

const Bar = ({ label, value, signal }: { label: string; value: number; signal?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ display: 'flex', justifyContent: 'space-between', font: '500 11px/1 var(--font-mono)', letterSpacing: '.06em', color: 'var(--text-secondary)' }}>
      <span>{label}</span><span style={{ color: signal ? 'var(--signal-400)' : 'var(--text-primary)' }}>{value}/100</span>
    </span>
    <span style={{ height: 6, borderRadius: 999, background: 'var(--ink-300)', overflow: 'hidden' }}>
      <span style={{ display: 'block', width: `${value}%`, height: '100%', background: signal ? 'var(--signal-500)' : 'var(--ink-900)' }} />
    </span>
  </div>
);

const PriceBlock = ({ big }: { big?: boolean }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <span style={{ font: `600 ${big ? 44 : 30}px/1 var(--font-sans)`, letterSpacing: '-0.03em' }}>${PRICES.pack}</span>
    <span style={{ fontSize: big ? 17 : 14, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>${PRICES.packWas}</span>
    <span className="fpb-deal">−{DEAL_PCT}% · launch price</span>
  </span>
);

const Guarantee = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-default)' }}>
    <Icon d={ICONS.shield} size={20} color="#F5F5F7" />
    <span style={{ fontSize: 13, lineHeight: 1.35, color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>30-day money-back guarantee.</span> If it doesn&apos;t work for you, you get your money back.</span>
  </div>
);

/** Index into the main site's pack fans (components/Fan.tsx), same stacks as the shop and the upsell. */
const fanIndex = (k: PackId) => PACK_SLUGS.indexOf(packById(k).checkoutSlug);

const WINDOW_MS = 10 * 60 * 1000;

/**
 * 10-minute countdown from when the Blueprint was created (the saved row's created_at, else the first time this
 * browser saw it), so a reload doesn't restart it. HANDOFF.md §8: the offer should really end when it hits zero.
 */
function ExpiryBar({ id, createdAt }: { id: string; createdAt?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    let start = createdAt ? Date.parse(createdAt) : NaN;
    if (Number.isNaN(start)) {
      const key = `fpb_seen_${id}`;
      try { start = Number(localStorage.getItem(key)) || Date.now(); localStorage.setItem(key, String(start)); } catch { start = Date.now(); }
    }
    const tick = () => setLeft(Math.max(0, start + WINDOW_MS - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [id, createdAt]);
  if (left === null) return <div style={{ height: 38 }} />;
  const mm = String(Math.floor(left / 60000)).padStart(2, '0'), ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  return (
    <div role="timer" aria-live="off" style={{ position: 'sticky', top: 0, zIndex: 30, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--ember-500)', color: '#fff', font: '600 13.5px/1 var(--font-sans)' }}>
      {left > 0 ? <>Your analysis expires in <span style={{ font: '700 14px/1 var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span></> : 'Your analysis has expired'}
    </div>
  );
}

export function Results({ row }: { row: StrategyRow }) {
  const { track: t, answers: a, metrics: m } = row;
  const goal = GOALS.find((g) => g.id === a.goal);
  const pages = m.pages.map((p, i) => ({ ...p, info: aestheticById(p.aesthetic)!, hook: row.hooks.pages.find((h) => h.aesthetic === p.aesthetic)?.hooks[0] ?? momentById(a.moments?.[i % (a.moments.length || 1)] ?? 'night-drive')?.defaultHook ?? '', moment: a.moments?.[i % (a.moments?.length || 1)] }));
  const [kit, setKit] = useState<PackId>(m.offerPack);
  const [sheet, setSheet] = useState<null | 'offer' | 'pay'>(null);
  const [faq, setFaq] = useState(0);
  const seed = useMemo(() => hash(row.id), [row.id]);

  useEffect(() => {
    setStrategyId(row.id);
    track('results_viewed', 'results', row.id);
  }, [row.id]);

  const openOffer = (source: string, k?: PackId) => {
    if (k) setKit(k);
    track('offer_clicked', source, row.id);
    setSheet('offer');
  };
  const pickKit = (k: PackId) => { setKit(k); phTrack('kit_selected', { pack: packById(k).checkoutSlug, source: 'offer' }); };
  const kitPage = pages.find((p) => p.kit === kit) ?? pages[0];
  const stock = stockOf(kit);

  return (
    <div className="fpb-screen">
      <ExpiryBar id={row.id} createdAt={row.created_at} />
      <header className="fpb-top"><Logo /><span className="fpb-meta">SENT TO YOUR EMAIL</span></header>
      <main className="fpb-main" style={{ gap: 36, paddingBottom: 32 }}>
        {/* hero */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
            <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${t.title} on Spotify`}><Img src={t.artworkUrl} style={{ width: 48, height: 48, borderRadius: 4 }} /></a>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>TRACK ANALYZED</span>
              <span className="fpb-ellipsis" style={{ font: '600 15px/1.2 var(--font-sans)' }}>{t.title}</span>
              <span className="fpb-ellipsis" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.artists.join(', ')} · <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Open Spotify</a></span>
            </span>
            <span className="fpb-badge signal"><span className="dot" />Analyzed</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ font: '500 13px/1 var(--font-mono)', letterSpacing: '.14em', color: 'var(--signal-400)' }}>FANPAGE BLUEPRINT</span>
            <h1 style={{ margin: 0, font: '600 36px/1.02 var(--font-sans)', letterSpacing: '-0.045em' }}>Your path to {goal ? goal.short : 'more'} listeners</h1>
          </div>
          <p className="fpb-lede">{row.first_name ? `${row.first_name}, your` : 'Your'} track is built for short-form. <b>The only thing missing is distribution.</b></p>
        </section>

        {/* scores */}
        <section aria-label="Your scores" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div className="fpb-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>FANPAGE FIT</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', height: 132 }}>
                <div style={{ width: 28, borderRadius: 10, background: 'var(--ink-300)', position: 'relative', overflow: 'hidden', flex: 'none' }}><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${m.fanpageFit.score}%`, borderRadius: 10, background: 'var(--signal-500)' }} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
                  <span style={{ font: '600 44px/1 var(--font-mono)', letterSpacing: '-0.04em' }}>{m.fanpageFit.score}%</span>
                  <span style={{ font: '500 12px/1.2 var(--font-sans)', color: 'var(--signal-400)' }}>{m.fanpageFit.label}</span>
                </div>
              </div>
            </div>
            <div className="fpb-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>UNTAPPED AUDIENCE</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ font: '600 32px/1 var(--font-mono)', letterSpacing: '-0.03em' }}>{m.untappedAudiencePct}%</span>
                <div role="img" aria-label={`${m.untappedAudiencePct} of 100 dots filled`} style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 8px))', gap: 4 }}>
                  {Array.from({ length: 100 }, (_, i) => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < 100 - m.untappedAudiencePct ? 'var(--signal-500)' : 'var(--ink-400)' }} />)}
                </div>
              </div>
              <span style={{ fontSize: 12, lineHeight: 1.3, color: 'var(--text-secondary)' }}>of listeners who&apos;d like this song haven&apos;t heard it yet</span>
            </div>
          </div>
          <div className="fpb-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>SHORT-FORM PROFILE</span>
            <Radar values={m.radar} />
            <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--text-secondary)' }}>How your track scores on what makes fan page posts work.</span>
          </div>
        </section>

        {/* trajectory */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="fpb-h3">Your growth trajectory.</h2>
          <div style={{ padding: '16px 12px 12px', borderRadius: 24, background: '#fff', border: '1px solid #e6e6e6', color: '#121212' }}>
            <GrowthChart goalValue={goal?.value ?? 100_000} seed={seed} />
          </div>
          <p className="fpb-lede sm">Every extra page puts your song in front of a new audience at the same time. <b>One page grows you. Three get you to your goal.</b></p>
          <span style={{ fontSize: 12, lineHeight: 1.3, color: 'var(--text-tertiary)' }}>Illustrative projection. Results depend on posting consistency.</span>
        </section>

        {/* top 3 pages */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="fpb-titles" style={{ gap: 8 }}>
            <h2 className="fpb-h3">Your top 3 fan pages.</h2>
            <p className="fpb-lede sm">Each reaches a different audience with your song. Start with the best one, add more to grow faster.</p>
          </div>
          {pages.map((p, i) => (
            <article key={p.aesthetic} style={{ display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', gap: 14, padding: 12, borderRadius: 28, background: 'var(--surface-card)', border: i === 0 ? '1.5px solid var(--ink-900)' : '1px solid var(--border-subtle)' }}>
              <ReelMock kit={p.kit} hook={p.hook} lyric={row.lyric_line} title={t.title} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, padding: '4px 4px 4px 0' }}>
                {i === 0 ? <span className="fpb-badge signal">#1 Best option</span> : <span style={{ font: '500 11px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>#{i + 1} FAN PAGE</span>}
                <span style={{ font: '600 15px/1.2 var(--font-sans)', wordBreak: 'break-all' }}>@{p.info.handle}</span>
                <span style={{ fontSize: 13, lineHeight: 1.3 }}>{p.info.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '4px 10px 4px 4px', borderRadius: 999, background: 'var(--ink-200)', font: '500 11px/1 var(--font-sans)' }}>
                  <Img src={packById(p.kit).cover} style={{ width: 18, height: 18, borderRadius: '50%' }} />FanpageKit: {packById(p.kit).name}
                </span>
                <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{audienceLine(a, p.moment)}</span>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
                <Bar label="FANPAGE FIT SCORE" value={p.fit} signal />
                <Bar label="AUDIENCE TARGET" value={p.audience} />
                <button type="button" className="fpb-btn primary md" onClick={() => openOffer(`page-${i + 1}`, p.kit)}>Launch this page</button>
              </div>
            </article>
          ))}
        </section>

        {/* offer */}
        <section id="offer" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '22px 18px 18px', borderRadius: 28, background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}>
          <div className="fpb-titles" style={{ gap: 8 }}>
            <span className="fpb-overline">YOUR STARTER FAN PAGE</span>
            <h2 className="fpb-h3">Start your faceless fan page now.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>EXAMPLE CONTENT</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
              {PACKS.map((pk) => (
                <figure key={pk.id} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ position: 'relative', aspectRatio: '9 / 16', borderRadius: 10, overflow: 'hidden', outline: pk.id === kit ? '2px solid var(--signal-500)' : 'none', outlineOffset: 1 }}>
                    <Img src={pk.cover} style={{ position: 'absolute', inset: 0 }} />
                    <video src={pk.previewClipUrl} poster={pk.cover} autoPlay muted loop playsInline preload="metadata" aria-label={`Example clip from the ${pk.name} kit`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                  <figcaption className="fpb-ellipsis" style={{ fontSize: 10.5, textAlign: 'center', color: pk.id === kit ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{pk.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div role="radiogroup" aria-label="Choose your fan page kit" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>CHOOSE YOUR KIT</span>
            {pages.map((p, i) => {
              const on = kit === p.kit;
              return (
                <button key={p.kit} type="button" role="radio" aria-checked={on} onClick={() => pickKit(p.kit)} className="fpb-result" style={{ padding: '8px 14px 8px 8px' }}>
                  <span style={{ flex: 'none' }}><Fan gi={fanIndex(p.kit)} size="tiny" /></span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ font: '600 15px/1.2 var(--font-sans)' }}>{packById(p.kit).name}</span>{i === 0 && <span className="fpb-badge signal">#1 Best fit</span>}</span>
                    <span className="fpb-ellipsis" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{p.info.handle} · {p.info.name}</span>
                  </span>
                  <span className={on ? 'fpb-check on' : 'fpb-check'} aria-hidden="true">{on && <Icon d={ICONS.check} size={13} stroke={3} />}</span>
                </button>
              );
            })}
            {stock && <span className="fpb-badge scarce"><span className="dot" />{stock.replace(' left', ` ${packById(kit).name} kits left`)}</span>}
          </div>
          <ul className="fpb-ticks">
            {OFFER_BULLETS.map((b) => <li key={b.text}><Tick /><span>{b.lead && <b>{b.lead} </b>}{b.text}{b.badge && <span className="fpb-badge outline" style={{ marginLeft: 8, height: 20 }}>{b.badge}</span>}</span></li>)}
          </ul>
          <PriceBlock big />
          <Guarantee />
          <button type="button" className="fpb-btn primary" onClick={() => openOffer('offer')}>Get the pack — ${PRICES.pack}</button>
          <p className="fpb-fine">It&apos;s never been easier to start a faceless fan page.</p>
        </section>

        {/* proof */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 18, marginRight: -20 }}>
          <div className="fpb-titles" style={{ gap: 8, paddingRight: 20 }}>
            <h2 className="fpb-h3">Artists who started with fan pages.</h2>
            <p className="fpb-lede sm">Straight from Spotify for Artists. <b>Organic growth, no paid promo.</b></p>
          </div>
          <ProofCards />
        </section>

        {/* faq */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="fpb-h3">Questions.</h2>
          <div className="fpb-faq">
            {RESULTS_FAQ.map((f, i) => (
              <div className="fpb-faq-item" key={f.q}>
                <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}><span style={{ flex: 1 }}>{f.q}</span><Icon d={ICONS.chevron} size={16} stroke={2.2} /></button>
                {faq === i && <p>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer><button type="button" className="fpb-btn primary" onClick={() => openOffer('sticky')}>Get the pack — ${PRICES.pack}</button></Footer>

      {sheet === 'offer' && <OfferSheet row={row} kit={kit} handle={kitPage.info.handle} aesthetic={kitPage.info.name} onClose={() => setSheet(null)} onNext={() => setSheet('pay')} />}
      {sheet === 'pay' && <PaySheet kit={kit} onClose={() => setSheet(null)} onBack={() => setSheet('offer')} />}
    </div>
  );
}

/* ---------------------------------------------------------------- 18 offer sheet */

function SheetHead({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="fpb-meta">{label}</span>
      <button type="button" className="fpb-close" aria-label="Close" onClick={onClose}><Icon d={ICONS.close} size={16} stroke={2.2} /></button>
    </div>
  );
}

function OfferSheet({ row, kit, handle, aesthetic, onClose, onNext }: { row: StrategyRow; kit: PackId; handle: string; aesthetic: string; onClose: () => void; onNext: () => void }) {
  const pack = packById(kit);
  return (
    <Sheet label="Your offer, step 1 of 2" onClose={onClose}>
      <SheetHead label="STEP 1 OF 2 · YOUR OFFER" onClose={onClose} />
      <h2 className="fpb-h2" style={{ marginTop: -6 }}>Your starter fan page is ready.</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 10px', borderRadius: 18, background: 'var(--ink-200)' }}>
        <Img src={row.track.artworkUrl} style={{ width: 44, height: 44, borderRadius: 4, flex: 'none' }} />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="fpb-ellipsis" style={{ font: '600 15px/1.2 var(--font-sans)' }}>{row.track.title}</span>
          <span className="fpb-ellipsis" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.track.artists[0]} · Fanpage Fit Score {row.metrics.fanpageFit.score}</span>
        </span>
      </div>
      <article style={{ display: 'flex', flexDirection: 'column', borderRadius: 24, background: 'var(--surface-card)', border: '1.5px solid var(--ink-900)', overflow: 'hidden', flex: 'none' }}>
        <div style={{ display: 'flex', gap: 14, padding: 16 }}>
          <span role="img" aria-label={`${pack.name} pack preview`} style={{ flex: 'none' }}><Fan key={pack.id} gi={fanIndex(pack.id)} size="small" /></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ font: '600 18px/1.2 var(--font-sans)', letterSpacing: '-0.01em' }}>{pack.name} pack</span>
            <span style={{ fontSize: 13, lineHeight: 1.35, color: 'var(--text-secondary)' }}>Built for your @{handle} page · {aesthetic}</span>
            <PriceBlock />
          </div>
        </div>
        <ul className="fpb-ticks" style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--border-subtle)' }}>
          {PACK_INCLUDES.map((x) => (
            <li key={x.text} style={x.signal ? { color: 'var(--signal-300)', fontWeight: 500 } : undefined}>
              <Tick color={x.signal ? '#22D46B' : '#F5F5F7'} /><span>{x.lead && <b>{x.lead}</b>}{x.text}</span>
            </li>
          ))}
        </ul>
      </article>
      <Guarantee />
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" className="fpb-btn primary" onClick={onNext}>Start growing today</button>
        <span className="fpb-fine">Instant download after payment. No subscription.</span>
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- 18b payment sheet */

type Session = { key: string; clientSecret?: string; error?: string };

function PaySheet({ kit, onClose, onBack }: { kit: PackId; onClose: () => void; onBack: () => void }) {
  const pack = packById(kit);
  // Off by default: a pre-ticked paid add-on isn't allowed in the EU (Consumer Rights Directive art. 22).
  const [bundle, setBundle] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const key = `${pack.checkoutSlug}|${bundle ? 1 : 0}`;
  const total = bundle ? PRICES.bundle : PRICES.pack;
  const others = SITE_PACKS.filter((p) => !p.bundle && p.slug !== pack.checkoutSlug);

  useEffect(() => { phTrack('checkout_viewed', { pack: pack.checkoutSlug, plan: 'once', bundle_up: false }); }, [pack.checkoutSlug]);

  useEffect(() => {
    if (!stripePromise) return;
    let stale = false;
    const order = { pack: pack.checkoutSlug, bundleUp: bundle, plan: 'once' as const };
    createCheckoutSession(order, distinctId()).then(
      (res) => {
        if ('error' in res) phTrack('checkout_error', { pack: order.pack, plan: 'once', bundle_up: bundle, error: res.error });
        if (!stale) setSession({ key, ...res });
      },
      () => { if (!stale) setSession({ key, error: 'Could not start checkout. Please try again.' }); },
    );
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures pack + bundle
  }, [key]);

  const current = session?.key === key ? session : null;
  const error = !stripePromise ? 'Payments are not configured yet.' : current?.error;
  const toggle = () => { setBundle(!bundle); phTrack('checkout_bundle_toggled', { pack: pack.checkoutSlug, enabled: !bundle }); };

  return (
    <Sheet label="Checkout, step 2 of 2" onClose={onClose}>
      <SheetHead label="STEP 2 OF 2 · CHECKOUT" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -6 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, font: '600 28px/1.06 var(--font-sans)', letterSpacing: '-0.035em' }}><Icon d={ICONS.lock} size={22} stroke={2.2} />Complete your order.</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 12, lineHeight: 1.3, color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon d={ICONS.download} size={13} stroke={2.2} />Instant download</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon d={ICONS.shieldPlain} size={13} stroke={2.2} />30-day money-back</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon d={ICONS.headset} size={13} stroke={2.2} />Human support</span>
        </div>
      </div>

      <section aria-label="Order summary" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 22, background: 'var(--ink-200)', flex: 'none' }}>
        <span className="fpb-meta">ORDER SUMMARY</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}><span>{pack.name} pack <span style={{ fontSize: 11, color: 'var(--signal-400)' }}>· launch price</span></span><span style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}><s style={{ color: 'var(--text-tertiary)', marginRight: 6 }}>${PRICES.packWas}</s>${PRICES.pack}</span></div>
        {bundle && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}><span>Bundle upgrade: 3 more packs + strategy call</span><span style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>+${PRICES.bundle - PRICES.pack}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, color: 'var(--signal-400)' }}><span>You save vs. 4 packs separately</span><span style={{ fontFamily: 'var(--font-mono)' }}>${BUNDLE_SAVE}</span></div>
        </>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}><span style={{ font: '600 16px/1 var(--font-sans)' }}>Total</span><span style={{ font: '600 24px/1 var(--font-mono)', letterSpacing: '-0.02em' }}>${total}</span></div>
      </section>

      <section aria-label="Bundle upgrade" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 22, background: 'rgba(34,212,107,0.07)', border: '1.5px solid rgba(34,212,107,0.5)', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ font: '600 17px/1.2 var(--font-sans)' }}>Full Fanpage Bundle</span><span className="fpb-badge signal">Save ${BUNDLE_SAVE}</span></span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ font: '600 22px/1 var(--font-sans)', letterSpacing: '-0.03em' }}>${PRICES.bundle}</span><span style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>${FOUR_SINGLES}</span><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>total · +${PRICES.bundle - PRICES.pack} today</span></span>
          </div>
          <button type="button" role="switch" aria-checked={bundle} aria-label="Add the Full Fanpage Bundle" onClick={toggle} style={{ width: 52, height: 32, padding: 3, border: 'none', borderRadius: 999, background: bundle ? 'var(--signal-500)' : 'var(--ink-400)', display: 'flex', justifyContent: bundle ? 'flex-end' : 'flex-start', cursor: 'pointer', flex: 'none', transition: 'background 280ms' }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--text-secondary)' }}>Run all 3 recommended fan pages. That&apos;s the line on your chart that hits your goal.</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {others.map((p) => {
            const k = (['golden', 'midnight', 'coastal', 'forest'] as const).find((id) => packById(id).checkoutSlug === p.slug)!;
            return <span key={p.slug} role="img" aria-label={`${p.name} pack`}><Fan gi={fanIndex(k)} size="tiny" /></span>;
          })}
        </div>
        <ul className="fpb-ticks" style={{ gap: 8 }}>
          <li><Tick />3 more packs: run up to 4 fan pages</li>
          <li><Tick />1:1 onboarding call with a fan page strategist</li>
        </ul>
      </section>

      <section aria-label="Payment" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flex: 'none' }}>
        {error ? (
          <p role="alert" style={{ margin: 0, fontSize: 14, color: '#FF8A6E' }}>{error}</p>
        ) : (
          /* Stripe's own embedded form: card, Apple Pay and Google Pay, terms and the pay button. */
          <div aria-busy={!current?.clientSecret} style={{ minHeight: 360, borderRadius: 18, overflow: 'hidden', background: '#fff' }}>
            {current?.clientSecret && stripePromise ? (
              <EmbeddedCheckoutProvider key={current.clientSecret} stripe={stripePromise} options={{ clientSecret: current.clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : (
              <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14 }}>Loading secure checkout…</div>
            )}
          </div>
        )}
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}><Icon d={ICONS.lock} size={13} stroke={2.2} />Secure payment processed by Stripe</span>
        <button type="button" className="fpb-btn outline" onClick={onBack}>Back to offer</button>
      </section>
    </Sheet>
  );
}
