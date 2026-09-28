import { GRADS, PACK_SLUGS } from '@/lib/data';
import { LazyVideo } from './LazyVideo';

/** Fan of five 9:16 tiles, offset diagonally. Mirrors mkFan(gi, big, tiny) in the design. */
export function Fan({ gi, size }: { gi: number; size: 'big' | 'mid' | 'tiny' }) {
  const tw = size === 'big' ? 88 : size === 'tiny' ? 26 : 56;
  const dx = size === 'big' ? 34 : size === 'tiny' ? 9 : 22;
  const dy = size === 'big' ? 18 : size === 'tiny' ? 5 : 12;
  const slug = PACK_SLUGS[gi % 4];
  return (
    <div className="fan" style={{ width: tw + dx * 4, height: (tw * 16) / 9 + dy * 4 }}>
      {GRADS[gi % 4].map((bg, k) => (
        <div key={k} className="tile" style={{ left: k * dx, top: k * dy, width: tw, background: bg }}>
          {k < 4 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/uploads/packs/${slug}-${k + 1}.webp`} alt="" loading="lazy" />
          ) : (
            <LazyVideo src={`/uploads/packs/${slug}.mp4`} />
          )}
        </div>
      ))}
    </div>
  );
}

/** The four fans shown for the bundle. */
export function BundleFans({ size }: { size: 'mid' | 'tiny' }) {
  return (
    <>
      {[0, 1, 2, 3].map((g) => (
        <Fan key={g} gi={g} size={size} />
      ))}
    </>
  );
}
