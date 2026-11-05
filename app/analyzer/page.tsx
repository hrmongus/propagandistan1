import type { Metadata } from 'next';
import { AnalyzerFlow } from '@/components/analyzer/AnalyzerFlow';
import { AESTHETICS } from '@/lib/analyzer/aesthetics';

export const metadata: Metadata = { title: 'Analyzer (spike)', robots: { index: false } };

export default function Analyzer() {
  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>
      <h1 style={{ fontSize: 18 }}>Analyzer (technical spike, unstyled)</h1>
      <AnalyzerFlow aesthetics={AESTHETICS.map((a) => a.name)} />
    </main>
  );
}
