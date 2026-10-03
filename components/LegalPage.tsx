import Link from 'next/link';
import { PageBar } from '@/components/PageBar';
import { LEGAL_DOCS, LegalBody, loadLegal, type LegalSlug } from '@/lib/legal';

/** Shared layout for /terms, /privacy and /refund-policy: tabs between the three, a contents list and the document. */
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug)!;
  const { blocks, toc, updated } = loadLegal(slug);
  return (
    <main className="page">
      <PageBar>Legal</PageBar>
      <div className="legal">
        <nav className="legal-tabs" aria-label="Legal documents">
          {LEGAL_DOCS.map((d) => (
            <Link key={d.slug} href={`/${d.slug}`} aria-current={d.slug === slug ? 'page' : undefined}>{d.short}</Link>
          ))}
        </nav>
        <header className="legal-head">
          <h1>{doc.title}</h1>
          {updated && <p>Last updated {updated}</p>}
        </header>
        <div className="legal-grid">
          <aside className="legal-toc" aria-label="On this page">
            <span className="k">On this page</span>
            <ol>
              {toc.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}
            </ol>
          </aside>
          <article className="legal-body">
            <LegalBody blocks={blocks} />
          </article>
        </div>
        <div className="rules-cta">
          <Link className="cta-note" href="/">Back to FanpageKit</Link>
        </div>
      </div>
    </main>
  );
}
