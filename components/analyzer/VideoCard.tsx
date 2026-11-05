'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * One example fan-page video: muted looping pack clip + text hook + lyric line, with the track's Deezer preview
 * as the soundtrack starting at the hook window (seconds into the 30s preview, not the full song).
 * One tap starts both. Only one card plays at a time. Bare on purpose: the design drops in later.
 */

const STOP_OTHERS = 'fpk-analyzer-stop';

type Props = { id: string; pack: string; hook: string; lyric?: string | null; deezerId?: number | null; hookStart?: number; hookEnd?: number; label?: string };

export function VideoCard({ id, pack, hook, lyric, deezerId, hookStart = 0, hookEnd = 30, label }: Props) {
  const video = useRef<HTMLVideoElement>(null), audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [debug, setDebug] = useState('');

  const stop = () => {
    video.current?.pause();
    audio.current?.pause();
    setPlaying(false);
  };

  useEffect(() => {
    const onOther = (e: Event) => { if ((e as CustomEvent).detail !== id) stop(); };
    window.addEventListener(STOP_OTHERS, onOther);
    return () => window.removeEventListener(STOP_OTHERS, onOther);
  }, [id]);

  const play = () => {
    const v = video.current, a = audio.current;
    if (!v) return;
    if (playing) return stop();
    window.dispatchEvent(new CustomEvent(STOP_OTHERS, { detail: id }));
    v.currentTime = 0;
    // Call play() synchronously inside the tap so iOS Safari treats both as user-initiated; seek once audio has data.
    const pv = v.play();
    if (a) {
      const seek = () => { if (Math.abs(a.currentTime - hookStart) > 0.3) a.currentTime = hookStart; };
      if (a.readyState >= 1) seek(); else a.addEventListener('loadedmetadata', seek, { once: true });
      const pa = a.play();
      Promise.all([pv, pa]).then(() => { seek(); v.currentTime = 0; setPlaying(true); }).catch((e) => setDebug('play blocked: ' + (e as Error).name));
    } else pv.then(() => setPlaying(true)).catch((e) => setDebug('play blocked: ' + (e as Error).name));
  };

  // Loop the audio inside the hook window and show drift so device testing can report it.
  useEffect(() => {
    const a = audio.current, v = video.current;
    if (!a || !v) return;
    const tick = () => {
      if (a.currentTime >= hookEnd) { a.currentTime = hookStart; v.currentTime = 0; }
      setDebug(`audio ${a.currentTime.toFixed(2)}s (window ${hookStart}–${hookEnd}) · video ${v.currentTime.toFixed(2)}s · drift ${(a.currentTime - hookStart - v.currentTime).toFixed(2)}s`);
    };
    const onErr = () => setDebug('audio error ' + (a.error?.code ?? ''));
    a.addEventListener('timeupdate', tick);
    a.addEventListener('error', onErr);
    return () => { a.removeEventListener('timeupdate', tick); a.removeEventListener('error', onErr); };
  }, [hookStart, hookEnd]);

  return (
    <figure style={{ margin: 0, width: 240 }}>
      <div onClick={play} style={{ position: 'relative', width: 240, aspectRatio: '9 / 16', background: '#000', cursor: 'pointer', overflow: 'hidden' }}>
        <video ref={video} src={`/analyzer/pack-${pack}.mp4`} muted loop playsInline preload="auto" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <p style={{ position: 'absolute', top: 24, left: 12, right: 12, margin: 0, color: '#fff', fontWeight: 700, textAlign: 'center', textShadow: '0 1px 3px #000' }}>{hook}</p>
        {lyric && <p style={{ position: 'absolute', top: '48%', left: 12, right: 12, margin: 0, color: '#fff', fontStyle: 'italic', textAlign: 'center', textShadow: '0 1px 3px #000' }}>{lyric}</p>}
        <button type="button" style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }}>{playing ? 'pause' : 'play'}</button>
      </div>
      {deezerId ? <audio ref={audio} src={`/api/preview/${deezerId}`} preload="none" /> : null}
      <figcaption style={{ fontSize: 11 }}>
        {label} {deezerId ? '' : '(no preview audio)'}
        <br />
        <code>{debug}</code>
      </figcaption>
    </figure>
  );
}
