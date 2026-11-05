import type { Moment } from './types';

/*
 * Listening moments: labels and icons from screen 08 (the mock-up is the source of truth for labels, HANDOFF.md §4).
 * Default hooks double as the LLM fallback (lowercase, ≤10 words). Seven reuse the handoff's seed lines; chill,
 * romance, rebellion, dreamy and feel-good are new in the same voice.
 */
export const MOMENTS: Moment[] = [
  { id: 'gym', label: 'Gym', icon: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>', defaultHook: 'the song that makes you add 10kg' },
  { id: 'study', label: 'Study', icon: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h8"/>', defaultHook: '3 hours into studying and this saves me' },
  { id: 'chill', label: 'Chill', icon: '<path d="M2 9c3-3 5 3 8 0s5 3 8 0M2 15c3-3 5 3 8 0s5 3 8 0"/>', defaultHook: 'sunday morning, slow coffee, this on repeat' },
  { id: 'party', label: 'Party', icon: '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>', defaultHook: 'imagine hearing this live at 1am' },
  { id: 'romance', label: 'Romance', icon: '<path d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z"/>', defaultHook: 'the song i want playing when you walk in' },
  { id: 'heartbreak', label: 'Heartbreak', icon: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="m12 5-2 4 4 2-2 4"/>', defaultHook: "the song i play when i pretend i'm over you" },
  { id: 'night-drive', label: 'Night Drive', icon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', defaultHook: 'pov: 2am, empty highway, this comes on' },
  { id: 'confidence', label: 'Confidence', icon: '<path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7-6.2-3.4-6.2 3.4 1.3-7L2 9.4l7-.9z"/>', defaultHook: "walking into the party like it's my movie" },
  { id: 'nostalgia', label: 'Nostalgia', icon: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', defaultHook: 'this song sounds like your childhood bedroom' },
  { id: 'rebellion', label: 'Rebellion', icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', defaultHook: 'for the version of you that stopped asking permission' },
  { id: 'feel-good', label: 'Feel-Good', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M9 9.5v.01M15 9.5v.01"/>', defaultHook: 'windows down, nowhere to be' },
  { id: 'dreamy', label: 'Dreamy', icon: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9z"/>', defaultHook: 'this sounds like floating through a summer dream' },
];

export const momentById = (id: string) => MOMENTS.find((m) => m.id === id);
