import Link from 'next/link';
import { trackClick } from '@/lib/analytics/events';
import { Seal } from './Seal';

const PROMISES = ['Full refund', 'Keep the pack', 'One email'];

/** Compact guarantee strip: the seal stuck over the card's edge, a headline, three one-word-ish promises. */
export function Guarantee() {
  return (
    <section id="guarantee" className="section guarantee-section">
      <div className="guarantee">
        <Seal uid="guarantee" className="seal guarantee-seal" />
        <div className="copy">
          <h2 className="h3">30-day money back guarantee</h2>
          <ul className="g-promises">
            {PROMISES.map((p) => <li key={p}><span aria-hidden="true">✓</span>{p}</li>)}
          </ul>
          <Link className="seal-terms" href="/guarantee">*Conditions apply</Link>
        </div>
      </div>
    </section>
  );
}

export function Final() {
  return (
    <section className="section final">
      <div className="final-inner">
        <h2 className="h2">Your next release deserves more than one post and a story.</h2>
        <p>30 colour graded videos, in your hands tonight. You still never have to show your face.</p>
        <a href="#packs" className="btn btn-lg" {...trackClick('cta_clicked', { location: 'final', label: 'Get the pack — $37' })}>Get the pack — $37</a>
        <span className="cta-note">Instant download · 30-day money back · Commercial licence</span>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>© {new Date().getFullYear()} FanpageKit. For musicians who would rather be in the studio.</span>
        <div className="footer-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund-policy">Refunds</Link>
          <a href="mailto:hello@fanpagekit.com">hello@fanpagekit.com</a>
        </div>
      </div>
    </footer>
  );
}
