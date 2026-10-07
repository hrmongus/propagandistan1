import Link from 'next/link';
import { trackClick } from '@/lib/analytics/events';
import { CtaRow } from './Nav';

const PROMISES = ['Full refund. No forms, no back-and-forth.', 'Keep the videos and the guides either way.', 'One email is all it takes.'];

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

export function Guarantee() {
  return (
    <section id="guarantee" className="section">
      <div className="guarantee">
        <div className="copy">
          <span className="kicker">30-day money back</span>
          <h2 className="h2">Post for 30 days. If nothing moves, you get every cent back.</h2>
          <p className="lead">
            Post 20 of the 30 videos on TikTok within 30 days. If none of them reaches 1,000 views, email us and we&apos;ll
            refund you in full — and you keep the pack. The risk is ours, not yours.
          </p>
          <Link className="rules-link" href="/guarantee">See the guarantee rules <span aria-hidden="true">→</span></Link>
        </div>
        <ul className="promises">
          {PROMISES.map((p) => (
            <li key={p}><span className="tick"><Check /></span>{p}</li>
          ))}
        </ul>
      </div>
      <CtaRow location="guarantee" label="Get the pack — $37" note="Covered by the 30-day guarantee" />
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
