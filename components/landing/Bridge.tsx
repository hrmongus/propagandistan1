/* eslint-disable @next/next/no-img-element */
import { InView } from '../InView';
import { Anatomy } from './Anatomy';
import { Testimonials } from './Testimonials';

/* ---------- one real screenshot per reason ---------- */

const REASONS = [
  {
    t: 'The videos are shown to people who don’t follow you.',
    b: 'Instagram and TikTok push every clip into the feeds of strangers. That’s the default, not a reward for having an audience. A first post and a ten-thousandth post start the same way.',
    shot: { src: '/uploads/insights-audience.webp', w: 589, h: 794, alt: 'Instagram Reel insights: 99.5% of viewers were non-followers; top countries United States 57%, Canada 18%, Brazil 7%' },
  },
  {
    t: 'You’re building a channel, not chasing a post.',
    b: 'Thirty clips over thirty days is a distribution channel you own. It doesn’t switch off when a budget runs out, and it’s still there for the next release, and the one after that.',
    shot: { src: '/uploads/listeners-growth.webp', w: 1000, h: 922, alt: 'Daily listeners growing steadily from March to September 2026, reaching 21,914' },
  },
];

export function Bridge() {
  return (
    <section id="why" className="section">
      <div className="bridge-head">
        <h2 className="h2">Why this works at <span className="hl">zero followers</span>.</h2>
        <InView className="reasons">
          {REASONS.map((r, i) => (
            <div className="reason" key={r.t} style={{ '--i': i } as React.CSSProperties}>
              <img className="shot" src={r.shot.src} width={r.shot.w} height={r.shot.h} alt={r.shot.alt} loading="lazy" decoding="async" />
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{r.t}</span>
              <p>{r.b}</p>
            </div>
          ))}
        </InView>
      </div>
      <Anatomy />
      <Testimonials />
    </section>
  );
}
