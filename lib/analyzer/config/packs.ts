import type { Pack, PackId } from './types';

/** Assets live in public/fanpage-blueprint/assets (placeholders render until the files are uploaded). */
export const ASSET = (path: string) => `/fanpage-blueprint/assets/${path}`;

export const PACKS: Pack[] = [
  { id: 'golden', name: 'Golden Hour', checkoutSlug: 'golden-hour', cover: ASSET('imagery/pack-golden-hour.png'), previewClipUrl: '/analyzer/pack-golden.mp4' },
  { id: 'midnight', name: 'Midnight City', checkoutSlug: 'midnight-city', cover: ASSET('imagery/pack-midnight-city.png'), previewClipUrl: '/analyzer/pack-midnight.mp4' },
  { id: 'coastal', name: 'Coastal Drive', checkoutSlug: 'coastal-drive', cover: ASSET('imagery/pack-coastal-drive.png'), previewClipUrl: '/analyzer/pack-coastal.mp4' },
  { id: 'forest', name: 'Forest Trail', checkoutSlug: 'forest-trail', cover: ASSET('imagery/pack-forest-trail.png'), previewClipUrl: '/analyzer/pack-forest.mp4' },
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
