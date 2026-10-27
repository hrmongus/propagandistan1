'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { track } from '@/lib/analytics/client';
import { PRICES } from '@/lib/checkout';
import { AESTHETIC_EVENT, PACKS, TOOLS } from '@/lib/data';
import { Collapse, PlusMinus } from '../Collapse';
import { Seal } from './Seal';

const singles = PACKS.filter((p) => !p.bundle);
const SUB_OFF = Math.round(((PRICES.pack - PRICES.packMonthly) / PRICES.pack) * 100);

type Action = { label: string; href: string; primary?: boolean; aesthetic?: string };
type Item = { q: string; lead: string; body: React.ReactNode; visual?: React.ReactNode; actions: Action[] };

const BUY: Action = { label: `Get the pack — $${PRICES.pack}`, href: '#packs', primary: true };

/** "45 of 200 left" → the share already gone, for the stock bars. */
const soldShare = (stock: string) => {
  const [left, total] = stock.match(/\d+/g)!.map(Number);
  return 1 - left / total;
};

/**
 * Every answer sells: a one-line verdict, a short why, something to look at (a real screenshot, the tools, live stock)
 * and a next step — a jump to the section that proves it, or straight to the packs.
 */
const ITEMS: Item[] = [
  {
    q: 'Do I have to be on camera?',
    lead: 'Never. No face, no voice, no filming.',
    body: 'Every clip is faceless, music-first footage. You add your song and post — that’s the whole job.',
    visual: (
      <div className="fv-reels">
        {[1, 2, 3].map((n) => <img key={n} src={`/uploads/hero-${n}.webp`} alt="" loading="lazy" decoding="async" />)}
        <span className="fv-tag">0 faces · 0 filming</span>
      </div>
    ),
    actions: [{ label: 'See the format', href: '#top' }, BUY],
  },
  {
    q: 'What if it doesn’t work for me?',
    lead: 'Then you don’t pay. And you keep the pack.',
    body: 'Post 20 of the 30 videos within 30 days. If none reaches 1,000 views, one email gets you a full refund.',
    visual: (
      <div className="fv-seal">
        <Seal uid="faq" className="seal faq-seal" />
      </div>
    ),
    actions: [{ label: 'Read the guarantee', href: '#guarantee' }, BUY],
  },
  {
    q: 'How does my song get into the video?',
    lead: 'You pick it from the in-app audio library.',
    body: 'The videos ship silent, so the platform’s own audio is the sound — and every view links straight to your song’s page. That’s why this turns views into streams.',
    visual: (
      <ol className="fv-steps">
        <li><b>1</b>Upload a clip</li>
        <li><b>2</b>Tap “Add audio”</li>
        <li><b>3</b>Pick your song</li>
      </ol>
    ),
    actions: [{ label: 'See how one reel is built', href: '#anatomy' }],
  },
  {
    q: 'Is this an ad product? Do I need a budget?',
    lead: '$0 ad spend. Ever.',
    body: 'The platforms push every clip to people who don’t follow you yet. On one of our reels, 99.5% of viewers were non-followers.',
    visual: <img className="fv-shot" src="/uploads/insights-audience.webp" alt="Reel insights: 99.5% of viewers were non-followers" loading="lazy" decoding="async" />,
    actions: [{ label: 'Why it works at zero followers', href: '#why' }],
  },
  {
    q: 'Do I need editing skills?',
    lead: 'No. The hard part is done for you.',
    body: '30 videos, hand-picked, colour graded and stitched. Plus a step-by-step guide for whichever editor you already use.',
    visual: (
      <div className="fv-tools">
        {TOOLS.map((t) => <img key={t.name} src={t.logo} alt={t.name} title={t.name} loading="lazy" decoding="async" />)}
      </div>
    ),
    actions: [{ label: 'See everything inside', href: '#inside' }, BUY],
  },
  {
    q: 'How much time per day?',
    lead: 'About 4 minutes. Not 47.',
    body: 'Lyric overlay, your song, post. That’s 22 hours a month back for writing and recording.',
    visual: (
      <div className="fv-bars">
        <div><span style={{ width: '100%' }} className="slow" /><em>47 min by hand</em></div>
        <div><span style={{ width: '9%' }} className="fast" /><em>4 min with FanpageKit</em></div>
      </div>
    ),
    actions: [{ label: 'See the time maths', href: '#how' }],
  },
  {
    q: 'Will other artists have the same videos?',
    lead: 'Barely — every pack is capped at 200 copies.',
    body: 'When a run sells out, the pack is retired for good. Your footage never ends up on a thousand accounts, and the platforms never treat it as recycled.',
    visual: (
      <ul className="fv-stock">
        {singles.map((p) => (
          <li key={p.slug}>
            <span className="n">{p.name}</span>
            <span className="bar"><i style={{ width: `${Math.round(soldShare(p.stock) * 100)}%` }} /></span>
            <span className="left">{p.stock}</span>
          </li>
        ))}
      </ul>
    ),
    actions: [{ label: 'Grab yours before it’s retired', href: '#packs', primary: true }],
  },
  {
    q: 'What happens after the 30 days?',
    lead: `Keep going for $${PRICES.packMonthly} a month — ${SUB_OFF}% off.`,
    body: 'A fresh 30-video pack lands every month, so your posting never stops. Cancel any time in one click. Or just buy the next pack when you’re ready.',
    actions: [{ label: `Subscribe & save ${SUB_OFF}%`, href: '#subscribe', primary: true }],
  },
  {
    q: 'Which genres does this work for?',
    lead: 'Pick your sound — we’ll show you its pack.',
    body: 'If nothing here matches what you make, don’t buy yet: email us and we’ll tell you when a fitting pack lands.',
    visual: (
      <div className="fv-genres">
        {singles.map((p) => <span key={p.slug}><b>{p.name}</b>{p.genres}</span>)}
      </div>
    ),
    actions: singles.map((p) => ({ label: p.name, href: '#packs', aesthetic: p.slug })),
  },
  {
    q: 'What if my song isn’t out yet?',
    lead: 'Get the pack now, post the day it drops.',
    body: 'Distribute first (DistroKid, TuneCore, anyone) so the song is in the audio library. The footage never expires, so day one of your release is day one of posting.',
    actions: [BUY],
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section">
      <div className="faq">
        <div className="faq-head">
          <h2 className="h2">Questions people ask before buying.</h2>
          <p>Straight answers — and where to see the proof.</p>
        </div>
        <div className="faq-list">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            return (
              <div className={isOpen ? 'faq-item open' : 'faq-item'} key={it.q}>
                <button className="faq-btn" type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => { setOpen(isOpen ? -1 : i); track('faq_toggled', { question: it.q, open: !isOpen }); }}>
                  <span className="faq-q">{it.q}</span>
                  <PlusMinus />
                </button>
                <Collapse open={isOpen} id={`faq-${i}`}>
                  <div className={'faq-a' + (it.visual ? ' has-visual' : '')}>
                    <div className="faq-copy">
                      <p className="faq-lead">{it.lead}</p>
                      <p>{it.body}</p>
                      <div className="faq-actions">
                        {it.actions.map((a) => (
                          <a
                            key={a.label}
                            href={a.href}
                            className={a.primary ? 'btn btn-green faq-cta' : a.aesthetic ? 'faq-chip' : 'faq-link'}
                            onClick={() => {
                              if (a.aesthetic) window.dispatchEvent(new CustomEvent(AESTHETIC_EVENT, { detail: a.aesthetic }));
                              track('faq_action_clicked', { question: it.q, label: a.label, target: a.aesthetic ? `${a.href}:${a.aesthetic}` : a.href });
                            }}
                          >
                            {a.label}{!a.primary && !a.aesthetic && <span aria-hidden="true"> →</span>}
                          </a>
                        ))}
                      </div>
                    </div>
                    {it.visual && <div className="faq-visual">{it.visual}</div>}
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
