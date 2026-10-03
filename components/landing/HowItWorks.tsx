'use client';

import { useEffect, useRef, useState } from 'react';
import { STEPS } from '@/lib/data';
import { Collapse, PlusMinus } from '../Collapse';
import { CtaRow } from './Nav';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Steps() {
  const [open, setOpen] = useState(0);
  return (
    <div className="steps">
      {STEPS.map((s, i) => {
        const isOpen = open === i;
        return (
          <div className={isOpen ? 'step open' : 'step'} key={s.n}>
            <button className="step-btn" type="button" aria-expanded={isOpen} aria-controls={`step-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
              <span className="step-num">{s.n}</span>
              <span className="step-text"><span className="step-title">{s.title}</span><span className="step-short">{s.short}</span></span>
              <PlusMinus />
            </button>
            <Collapse open={isOpen} id={`step-${i}`}><p className="step-body">{s.body}</p></Collapse>
          </div>
        );
      })}
    </div>
  );
}

/** Time-saved bars with a scroll-driven metallic sheen. */
function TimeCard() {
  const card = useRef<HTMLDivElement>(null);
  const grey = useRef<HTMLDivElement>(null);
  const green = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0, sheen = -1;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const cr = card.current!.getBoundingClientRect();
        const sh = Math.round(clamp(1 - (cr.top + cr.height / 2) / (vh + cr.height), 0, 1) * 200) / 200;
        if (sh === sheen) return;
        sheen = sh;
        grey.current!.style.backgroundPosition = `${Math.round(sh * 100)}% 50%`;
        green.current!.style.backgroundPosition = `${Math.round(100 - sh * 100)}% 50%`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="time-card" ref={card}>
      <div className="bars">
        <div className="bar-col">
          <div className="bar-grey" ref={grey} />
          <div className="bar-grey-fade" />
          <div className="bar-grey-label">
            <span className="bar-val">23.5 <small>hours</small></span>
            <div className="bar-cap">Without FanpageKit <span className="arr">↓</span></div>
          </div>
        </div>
        <div className="bar-col green">
          <span className="bar-val green">2 <small>hours</small></span>
          <div className="bar-cap strong">With FanpageKit <span className="arr green">↓</span></div>
          <div className="bar-green" ref={green} />
        </div>
      </div>
      <div className="bars-foot"><span>47 min a day</span><span>4 min a day</span></div>
      <div className="bars-sum"><span className="dim">Editing time per month</span><span className="save">Save 22.7 hours</span></div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="how-grid">
        <div className="how-copy">
          <div className="intro">
            <h2 className="h2">Three steps. On average 4 minutes of editing vs 47 minutes of doing it manually.</h2>
            <p>Nothing to film. Nothing to appear in. No ad spend.</p>
          </div>
          <Steps />
        </div>
        <TimeCard />
      </div>
      <CtaRow label="Get the pack — $37" note="30 clips · 4 minutes a day" />
    </section>
  );
}
