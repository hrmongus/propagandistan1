'use client';

import { useState } from 'react';
import { FAQS } from '@/lib/data';

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
              <div className="faq-item" key={q}>
                <button className="faq-btn" type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="faq-q">{q}</span>
                  <span className="faq-sym">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="faq-a">{a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
