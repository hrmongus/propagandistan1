import type { Metadata, Viewport } from 'next';
import { Flow } from '@/components/blueprint/Flow';
import { geistMono } from '@/components/blueprint/fonts';
import '@/components/blueprint/blueprint.css';

// Fanpage Blueprint Builder (docs/fanpage-blueprint/HANDOFF.md). Kept out of search until launch.
export const metadata: Metadata = {
  title: 'Free Fanpage Blueprint Builder — FanpageKit',
  description: "Get your track's Fanpage Fit Score and a personal fan page plan in 2 minutes.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#000000', viewportFit: 'cover' };

export default function FanpageBlueprint() {
  return (
    <div className={`fpb ${geistMono.variable}`}>
      <Flow />
    </div>
  );
}
