import type { ListenerBracket, QuizQuestion } from './types';
import { AESTHETICS } from './aesthetics';
import { MOMENTS } from './moments';

// PROVISIONAL: prompts and options to be replaced with the ones in fanpage-strategy-builder.html. Question ids are
// the keys of QuizAnswers and the ESP tags (listeners, goal, blocker, first aesthetic, time, release, experience).
export const LISTENER_BRACKETS: { id: ListenerBracket; label: string }[] = [
  { id: 'lt1k', label: 'Under 1,000' },
  { id: '1k-10k', label: '1,000–10,000' },
  { id: '10k-50k', label: '10,000–50,000' },
  { id: '50k-100k', label: '50,000–100,000' },
  { id: '100k+', label: '100,000+' },
];

export const QUIZ: QuizQuestion[] = [
  { id: 'listeners', type: 'single', prompt: 'How many monthly listeners do you have?', options: LISTENER_BRACKETS },
  {
    id: 'goal', type: 'single', prompt: "What's your main goal?",
    options: [
      { id: 'streams', label: 'More streams' }, { id: 'followers', label: 'More followers' },
      { id: 'viral', label: 'One song goes viral' }, { id: 'playlists', label: 'Get on playlists' },
    ],
  },
  {
    id: 'blocker', type: 'single', prompt: "What's holding you back?",
    options: [
      { id: 'no-time', label: 'No time to make content' }, { id: 'no-face', label: "I don't want to show my face" },
      { id: 'no-ideas', label: "I don't know what to post" }, { id: 'no-results', label: 'Posting gets no views' },
    ],
  },
  { id: 'aesthetics', type: 'multi', prompt: 'Pick up to 3 aesthetics that fit your song', max: 3, options: AESTHETICS.map((x) => ({ id: x.id, label: x.name })) },
  {
    id: 'age', type: 'single', prompt: 'How old is your audience?',
    options: [{ id: '13-17', label: '13–17' }, { id: '18-24', label: '18–24' }, { id: '25-34', label: '25–34' }, { id: '35+', label: '35+' }],
  },
  {
    id: 'gender', type: 'single', prompt: 'Who listens most?',
    options: [{ id: 'female', label: 'Mostly women' }, { id: 'male', label: 'Mostly men' }, { id: 'mixed', label: 'Mixed' }],
  },
  { id: 'moments', type: 'multi', prompt: 'When do people listen to this song?', max: 3, options: MOMENTS.map((m) => ({ id: m.id, label: m.label })) },
  {
    id: 'time', type: 'single', prompt: 'How much time can you spend per week?',
    options: [{ id: 'lt1h', label: 'Under 1 hour' }, { id: '1-3h', label: '1–3 hours' }, { id: '3h+', label: '3+ hours' }],
  },
  {
    id: 'release', type: 'single', prompt: 'Is the song out yet?',
    options: [{ id: 'out', label: "It's out" }, { id: 'soon', label: 'Releasing soon' }, { id: 'unreleased', label: 'No date yet' }],
  },
  {
    id: 'experience', type: 'single', prompt: 'Have you tried fan pages before?',
    options: [{ id: 'never', label: 'Never' }, { id: 'tried', label: 'Tried, no results' }, { id: 'running', label: 'Running some now' }],
  },
];
