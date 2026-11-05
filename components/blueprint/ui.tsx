'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { LogoMark } from '../Logo';

/* Shared building blocks for the Fanpage Blueprint screens. Styles live in blueprint.css (scoped under .fpb). */

/** A 24×24 stroke icon from SVG inner markup (the config stores icons this way, copied from the mock-ups). */
export function Icon({ d, size = 22, stroke = 2, color = 'currentColor', style }: { d: string; size?: number; stroke?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', ...style }} dangerouslySetInnerHTML={{ __html: d }} />
  );
}

export const ICONS = {
  back: '<path d="m15 18-6-6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/><path d="M4 18h16"/>',
  wave: '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  shieldPlain: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
  person: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  star: '<path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7-6.2-3.4-6.2 3.4 1.3-7L2 9.4l7-.9z"/>',
  dots: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
};

/** FanpageKit logo: the site's corner mark plus the wordmark (same as the main site's nav). */
export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={small ? 'fpb-logo sm' : 'fpb-logo'} aria-label="FanpageKit">
      <LogoMark />
      <span className="word" aria-hidden="true">FanpageKit</span>
    </span>
  );
}

/**
 * Image slot. Renders the asset as a background so a missing file (assets come last) falls back to a neutral
 * gradient at the exact same size: the layout never shifts when the real images are dropped in.
 */
export function Img({ src, className = '', style, label, children }: { src?: string | null; className?: string; style?: CSSProperties; label?: string; children?: ReactNode }) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`fpb-img ph ${className}`}
      style={{ display: 'block', ...style, backgroundImage: src ? `url("${src}"), linear-gradient(135deg, #2E2E32, #18181A)` : undefined }}
    >
      {children}
    </span>
  );
}

export function Check({ on, square }: { on: boolean; square?: boolean }) {
  return (
    <span className={`${square ? 'fpb-box' : 'fpb-check'}${on ? ' on' : ''}`} aria-hidden="true">
      {on && <Icon d={ICONS.check} size={13} stroke={3} />}
    </span>
  );
}

/** Header for quiz screens: back, logo, "n/9", progress bar. */
export function QHeader({ onBack, step, progress }: { onBack?: () => void; step?: number; progress: number }) {
  return (
    <header className="fpb-qhead">
      <div className="fpb-qhead-row">
        {onBack ? (
          <button type="button" className="fpb-back" aria-label="Back" onClick={onBack}><Icon d={ICONS.back} /></button>
        ) : <span style={{ width: 44 }} />}
        <Logo small />
        <span className="fpb-count">{step ? `${step}/9` : ''}</span>
      </div>
      <div className="fpb-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

export function Footer({ children, ruled }: { children: ReactNode; ruled?: boolean }) {
  return <footer className={ruled ? 'fpb-footer ruled' : 'fpb-footer'}>{children}</footer>;
}

type OptProps = { label: string; sub?: string; icon?: string; selected: boolean; onClick: () => void; multi?: boolean; compact?: boolean; smallIcon?: boolean };

/** Option card. Single select: radio semantics + check circle. Multi select: checkbox semantics + square box. */
export function OptionCard({ label, sub, icon, selected, onClick, multi, compact, smallIcon }: OptProps) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={`fpb-opt${compact ? ' compact' : ''}${smallIcon ? ' small-ico' : ''}`}
    >
      {icon && <span className="ico"><Icon d={icon} size={compact || smallIcon ? 20 : 22} /></span>}
      <span className="txt"><span className="t">{label}</span>{sub && <span className="s">{sub}</span>}</span>
      <Check on={selected} square={multi} />
    </button>
  );
}

export function Chip({ label, icon, selected, disabled, onClick }: { label: string; icon?: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="fpb-chip" aria-pressed={selected} disabled={disabled && !selected} onClick={onClick}>
      {icon && <Icon d={icon} size={16} />}{label}
    </button>
  );
}

/** Green tick list item icon. */
export const Tick = ({ color = '#22D46B' }: { color?: string }) => <Icon d={ICONS.check} size={16} stroke={3} color={color} />;

/** Bottom sheet: dims the page, traps scroll, Escape closes. */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return (
    <>
      <div className="fpb-sheet-back" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={label} className="fpb-sheet">
        <span className="fpb-grabber" />
        {children}
      </section>
    </>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <div role="img" aria-label={`${n} out of 5 stars`} style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FFB547" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS.star }} />
      ))}
    </div>
  );
}
