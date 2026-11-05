import type { Aesthetic, PackId } from './types';

// PROVISIONAL: names and packs follow the spec; genres, handles, angles and images are placeholders until the
// values from fanpage-strategy-builder.html are copied in.
const img = (id: string): Aesthetic['images'] => [1, 2, 3, 4].map((n) => `/analyzer/aesthetics/${id}-${n}.jpg`) as Aesthetic['images'];

const a = (id: string, name: string, pack: PackId, genres: string[], angle: string): Aesthetic => ({
  id, name, pack, genres, angle, images: img(id), handle: `@${id.replace(/-/g, '.')}.sounds`,
});

export const AESTHETICS: Aesthetic[] = [
  a('old-money', 'Old money', 'golden', ['jazz', 'soul', 'indie pop'], 'Quiet luxury, slow pans, timeless'),
  a('streetwear', 'Streetwear', 'midnight', ['rap', 'trap', 'drill'], 'City nights, fits, motion'),
  a('dark-academia', 'Dark academia', 'midnight', ['indie folk', 'classical', 'alt'], 'Libraries, rain, candlelight'),
  a('light-academia', 'Light academia', 'golden', ['acoustic', 'folk', 'indie'], 'Sunlit pages, linen, calm'),
  a('cottagecore', 'Cottagecore', 'forest', ['folk', 'acoustic', 'singer-songwriter'], 'Meadows, baking, soft light'),
  a('y2k', 'Y2K', 'golden', ['pop', 'hyperpop', 'r&b'], 'Glossy, flash photos, 2000s nostalgia'),
  a('coquette', 'Coquette', 'golden', ['pop', 'bedroom pop', 'r&b'], 'Bows, pastels, romance'),
  a('clean-girl', 'Clean girl', 'coastal', ['pop', 'r&b'], 'Minimal routines, slicked hair, glow'),
  a('mob-wife', 'Mob wife', 'midnight', ['pop', 'r&b', 'italo'], 'Fur, gold, attitude'),
  a('grunge', 'Grunge', 'midnight', ['alt rock', 'emo', 'punk'], 'Flannel, film grain, angst'),
  a('vaporwave', 'Vaporwave', 'coastal', ['electronic', 'lofi', 'chillwave'], 'Pastel neon, retro computers'),
  a('synthwave', 'Synthwave', 'midnight', ['synthpop', 'electronic', 'retrowave'], 'Night drives, grids, neon'),
  a('cyberpunk', 'Cyberpunk', 'midnight', ['electronic', 'phonk', 'trap'], 'Rain-slick neon, tech'),
  a('coastal', 'Coastal', 'coastal', ['indie pop', 'acoustic', 'surf'], 'Waves, linen, golden hour'),
  a('gorpcore', 'Gorpcore', 'forest', ['indie', 'folk', 'alt'], 'Trails, outdoor gear, summits'),
  a('balletcore', 'Balletcore', 'golden', ['classical', 'piano', 'ambient'], 'Studios, tulle, grace'),
  a('fairycore', 'Fairycore', 'forest', ['ambient', 'folk', 'dream pop'], 'Forests, glitter, magic'),
  a('weirdcore', 'Weirdcore/dreamcore', 'coastal', ['dream pop', 'hyperpop', 'ambient'], 'Liminal spaces, surreal'),
  a('western', 'Cowboy/western', 'forest', ['country', 'americana', 'folk'], 'Desert roads, boots, sunsets'),
  a('noir', 'Noir', 'midnight', ['jazz', 'trip hop', 'r&b'], 'Black and white, smoke, mystery'),
];

export const aestheticById = (id: string) => AESTHETICS.find((x) => x.id === id);
