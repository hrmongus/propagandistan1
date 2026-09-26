'use client';

import { useState } from 'react';
import { config } from '@/lib/config';

type Step = { title: string; sub: React.ReactNode; body: (next: () => void) => React.ReactNode };

export function AccessSteps({ orderName, discordUrl, driveUrl }: { orderName: string; discordUrl: string; driveUrl: string }) {
  const [current, setCurrent] = useState(1);

  const steps: Step[] = [
    {
      title: 'Watch the video',
      sub: 'Seven minutes on how the 30 days work.',
      body: (next) => (
        <>
          <div className="vsl"><span className="play"><i /></span><span className="cap">drop VSL · welcome.mp4</span></div>
          <button className="btn" type="button" onClick={next} style={{ alignSelf: 'flex-start' }}>I&apos;ve watched it — continue</button>
        </>
      ),
    },
    {
      title: 'Book your onboarding',
      sub: 'The method has a basic form, but every musician spins it their own way to hit the best numbers. 20 minutes with us gets you there faster.',
      body: (next) => (
        <>
          <div className="cal">
            {config.calendlyUrl ? (
              <iframe src={config.calendlyUrl} title="Book onboarding" loading="lazy" />
            ) : (
              <div className="empty">Calendly widget embeds here<br />set <code>NEXT_PUBLIC_CALENDLY_URL</code></div>
            )}
          </div>
          <div className="btn-row">
            <button className="btn" type="button" onClick={next}>Booked — continue</button>
            <button className="btn btn-ghost" type="button" onClick={next}>Skip onboarding for now</button>
          </div>
        </>
      ),
    },
    {
      title: 'Join the community',
      sub: 'Where people share how they grow fan pages organically — from single-page musicians to operators running 20 pages at scale.',
      body: (next) => (
        <div className="btn-row">
          <a className="btn" href={discordUrl} target="_blank" rel="noopener noreferrer">Join Discord</a>
          <button className="btn btn-ghost" type="button" onClick={next}>Continue</button>
        </div>
      ),
    },
    {
      title: 'Access everything',
      sub: <>{orderName} — finished videos, raw clips, guides and the playbook, in one Drive folder.</>,
      body: () => (
        <a className="btn" href={driveUrl} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>
          <span>Open in Google Drive</span><span>→</span>
        </a>
      ),
    },
  ];

  return (
    <>
      {steps.map((s, i) => {
        const n = i + 1;
        const open = current === n, done = current > n;
        return (
          <div key={n} className={['astep', open && 'open', done && 'done'].filter(Boolean).join(' ')}>
            <div className="astep-head">
              <span className="astep-num">{done ? '✓' : n}</span>
              <span className="astep-text"><span className="astep-title">{s.title}</span><span className="astep-sub">{s.sub}</span></span>
              <span className="astep-count">Step {n} of 4</span>
            </div>
            {open && <div className="astep-body">{s.body(() => setCurrent(n + 1))}</div>}
          </div>
        );
      })}
    </>
  );
}
