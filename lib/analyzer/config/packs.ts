import type { Pack, PackId } from './types';

/** Assets live in public/fanpage-blueprint/assets (placeholders render until the files are uploaded). */
export const ASSET = (path: string) => `/fanpage-blueprint/assets/${path}`;

export const PACKS: Pack[] = [
  { id: 'golden', name: 'Golden Hour', checkoutSlug: 'golden-hour', cover: ASSET('video/pack-golden.jpg'), previewClipUrl: ASSET('video/pack-golden.mp4'), vibe: 'Warm · nostalgic · bittersweet', feel: 'Sunsets and silhouettes. For songs that sound like a memory.' },
  { id: 'midnight', name: 'Midnight City', checkoutSlug: 'midnight-city', cover: ASSET('video/pack-midnight.jpg'), previewClipUrl: ASSET('video/pack-midnight.mp4'), vibe: 'Moody · restless · cinematic', feel: 'City lights after dark. For late-night, in-your-head songs.' },
  { id: 'coastal', name: 'Coastal Drive', checkoutSlug: 'coastal-drive', cover: ASSET('video/pack-coastal.jpg'), previewClipUrl: ASSET('video/pack-coastal.mp4'), vibe: 'Free · bright · carefree', feel: 'Open roads and sea air. For songs that feel like summer.' },
  { id: 'forest', name: 'Forest Trail', checkoutSlug: 'forest-trail', cover: ASSET('video/pack-forest.jpg'), previewClipUrl: ASSET('video/pack-forest.mp4'), vibe: 'Calm · dreamy · grounded', feel: 'Green light and quiet paths. For slow, honest songs.' },
];

export const packById = (id: PackId) => PACKS.find((p) => p.id === id)!;

/**
 * When two recommended pages map to the same kit, the later one takes the closest unused kit (HANDOFF.md §4).
 * Golden Hour's order reproduces the mock (Light academia, Clean girl, Coquette → Golden Hour, Coastal Drive, Midnight City). To be confirmed with the product owner.
 */
export const KIT_FALLBACK: Record<PackId, PackId[]> = {
  golden: ['coastal', 'midnight', 'forest'],
  coastal: ['golden', 'midnight', 'forest'],
  midnight: ['coastal', 'forest', 'golden'],
  forest: ['golden', 'midnight', 'coastal'],
};
