// PLACEHOLDER COPY: replace with real customer quotes (with their permission) before launch.
// Invented testimonials presented as real are deceptive advertising under FTC rules.
const QUOTES = [
  { q: 'posted one a day for 3 weeks, no ads. went from 3k to 14k monthly listeners. finally real fans', name: 'Jade M.', who: 'Indie pop' },
  { q: 'one clip hit 400k views and people actually saved the song. easiest promo i’ve ever done', name: 'Luca R.', who: 'Bedroom producer' },
];

const Star = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.5l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" /></svg>
);

/** Two short artist quotes under the reel breakdown. */
export function Testimonials() {
  return (
    <div className="quotes">
      {QUOTES.map((t) => (
        <figure className="quote" key={t.name}>
          <div className="stars" role="img" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} />)}
          </div>
          <blockquote>{t.q}</blockquote>
          <figcaption>
            <span className="avatar" aria-hidden="true">{t.name[0]}</span>
            <span><b>{t.name}</b> · {t.who}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
