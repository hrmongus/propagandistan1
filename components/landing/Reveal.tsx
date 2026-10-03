/* eslint-disable @next/next/no-img-element */
import { ACCOUNTS } from '@/lib/data';
import { config } from '@/lib/config';
import { CtaRow } from './Nav';

export function Reveal() {
  const items = [...ACCOUNTS, ...ACCOUNTS];
  return (
    <section className="reveal">
      <div className="reveal-head">
        <h2 className="h2">You&apos;ve seen this format a thousand times.</h2>
        <p>
          The pages pushing today&apos;s biggest songs aren&apos;t run by the artists. They&apos;re small accounts posting the
          same short, faceless, music-first format on repeat. Same structure, different track. That&apos;s the entire machine.
        </p>
      </div>
      <div className="marquee">
        <div className="marquee-track accounts-track" style={{ '--dur': `${config.marqueeSeconds}s` } as React.CSSProperties}>
          {items.map((a, i) => (
            <div className="acc" key={i} aria-hidden={i >= ACCOUNTS.length || undefined}>
              <div className="acc-head">
                <div className="acc-avatar"><img src={`/uploads/pages/page${a.page}_s1.webp`} alt="" decoding="async" fetchPriority="low" /></div>
                <div className="acc-id">
                  <div className="acc-handle">{a.handle}</div>
                  <div className="acc-platform">{a.platform}</div>
                </div>
              </div>
              <div className="acc-stats">
                <span><b>{a.s1}</b> {a.l1}</span>
                <span><b>{a.s2}</b> {a.l2}</span>
                <span><b>{a.s3}</b> {a.l3}</span>
              </div>
              <div className="acc-grid">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div className="acc-tile" key={k}><img src={`/uploads/pages/page${a.page}_s${k}.webp`} alt="" decoding="async" fetchPriority="low" /></div>
                ))}
              </div>
              <div className="acc-note">{a.note}</div>
            </div>
          ))}
        </div>
      </div>
      <CtaRow label="Run the same format — $37" note="Instant download · No face required" />
    </section>
  );
}
