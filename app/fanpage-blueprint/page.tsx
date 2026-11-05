import type { Metadata } from 'next';

// Fanpage Blueprint Builder (docs/fanpage-blueprint/HANDOFF.md). Placeholder until the screens are built;
// kept out of search until launch.
export const metadata: Metadata = {
  title: 'Free Fanpage Blueprint Builder',
  robots: { index: false, follow: false },
};

export default function FanpageBlueprint() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000', color: '#A1A1A6', fontFamily: 'system-ui', padding: 20 }}>
      <p>Fanpage Blueprint Builder: in progress.</p>
    </main>
  );
}
