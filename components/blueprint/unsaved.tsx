'use client';

import { useSyncExternalStore } from 'react';
import { PREVIEW_KEY } from './finale';
import { Results, type StrategyRow } from './results';

const read = () => { try { return sessionStorage.getItem(PREVIEW_KEY); } catch { return null; } };

/** Renders the unsaved Blueprint kept in sessionStorage (test mode; the reason it wasn't saved goes to the console). */
export function UnsavedResults() {
  const raw = useSyncExternalStore(() => () => {}, read, () => null);
  if (!raw) return <div className="fpb-screen" style={{ padding: 20, color: 'var(--text-secondary)' }}>No Blueprint in this session. <a href="/fanpage-blueprint" style={{ textDecoration: 'underline' }}>Start again</a>.</div>;
  const row = JSON.parse(raw) as StrategyRow & { reason?: string };
  if (row.reason) console.info('[fanpage-blueprint] unsaved test result:', row.reason);
  return (
    <>
      <Results row={row} />
    </>
  );
}
