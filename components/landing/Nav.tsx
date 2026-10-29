import { trackClick } from '@/lib/analytics/events';
import type { ClientEvents } from '@/lib/analytics/events';
import { LogoMark } from '../Logo';
import { PACK_CTA } from '@/lib/prices';

export function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#top" className="logo" aria-label="FanpageKit home">
          <LogoMark />
          <span>FanpageKit</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#inside">What&apos;s inside</a>
          <a href="#packs">Packs</a>
          <a href="#faq">FAQ</a>
        </div>
        <a href="#packs" className="btn btn-sm" {...trackClick('cta_clicked', { location: 'nav', label: PACK_CTA })}>{PACK_CTA}</a>
      </div>
    </nav>
  );
}

type CtaLocation = ClientEvents['cta_clicked']['location'];

export function CtaRow({ label, note, location }: { label: string; note: string; location: CtaLocation }) {
  return (
    <div className="cta-row">
      <a href="#packs" className="btn" {...trackClick('cta_clicked', { location, label })}>{label}</a>
      <span className="cta-note">{note}</span>
    </div>
  );
}
