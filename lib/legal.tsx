import { readFileSync } from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { ReactNode } from 'react';

/*
 * Legal pages are kept as Markdown in content/legal/ (converted word-for-word from the signed-off .docx files)
 * and rendered here at build time. Only the subset those documents use is supported: ## headings, tables,
 * two-level "- " lists, paragraphs, **bold**, email addresses and bare domains.
 */

export const LEGAL_DOCS = [
  { slug: 'terms', title: 'Terms & Conditions', short: 'Terms' },
  { slug: 'privacy', title: 'Privacy Policy', short: 'Privacy' },
  { slug: 'refund-policy', title: 'Refund Policy', short: 'Refunds' },
] as const;

export type LegalSlug = (typeof LEGAL_DOCS)[number]['slug'];

type Block =
  | { type: 'h2'; id: string; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: { text: string; sub: string[] }[] }
  | { type: 'table'; head: string[]; rows: string[][] };

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function loadLegal(slug: LegalSlug) {
  const src = readFileSync(path.join(process.cwd(), 'content/legal', `${slug}.md`), 'utf8');
  const lines = src.split('\n');
  const blocks: Block[] = [];
  let updated = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    if (l.startsWith('## ')) {
      const text = l.slice(3).trim();
      blocks.push({ type: 'h2', id: slugify(text.replace(/^\d+\.\s*/, (m) => `section-${m.replace(/\D/g, '')} `)), text });
    } else if (l.startsWith('|')) {
      const head = cells(l);
      const rows: string[][] = [];
      i += 2; // header row, then the |---| separator
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(cells(lines[i]));
      i--;
      blocks.push({ type: 'table', head, rows });
    } else if (l.startsWith('- ')) {
      const items: { text: string; sub: string[] }[] = [];
      for (; i < lines.length && /^ {0,2}- /.test(lines[i]); i++) {
        if (lines[i].startsWith('  - ')) items[items.length - 1]?.sub.push(lines[i].slice(4));
        else items.push({ text: lines[i].slice(2), sub: [] });
      }
      i--;
      blocks.push({ type: 'ul', items });
    } else if (/^Last updated:/.test(l)) {
      updated = l.replace(/^Last updated:\s*/, '').trim();
    } else {
      blocks.push({ type: 'p', text: l.trim() });
    }
  }
  const toc = blocks.filter((b): b is Extract<Block, { type: 'h2' }> => b.type === 'h2');
  return { blocks, toc, updated };
}

/** **bold**, emails → mailto, bare domains → links, "Terms & Conditions" → /terms. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|([\w.+-]+@[\w-]+\.[\w.]+\w)|\b((?:ico\.org\.uk|edpb\.europa\.eu))\b|(Terms & Conditions)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{inline(m[1])}</strong>);
    else if (m[2]) out.push(<a key={k++} href={`mailto:${m[2]}`}>{m[2]}</a>);
    else if (m[3]) out.push(<a key={k++} href={`https://${m[3]}`} target="_blank" rel="noopener noreferrer">{m[3]}</a>);
    else if (m[4]) out.push(<Link key={k++} href="/terms">{m[4]}</Link>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** "4.2 **Posting rules.** …" → clause number set apart from the text. */
function para(text: string, key: number) {
  const m = /^(\d+\.\d+)\s+(.*)$/.exec(text);
  if (m) return <p key={key} className="clause"><span className="cn">{m[1]}</span><span>{inline(m[2])}</span></p>;
  return <p key={key}>{inline(text)}</p>;
}

export function LegalBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return <h2 key={i} id={b.id}><a href={`#${b.id}`}>{b.text}</a></h2>;
          case 'p':
            return para(b.text, i);
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    {inline(it.text)}
                    {it.sub.length > 0 && <ul>{it.sub.map((s, n) => <li key={n}>{inline(s)}</li>)}</ul>}
                  </li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={i} className="legal-table">
                <table>
                  <thead><tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>{r.map((c, n) => <td key={n} data-label={b.head[n]}>{inline(c)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}
