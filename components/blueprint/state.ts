'use client';

import { useEffect, useReducer } from 'react';
import { BLOCKERS, TRIED, goalsFor, type QuizAnswers } from '@/lib/analyzer/config';
import type { SpotifyTrack } from '@/lib/analyzer/spotify';

/* Quiz state machine (HANDOFF.md §4): one reducer, persisted to localStorage so a refresh keeps the answers. */

export const SCREENS = [
  'landing', 'search', 'genre', 'listeners', 'did-you-know', 'goal', 'blocker', 'how-it-works', 'aesthetics', 'audience',
  'several-pages', 'tried', 'proof', 'daily-time', 'release', 'experience', 'analyzing', 'email-gate',
] as const;
export type ScreenId = (typeof SCREENS)[number];

/** Progress bar width and "n/10" counter per screen (the mock-ups' 9 questions plus genre). */
export const PROGRESS: Partial<Record<ScreenId, { pct: number; step?: number }>> = {
  genre: { pct: 6, step: 1 }, listeners: { pct: 13, step: 2 }, 'did-you-know': { pct: 17 }, goal: { pct: 24, step: 3 }, blocker: { pct: 33, step: 4 },
  'how-it-works': { pct: 38 }, aesthetics: { pct: 44, step: 5 }, audience: { pct: 55, step: 6 }, 'several-pages': { pct: 60 },
  tried: { pct: 66, step: 7 }, proof: { pct: 70 }, 'daily-time': { pct: 77, step: 8 }, release: { pct: 88, step: 9 }, experience: { pct: 100, step: 10 },
};

export type Answers = Partial<QuizAnswers>;
export type State = { v: 1; screen: ScreenId; track: SpotifyTrack | null; answers: Answers; query: string; /** false until localStorage has been read */ ready?: boolean };

const INITIAL: State = { v: 1, screen: 'landing', track: null, answers: {}, query: '' };
const KEY = 'fpb_state_v1';

export type Action =
  | { type: 'go'; screen: ScreenId }
  | { type: 'track'; track: SpotifyTrack | null }
  | { type: 'query'; query: string }
  | { type: 'answer'; patch: Answers }
  | { type: 'load'; state: State | null }
  | { type: 'reset' };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'go': return { ...s, screen: a.screen };
    case 'track': return { ...s, track: a.track };
    case 'query': return { ...s, query: a.query };
    case 'answer': {
      const answers = { ...s.answers, ...a.patch };
      // A goal at or below the new listener bracket is no longer offered: drop it.
      if (a.patch.listeners && answers.goal && !goalAllowed(answers)) delete answers.goal;
      return { ...s, answers };
    }
    case 'load': return { ...(a.state ?? s), ready: true };
    case 'reset': return { ...INITIAL, ready: true };
  }
}

const goalAllowed = (a: Answers) => goalsFor(a.listeners).some((g) => g.id === a.goal);

/** Whether a screen's required answers are in (drives the CTA's disabled state and refresh recovery). */
export function canContinue(s: State, screen: ScreenId = s.screen): boolean {
  const a = s.answers;
  switch (screen) {
    case 'search': return !!s.track;
    case 'genre': return !!a.genre;
    case 'listeners': return !!a.listeners;
    case 'goal': return !!a.goal && goalAllowed(a);
    case 'blocker': return BLOCKERS.some((b) => b.id === a.blocker); // old saved ids no longer count
    case 'aesthetics': return (a.aesthetics?.length ?? 0) > 0;
    case 'audience': return (a.age?.length ?? 0) > 0 && !!a.gender && (a.moments?.length ?? 0) > 0;
    case 'tried': return !!a.tried?.some((t) => TRIED.some((o) => o.id === t)); // ignore old saved ids
    case 'daily-time': return !!a.dailyTime;
    case 'release': return !!a.release;
    case 'experience': return !!a.experience;
    default: return true;
  }
}

export function useQuiz() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const hydrated = !!state.ready;

  useEffect(() => {
    let restored: State | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as State | null;
      if (saved?.v === 1 && SCREENS.includes(saved.screen)) {
        // Never resume mid-animation or on a screen whose prerequisites are missing.
        let screen: ScreenId = saved.screen === 'analyzing' ? 'experience' : saved.screen;
        const idx = SCREENS.indexOf(screen);
        const firstGap = SCREENS.slice(1, idx).find((sc) => !canContinue(saved, sc));
        if (firstGap) screen = firstGap;
        restored = { ...saved, screen };
      }
    } catch { /* private mode or corrupt: start fresh */ }
    dispatch({ type: 'load', state: restored });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state, hydrated]);

  return { state, dispatch, hydrated };
}

export function clearQuiz() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
