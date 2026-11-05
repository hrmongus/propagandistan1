import { PACKS } from '@/lib/analyzer/config';

// Step 10 device test: three stacked 9:16 boxes that should all autoplay together (muted, inline) with text on top.
const BOXES = [
  { pack: 'golden', text: 'pov: 2am, empty highway, this comes on' },
  { pack: 'midnight', text: 'pov: you finally deleted their number' },
  { pack: 'coastal', text: 'pov: windows down, first warm day of the year' },
];

export default function DevVideo() {
  return (
    <main>
      <h1 style={{ fontSize: 18 }}>/dev/video</h1>
      <p style={{ maxWidth: 520 }}>All three should start playing by themselves and loop smoothly while you scroll. Report per device: do all 3 autoplay, any stutter, any play button overlay, does it resume after switching tabs.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {BOXES.map((b) => (
          <div key={b.pack} style={{ position: 'relative', width: 'min(360px, 100%)', aspectRatio: '9 / 16', background: '#000', overflow: 'hidden' }}>
            <video src={PACKS.find((p) => p.id === b.pack)!.previewClipUrl} autoPlay muted loop playsInline preload="auto" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <p style={{ position: 'absolute', top: '12%', left: 16, right: 16, margin: 0, color: '#fff', fontWeight: 700, fontSize: 20, textAlign: 'center', textShadow: '0 1px 4px #000' }}>{b.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
