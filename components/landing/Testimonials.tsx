'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics/client';

// PLACEHOLDER COPY: every screenshot must belong to a real customer who agreed to be shown, and every quote, name and
// genre must be theirs. Replace these before launch: invented testimonials presented as real — especially next to
// real-looking results — are deceptive advertising under FTC rules. Quotes carry no numbers so they can't contradict
// the charts.
const REVIEWS = [
  { img: 1, q: 'posted every single day since march. the chart speaks for itself', name: 'Jade M.', who: 'Indie pop' },
  { img: 2, q: 'stopped paying for playlist pitching. this did more in a month', name: 'Luca R.', who: 'Bedroom producer' },
  { img: 3, q: 'didn’t think faceless clips would work for my stuff. they do', name: 'Nia K.', who: 'Alt-R&B' },
  { img: 4, q: 'one clip popped and the whole catalogue moved with it', name: 'Marco D.', who: 'Rap' },
  { img: 5, q: 'slow start, then it just kept climbing. finally real fans', name: 'Ella S.', who: 'Singer-songwriter' },
  { img: 6, q: 'saves went up more than streams. people actually keep the song', name: 'Theo W.', who: 'Alt-pop' },
  { img: 7, q: 'easiest promo i’ve done. 5 minutes a day, no ads', name: 'Ana P.', who: 'Folk' },
  { img: 8, q: 'my best months ever and i never showed my face once', name: 'Kai L.', who: 'Hyperpop' },
  { img: 9, q: 'the consistency is the trick. the videos make it easy', name: 'Rosa V.', who: 'Dance' },
  { img: 10, q: 'went in sceptical. now it’s the only promo i run', name: 'Sam O.', who: 'Surf rock' },
];

const Star = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.5l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" /></svg>
);

/**
 * Artist results under the reel breakdown: a swipeable row of review cards, each a Spotify-for-Artists screenshot with
 * a short quote. Three across on desktop with arrows; one (and a peek of the next) on phones.
 */
export function Testimonials() {
  const row = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [end, setEnd] = useState(false);

  /** Index of the card nearest the row's left edge, read from the scroll position itself. */
  const current = () => {
    const el = row.current!;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return 0;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
    return Math.min(REVIEWS.length - 1, Math.round(el.scrollLeft / step));
  };

  // the dots and the arrows' end state follow the scroll, however it happens (swipe, trackpad, arrows)
  useEffect(() => {
    const el = row.current!;
    const onScroll = () => {
      setAt(current());
      setEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const go = (i: number, method: 'arrow' | 'dot') => {
    const el = row.current!;
    const to = Math.max(0, Math.min(REVIEWS.length - 1, i));
    const card = el.children[to] as HTMLElement;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    track('reviews_navigated', { method, index: to });
  };

  return (
    <section className="reviews" aria-label="Artist results">
      <div className="reviews-head">
        <div className="reviews-title">
          <span className="stars" role="img" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} />)}</span>
          <h3 className="h3">Real results from artists posting daily</h3>
        </div>
        <div className="reviews-nav">
          <button type="button" aria-label="Previous reviews" onClick={() => go(current() - 1, 'arrow')} disabled={at === 0}>‹</button>
          <button type="button" aria-label="Next reviews" onClick={() => go(current() + 1, 'arrow')} disabled={end}>›</button>
        </div>
      </div>
      <div className="reviews-row" ref={row}>
        {REVIEWS.map((r) => (
          <figure className="review" key={r.img}>
            <img src={`/uploads/results/result-${String(r.img).padStart(2, '0')}.webp`} alt={`Spotify for Artists growth chart shared by ${r.name}`} width={720} height={720} loading="lazy" decoding="async" />
            <blockquote>{r.q}</blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">{r.name[0]}</span>
              <span><b>{r.name}</b> · {r.who}</span>
              <span className="mini-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Star key={i} />)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="reviews-dots">
        {REVIEWS.map((r, i) => (
          <button key={r.img} type="button" aria-label={`Review ${i + 1}`} aria-current={i === at} className={i === at ? 'on' : undefined} onClick={() => go(i, 'dot')} />
        ))}
      </div>
    </section>
  );
}
