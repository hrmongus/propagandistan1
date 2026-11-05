import type { Aesthetic, PackId } from './types';
import { ASSET } from './packs';

/*
 * The 20 aesthetics. Names, genre lines and mood-board tiles from screen 07 (docs/fanpage-blueprint/screens);
 * pack mapping from HANDOFF.md §4. Handles for light academia / clean girl / coquette come from the mock-ups; the
 * rest are example handles in the same style.
 */
/**
 * Mood-board images live in public/fanpage-blueprint/assets/aesthetics/<id>/1.jpg, 2.jpg, 3.jpg
 * (1 = the tall left slot). Aesthetics without files yet show placeholders until they're added.
 */
const board = (id: string) => [1, 2, 3].map((n) => ASSET(`aesthetics/${id}/${n}.jpg`));

const a = (id: string, name: string, pack: PackId, genres: string, _tiles: string[], handle: string, angle: string): Aesthetic => ({ id, name, pack, genres, images: board(id), handle, angle });
// The mock's tile numbers (kept below as the 5th argument) were placeholders; they're no longer used.
const tiles = (...n: string[]) => n;

export const AESTHETICS: Aesthetic[] = [
  a('old-money', 'Old money', 'golden', 'Jazz · soft piano · restrained pop', tiles('12', '20', '04'), 'quiet.luxury.sounds', 'Quiet luxury, slow pans, timeless rooms'),
  a('streetwear', 'Streetwear', 'midnight', 'Rap · drill · trap', tiles('07', '09', '22'), 'late.night.fits', 'City nights, fits and motion'),
  a('dark-academia', 'Dark academia', 'forest', 'Chamber · indie folk · moody alt', tiles('21', '24', '19'), 'candlelit.chapters', 'Libraries, rain and candlelight'),
  a('light-academia', 'Light academia', 'golden', 'Acoustic · soft indie · classical piano', tiles('06', '05', '12'), 'goldenhour.library', 'Sad songs and late-night drives'),
  a('cottagecore', 'Cottagecore', 'forest', 'Folk · singer-songwriter · pastoral indie', tiles('11', '08', '24'), 'meadow.mornings', 'Meadows, baking and soft light'),
  a('y2k', 'Y2K', 'coastal', '2000s pop · dance · hyperpop', tiles('01', '08', '07'), 'flip.phone.summer', 'Glossy flash photos and 2000s nostalgia'),
  a('coquette', 'Coquette', 'golden', 'Dream pop · waltz-tempo ballads', tiles('08', '11', '03'), 'pearls.and.bows', 'Dreamy ballads and ribbons'),
  a('clean-girl', 'Clean girl', 'golden', 'Soft pop · lo-fi · wellness R&B', tiles('06', '13', '20'), 'iced.matcha.mornings', 'Soft pop and slow mornings'),
  a('mob-wife', 'Mob wife', 'midnight', 'Italian disco · dramatic pop', tiles('07', '05', '03'), 'fur.and.gold', 'Fur, gold and attitude'),
  a('grunge', 'Grunge', 'midnight', '90s alt · shoegaze · garage rock', tiles('22', '23', '21'), 'flannel.static', 'Film grain, flannel and feedback'),
  a('vaporwave', 'Vaporwave', 'coastal', 'Slowed samples · future funk', tiles('01', '14', '09'), 'pastel.mall.radio', 'Pastel neon and retro screens'),
  a('synthwave', 'Synthwave', 'midnight', 'Synthwave · retrowave · 80s electronic', tiles('03', '07', '01'), 'neon.grid.drive', 'Night drives, grids and neon'),
  a('cyberpunk', 'Cyberpunk', 'midnight', 'Industrial · dark techno · bass', tiles('09', '07', '18'), 'rain.on.chrome', 'Rain-slick neon and tech'),
  a('coastal', 'Coastal', 'coastal', 'Soft rock · yacht rock · breezy pop', tiles('14', '16', '13'), 'salt.and.linen', 'Waves, linen and golden hour'),
  a('gorpcore', 'Gorpcore', 'forest', 'Ambient · folk-electronic · outdoor indie', tiles('17', '15', '23'), 'trail.mix.tapes', 'Trails, summits and outdoor gear'),
  a('balletcore', 'Balletcore', 'golden', 'Classical · delicate pop · piano ballads', tiles('11', '06', '08'), 'satin.and.tulle', 'Studios, tulle and grace'),
  a('fairycore', 'Fairycore', 'forest', 'Ethereal folk · dream pop · harp indie', tiles('10', '08', '24'), 'moss.and.glitter', 'Forests, glitter and quiet magic'),
  a('weirdcore', 'Weirdcore / dreamcore', 'golden', 'Ambient · dream pop · slowed', tiles('15', '13', '04'), 'liminal.hours', 'Liminal spaces and half-remembered dreams'),
  a('western', 'Cowboy / western', 'forest', 'Country · Americana · outlaw rock', tiles('02', '03', '06'), 'dust.and.denim', 'Desert roads, boots and sunsets'),
  a('noir', 'Noir', 'midnight', 'Jazz · trip-hop · cinematic score', tiles('23', '19', '22'), 'smoke.and.shadows', 'Black and white, smoke and mystery'),
];

export const aestheticById = (id: string) => AESTHETICS.find((x) => x.id === id);
