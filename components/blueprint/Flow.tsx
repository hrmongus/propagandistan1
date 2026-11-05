'use client';

import { useCallback, useEffect, useRef, type ComponentType } from 'react';
import { track } from '@/lib/analyzer/track';
import {
  Aesthetics, Audience, Blocker, DailyTime, DidYouKnow, Experience, Goal, HowItWorks, Landing, Listeners, Proof, Release,
  Search, SeveralPages, Tried, type ScreenProps,
} from './screens';
import { Analyzing, EmailGate } from './finale';
import { SCREENS, useQuiz, type ScreenId } from './state';

const VIEWS: Record<ScreenId, ComponentType<ScreenProps>> = {
  landing: Landing, search: Search, listeners: Listeners, 'did-you-know': DidYouKnow, goal: Goal, blocker: Blocker,
  'how-it-works': HowItWorks, aesthetics: Aesthetics, audience: Audience, 'several-pages': SeveralPages, tried: Tried,
  proof: Proof, 'daily-time': DailyTime, release: Release, experience: Experience, analyzing: Analyzing, 'email-gate': EmailGate,
};

/**
 * The quiz funnel (screens 00–16). Each step is a browser history entry, so the phone's back gesture and the
 * on-screen back button both step back through the quiz instead of leaving the page.
 */
export function Flow() {
  const { state, dispatch, hydrated } = useQuiz();
  const screen = state.screen;
  const seeded = useRef(false);
  /** Steps pushed onto browser history in this page load (after a reload there are none to go back through). */
  const depth = useRef(0);

  // Seed history with the current step once state has loaded (a refresh resumes where the user was).
  useEffect(() => {
    if (!hydrated || seeded.current) return;
    seeded.current = true;
    history.replaceState({ fpb: screen }, '');
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { fpb?: ScreenId } | null)?.fpb;
      if (depth.current > 0) depth.current--;
      // Never step back into the timed analyzing screen.
      dispatch({ type: 'go', screen: s && s !== 'analyzing' ? s : 'landing' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [hydrated, screen, dispatch]);

  // One step_viewed per screen shown, and a fresh scroll position.
  useEffect(() => {
    if (!hydrated) return;
    window.scrollTo(0, 0);
    track('step_viewed', screen);
  }, [screen, hydrated]);

  const next = useCallback(() => {
    const i = SCREENS.indexOf(screen);
    const to = SCREENS[Math.min(i + 1, SCREENS.length - 1)];
    if (screen === 'search' && state.track) track('track_selected', 'search');
    // The analyzing screen replaces its own entry, so "back" from the email gate lands on the last question.
    if (screen === 'analyzing') history.replaceState({ fpb: to }, '');
    else { history.pushState({ fpb: to }, ''); depth.current++; }
    dispatch({ type: 'go', screen: to });
  }, [screen, state.track, dispatch]);

  const back = useCallback(() => {
    if (depth.current > 0) { history.back(); return; } // the popstate handler updates depth
    // Nothing of ours to go back through (e.g. after a reload): step to the previous screen in place.
    // From the email gate that's the last question, skipping the timed analyzing screen.
    const i = SCREENS.indexOf(screen);
    const prev = SCREENS[Math.max(0, i - 1)] === 'analyzing' ? 'experience' : SCREENS[Math.max(0, i - 1)];
    history.replaceState({ fpb: prev }, '');
    dispatch({ type: 'go', screen: prev });
  }, [screen, dispatch]);

  if (!hydrated) return <div className="fpb-screen" aria-busy="true" />;
  const View = VIEWS[screen];
  return <View key={screen} state={state} dispatch={dispatch} next={next} back={back} />;
}
