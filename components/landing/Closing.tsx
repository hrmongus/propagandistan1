import { CtaRow } from './Nav';

export function Guarantee() {
  return (
    <section id="guarantee" className="section">
      <div className="guarantee">
        <span className="shield">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" stroke="#F5F5F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3l9 3.5v7c0 5.5-3.8 9.6-9 11.5-5.2-1.9-9-6-9-11.5v-7L14 3z" />
            <path d="M9.5 14l3 3 6-6" />
          </svg>
        </span>
        <div className="copy">
          <h2 className="h2">30-day money back guarantee</h2>
          <p className="lead">
            Post 20 of the 30 clips within 30 days. If none of them passes 1,000 views, send us a link to your account and
            we refund the $37 — and you keep the pack.
          </p>
          <p className="fine">
            We&apos;re not guaranteeing streams or followers; nobody honestly can. We&apos;re guaranteeing the content
            performs when it&apos;s actually posted.
          </p>
        </div>
      </div>
      <CtaRow label="Get the pack — $37" note="Covered by the 30-day guarantee" />
    </section>
  );
}

export function Final() {
  return (
    <section className="section final">
      <div className="final-inner">
        <h2 className="h2">Your next release deserves more than one post and a story.</h2>
        <p>30 videos, ready tonight. You still never have to show your face.</p>
        <a href="#packs" className="btn btn-lg">Get the pack — $37</a>
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
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Returns</a>
          <a href="mailto:hello@fanpagekit.com">hello@fanpagekit.com</a>
        </div>
      </div>
    </footer>
  );
}
