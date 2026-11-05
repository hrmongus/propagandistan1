import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analyzer dev', robots: { index: false, follow: false } };

/* Bare test pages for the analyzer backend. No design on purpose: screens come from Claude Design later. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>{children}</div>;
}
