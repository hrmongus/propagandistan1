/* eslint-disable @next/next/no-img-element */
import { TOOLS } from '@/lib/data';
import { CtaRow } from './Nav';

const ICON = { width: 28, height: 28, viewBox: '0 0 28 28', fill: 'none', stroke: '#F5F5F7', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const CARDS = [
  {
    fmt: '30 × MP4', t: '30 finished videos',
    p: 'Vertical, colour graded, ready to post as-is. Silent, so your track becomes the audio.',
    icon: <svg {...ICON}><rect x="4" y="6" width="20" height="16" rx="3" /><path d="M4 11h20M4 17h20M9 6v16M19 6v16" /></svg>,
  },
  {
    fmt: '112 clips', t: 'Every raw clip',
    p: 'All the source footage behind the 30 edits. Recut it, re-time it, build your own versions. You are not locked to our edit.',
    icon: <svg {...ICON}><rect x="3" y="8" width="14" height="14" rx="2" /><rect x="8" y="5" width="14" height="14" rx="2" fill="#111113" /><path d="M13 11.5v6l5-3z" fill="#F5F5F7" stroke="none" /></svg>,
  },
  {
    fmt: '8 guides', t: 'The editing guides',
    p: 'Step-by-step walkthroughs for lyric overlays, cover-art overlays, text timing, transitions — written separately for each editor, not one generic tutorial.',
    icon: <svg {...ICON}><path d="M5 5h11l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M16 5v5h5" /><path d="M8 14h10M8 18h7" /></svg>,
  },
  {
    fmt: '24 pages', t: 'The posting playbook',
    p: 'How to run the 30 days: what to post when, how to write the hook line, how to attach audio so it credits your release, what to do when a clip performs.',
    icon: <svg {...ICON}><path d="M6 4h12a2 2 0 0 1 2 2v18l-4-3-4 3-4-3-4 3V6a2 2 0 0 1 2-2z" /><path d="M9 10h8M9 14h5" /></svg>,
  },
];

export function Inside() {
  const tools = [...TOOLS, ...TOOLS];
  return (
    <section id="inside" className="section">
      <div className="inside">
        <div className="inside-head">
          <h2 className="h2">What you actually download.</h2>
        </div>
        <div className="inside-grid">
          {CARDS.map((c) => (
            <div className="inside-card" key={c.t}>
              <div className="top"><span className="icon-box">{c.icon}</span><span className="fmt">{c.fmt}</span></div>
              <span className="t">{c.t}</span>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
        <div className="tools">
          <span className="note">Works with — a separate guide for each. Free tools are enough; CapCut and Canva cover everything.</span>
          <div className="marquee">
            <div className="marquee-track tools-track reverse" style={{ '--dur': '40s' } as React.CSSProperties}>
              {tools.map((t, i) => (
                <div className="tool" key={i} aria-hidden={i >= TOOLS.length || undefined}>
                  <img src={t.logo} alt="" data-fallback="initial" />
                  <span className="initial">{t.name.charAt(0)}</span>
                  <span className="name">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CtaRow label="See the four packs" note="Or the bundle at $97" />
    </section>
  );
}
