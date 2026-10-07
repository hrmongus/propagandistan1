import { GRADS, PACK_SLUGS } from '@/lib/data';
import { LazyVideo } from './LazyVideo';

/** Fan of five 9:16 tiles, offset diagonally. Mirrors mkFan(gi, big, tiny) in the design. */
export function Fan({ gi, size }: { gi: number; size: 'big' | 'mid' | 'small' | 'tiny' }) {
  const tw = { big: 88, mid: 56, small: 42, tiny: 26 }[size];
  const dx = { big: 34, mid: 22, small: 9, tiny: 9 }[size];
  const dy = { big: 18, mid: 12, small: 4, tiny: 5 }[size];
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
