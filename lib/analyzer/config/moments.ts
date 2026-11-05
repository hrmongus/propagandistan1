import type { Moment } from './types';

// PROVISIONAL: replace with the 8 moments and default hook lines from fanpage-strategy-builder.html.
// Default hooks double as the fallback when the LLM times out or fails (lowercase, ≤10 words).
export const MOMENTS: Moment[] = [
  { id: 'night-drive', label: 'Late night drive', defaultHook: 'pov: 2am, empty highway, this comes on' },
  { id: 'heartbreak', label: 'Heartbreak', defaultHook: 'pov: you finally deleted their number' },
  { id: 'gym', label: 'Gym', defaultHook: 'pov: last set and this song starts' },
  { id: 'getting-ready', label: 'Getting ready', defaultHook: 'pov: mirror check before the night starts' },
  { id: 'study', label: 'Studying', defaultHook: 'pov: 3am, deadline tomorrow, still on repeat' },
  { id: 'summer', label: 'Summer day', defaultHook: 'pov: windows down, first warm day of the year' },
  { id: 'rainy-day', label: 'Rainy day', defaultHook: 'pov: rain on the window, nowhere to be' },
  { id: 'main-character', label: 'Main character walk', defaultHook: 'pov: walking through the city like a movie' },
];

export const momentById = (id: string) => MOMENTS.find((m) => m.id === id);
