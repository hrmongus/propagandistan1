import { preload } from 'react-dom';
import { HERO_VIDEOS } from '@/lib/data';
import { config } from '@/lib/config';
import { posterFor } from '@/lib/media';
import { LazyVideo } from '../LazyVideo';

const SpotifyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1ED760" strokeWidth="2.6" strokeLinecap="round">
    <path d="M5 9.5c4.5-1.3 9.7-.8 13.8 1.6" />
    <path d="M6 13.3c3.7-1 8-.6 11.3 1.4" />
    <path d="M7 16.8c2.9-.8 6.2-.5 8.8 1.1" />
  </svg>
);

export function Hero() {
  // doubled so the -50% marquee loops seamlessly
  const items = [...HERO_VIDEOS, ...HERO_VIDEOS];
  // Posters are tiny and paint the reels before any video byte arrives; fetch them with the HTML.
  HERO_VIDEOS.forEach((v) => preload(posterFor(v.src), { as: 'image', fetchPriority: 'high' }));
  return (
    <section id="top" className="hero">
      <div className="hero-top">
        <span className="hero-pill">For independent artists stuck under 100k monthly listeners</span>
      </div>
      <div className="hero-reels">
        <div className="marquee-track hero-track" style={{ '--dur': `${config.heroSeconds}s` } as React.CSSProperties}>
          {items.map((v, i) => (
            <div className="reel-card" key={i} aria-hidden={i >= HERO_VIDEOS.length || undefined}>
              <div className="reel-frame">
                <LazyVideo src={v.src} priority={i < HERO_VIDEOS.length} />
                <div className="reel-views">
                  <span className="play-tri" />
                  {v.views} <span className="lbl">views</span>
                </div>
              </div>
              <div className="reel-stats">
                <div className="spotify-pill">
                  <span className="dot"><SpotifyIcon /></span>
                  {v.streams} Spotify streams
                </div>
                <span className="reel-conv">{v.conv} view-to-stream conversion</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-title-wrap">
          <h1 className="hero-title">Organic views that turn into streams. Ready in minutes.</h1>
        </div>
      </div>
      <div className="hero-bottom">
        <p className="hero-sub">
          30 finished videos, colour graded and silent by design. Drop them into Instagram or TikTok, attach your own track
          from the audio library, and post. Every view is a view of your song. You never appear in one of them.
        </p>
        <div className="hero-cta">
          <a href="#packs" className="btn btn-lg">Get the pack — $37</a>
          <span className="cta-note">Instant download · Commercial licence · 30-day money back</span>
        </div>
      </div>
    </section>
  );
}
