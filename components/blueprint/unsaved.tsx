'use client';

import { useSyncExternalStore } from 'react';
import { PREVIEW_KEY } from './finale';
import { Results, type StrategyRow } from './results';

const read = () => { try { return sessionStorage.getItem(PREVIEW_KEY); } catch { return null; } };

/** Renders the unsaved Blueprint kept in sessionStorage, with a banner saying why it wasn't saved. */
export function UnsavedResults() {
  const raw = useSyncExternalStore(() => () => {}, read, () => null);
  if (!raw) return <div className="fpb-screen" style={{ padding: 20, color: 'var(--text-secondary)' }}>No Blueprint in this session. <a href="/fanpage-blueprint" style={{ textDecoration: 'underline' }}>Start again</a>.</div>;
  const row = JSON.parse(raw) as StrategyRow & { reason?: string };
  return (
    <>
      <div role="status" style={{ position: 'sticky', top: 0, zIndex: 30, maxWidth: 480, margin: '0 auto', padding: '10px 16px', background: '#3A1A12', color: '#FFB8A6', fontSize: 12.5, lineHeight: 1.4 }}>
        Test mode: this Blueprint wasn&apos;t saved, so there&apos;s no permanent link. Cause: {row.reason ?? 'database unavailable'}.
      </div>
      <Results row={row} />
    </>
  );
}
