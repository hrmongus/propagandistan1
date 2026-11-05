import type { Metadata } from 'next';
import { VideoCard } from '@/components/analyzer/VideoCard';

export const metadata: Metadata = { title: 'Analyzer video test', robots: { index: false } };

// Step 7 device test: three example videos from the spike test set (docs/analyzer/spike), audio from Deezer.
const CARDS = [
  { id: 'a', pack: 'forest', deezerId: 4114285751, hookStart: 5.5, hookEnd: 15.5, lyric: 'Conquista mi alma sin tener compasión', hook: 'pov: crushing reps in your favorite trail jacket', label: 'Folkloreando – La Sin Corazón (hook 5.5–15.5s)' },
  { id: 'b', pack: 'midnight', deezerId: 3870881901, hookStart: 15, hookEnd: 25, lyric: "I'm drum beatin' so fast, every stumble, every laugh", hook: 'pov: foggy street, headlights blur, heart races', label: 'EverNotezMusic – Trip Trap Steps (hook 15–25s)' },
  { id: 'c', pack: 'coastal', deezerId: 4382526561, hookStart: 15.5, hookEnd: 25.5, lyric: 'Kiedy słyszę głos twój znów', hook: 'pov: midnight streets, neon lights flickering quietly', label: 'ARCZI – Poprowadź mnie (hook 15.5–25.5s)' },
];

export default function VideoTest() {
  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 18 }}>Step 7: example videos</h1>
      <p style={{ fontSize: 13, maxWidth: 640 }}>
        Tap a video: the pack clip and the song preview should start together, the song at the hook window. Tapping another stops the first. Report per device:
        does it play on the first tap, does audio start at the right spot, does the drift number stay under ~0.3s, and does it still play after leaving the page open
        20+ minutes (preview URLs expire after 15).
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {CARDS.map((c) => <VideoCard key={c.id} {...c} />)}
      </div>
    </main>
  );
}
