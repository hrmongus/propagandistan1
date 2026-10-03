'use client';

import { useState } from 'react';
import { FAQS } from '@/lib/data';
import { Collapse, PlusMinus } from '../Collapse';

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section">
      <div className="faq">
        <h2 className="h2">Questions people ask before buying.</h2>
        <div className="faq-list">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div className={isOpen ? 'faq-item open' : 'faq-item'} key={q}>
                <button className="faq-btn" type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="faq-q">{q}</span>
                  <PlusMinus />
                </button>
                <Collapse open={isOpen} id={`faq-${i}`}><p className="faq-a">{a}</p></Collapse>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
