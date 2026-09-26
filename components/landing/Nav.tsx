import { LogoMark } from '../Logo';

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
        <a href="#packs" className="btn btn-sm">Get the pack — $37</a>
      </div>
    </nav>
  );
}

export function CtaRow({ label, note }: { label: string; note: string }) {
  return (
    <div className="cta-row">
      <a href="#packs" className="btn">{label}</a>
      <span className="cta-note">{note}</span>
    </div>
  );
}
