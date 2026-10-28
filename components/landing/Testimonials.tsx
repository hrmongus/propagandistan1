'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics/client';

// PLACEHOLDER COPY: every screenshot must belong to a real customer who agreed to be shown, and every title, quote,
// name, genre and date must be theirs. Replace these before launch: invented testimonials presented as real — especially
// next to real-looking results — are deceptive advertising under FTC rules. Quotes carry no numbers so they can't
// contradict the charts. Country codes and dates are placeholders too. Set `verified: true` only for reviews from a confirmed purchase; it shows a "Verified buyer"
// label. The cards borrow a review-site look but never another platform's name or logo: these aren't hosted there.
type Review = { img: number; title: string; q: string; name: string; who: string; cc: string; date: string; verified?: boolean };
const REVIEWS: Review[] = [
  { img: 1, title: 'The chart speaks for itself', q: 'Posted every single day since March. Didn’t change anything else about my releases.', name: 'Jade M.', who: 'Indie pop', cc: 'US', date: 'Sep 24, 2026' },
  { img: 2, title: 'Better than playlist pitching', q: 'Stopped paying for pitching. This did more in a month than that did all year.', name: 'Luca R.', who: 'Bedroom producer', cc: 'GB', date: 'Sep 18, 2026' },
  { img: 3, title: 'Works for my sound too', q: 'Didn’t think faceless clips would work for slow R&B. They do.', name: 'Nia K.', who: 'Alt-R&B', cc: 'US', date: 'Aug 30, 2026' },
  { img: 4, title: 'The whole catalogue moved', q: 'One clip popped and people started playing my older songs too.', name: 'Marco D.', who: 'Rap', cc: 'CA', date: 'Sep 19, 2026' },
  { img: 5, title: 'Slow start, then it climbed', q: 'First few weeks felt quiet. Then it just kept going up. Finally real fans.', name: 'Ella S.', who: 'Singer-songwriter', cc: 'AU', date: 'Aug 12, 2026' },
  { img: 6, title: 'People actually save the song', q: 'Saves went up faster than streams, which is what I care about.', name: 'Theo W.', who: 'Alt-pop', cc: 'US', date: 'Sep 20, 2026' },
  { img: 7, title: 'Easiest promo I’ve done', q: 'Five minutes a day, no ads, no filming. I just post and get back to writing.', name: 'Ana P.', who: 'Folk', cc: 'IE', date: 'Aug 4, 2026' },
  { img: 8, title: 'Never showed my face once', q: 'My best months ever and nobody has seen my face. That was the whole point.', name: 'Kai L.', who: 'Hyperpop', cc: 'DE', date: 'Sep 2, 2026' },
  { img: 9, title: 'Consistency is the trick', q: 'The videos make posting daily easy enough that I actually stuck with it.', name: 'Rosa V.', who: 'Dance', cc: 'US', date: 'Sep 5, 2026' },
  { img: 10, title: 'Went in sceptical', q: 'Now it’s the only promotion I run. Renewed for another month.', name: 'Sam O.', who: 'Surf rock', cc: 'NZ', date: 'Aug 1, 2026' },
];

/** Initials avatars in a few muted colours, picked by name so each reviewer keeps theirs. */
const AVATARS = ['#E8DCCB', '#D6E4F0', '#E4D8EE', '#D9EBDD', '#F2DCD5', '#E9E4C9'];
const avatarBg = (name: string) => AVATARS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATARS.length];

/** Five filled square star tiles, the review-site way of drawing a rating. */
const Tiles = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <span className={'tiles ' + size} role="img" aria-label="Rated 5 out of 5">
    {[0, 1, 2, 3, 4].map((i) => (
      <span key={i}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z" /></svg></span>
    ))}
  </span>
);

/**
 * Artist reviews under the reel breakdown: a swipeable row of review-site style cards — reviewer, the star tiles and
 * date, a title, the review, and their Spotify-for-Artists screenshot as the attached photo. Three across on desktop with arrows; one (and a peek of the next) on phones.
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
    <section className="reviews" aria-label="Artist reviews">
      <div className="reviews-head">
        <div className="reviews-title">
          <span className="reviews-score"><Tiles size="sm" /><b>5.0</b></span>
          <h3 className="h3">Real results from artists posting daily</h3>
        </div>
        <div className="reviews-nav">
          <button type="button" aria-label="Previous reviews" onClick={() => go(current() - 1, 'arrow')} disabled={at === 0}>‹</button>
          <button type="button" aria-label="Next reviews" onClick={() => go(current() + 1, 'arrow')} disabled={end}>›</button>
        </div>
      </div>
      <div className="reviews-row" ref={row}>
        {REVIEWS.map((r) => (
          <article className="review" key={r.img}>
            <header className="rv-head">
              <span className="rv-avatar" style={{ background: avatarBg(r.name) }} aria-hidden="true">{r.name.split(' ').map((w) => w[0]).join('')}</span>
              <span className="rv-who"><b>{r.name}</b><span><span className="rv-cc">{r.cc}</span> · {r.who}</span></span>
            </header>
            <div className="rv-rate">
              <Tiles />
              {r.verified && <span className="rv-verified"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" /><path d="m5 8.2 2 2 4-4.2" /></svg>Verified</span>}
              <time className="rv-date">{r.date}</time>
            </div>
            <h4 className="rv-title">{r.title}</h4>
            <p className="rv-body">{r.q}</p>
            <div className="rv-shot">
              <img src={`/uploads/results/result-${String(r.img).padStart(2, '0')}.webp`} alt={`Spotify for Artists growth chart shared by ${r.name}`} width={760} height={730} loading="lazy" decoding="async" />
            </div>
          </article>
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
