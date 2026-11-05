import type { Metadata } from 'next';
import { geistMono } from '@/components/blueprint/fonts';
import { UnsavedResults } from '@/components/blueprint/unsaved';
import '@/components/blueprint/blueprint.css';

export const metadata: Metadata = { title: 'Your Fanpage Blueprint (not saved) — FanpageKit', robots: { index: false, follow: false } };

/** Test builds only: shows a Blueprint the database couldn't save, from this browser's session. */
export default function UnsavedResultsPage() {
  return (
    <div className={`fpb ${geistMono.variable}`}>
      <UnsavedResults />
    </div>
  );
}
