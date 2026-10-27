/* eslint-disable @next/next/no-img-element */
import { TOOLS } from '@/lib/data';

// clean frames from the packs themselves: graded footage, no lyrics or overlays
const REELS = ['midnight-city-2', 'golden-hour-3', 'coastal-drive-2'].map((n) => `/uploads/packs/${n}.webp`);

/** "What you actually download": a bento of the four things in the pack. */
export function Inside() {
  return (
    <section id="inside" className="section">
      <div className="inside">
        <div className="inside-head">
          <h2 className="h2">What you actually download.</h2>
          <p>One folder. Everything you need to post for a month, yours to keep.</p>
        </div>
        <div className="bento">
          <div className="bento-card videos">
            <div className="copy">
              <span className="stat">30<small>× MP4</small></span>
              <span className="t">Finished videos</span>
              <p>Hand-picked clips, colour graded and stitched into vertical edits. Silent, so your track becomes the audio.</p>
            </div>
            <div className="reels" aria-hidden="true">
              {REELS.map((src) => <img key={src} src={src} alt="" loading="lazy" decoding="async" />)}
            </div>
          </div>
          <div className="bento-card">
            <span className="stat">112<small>clips</small></span>
            <span className="t">Every raw clip</span>
          </div>
          <div className="bento-card">
            <span className="stat">24<small>pages</small></span>
            <span className="t">The posting playbook</span>
          </div>
          <div className="bento-card guides">
            <div className="copy">
              <span className="stat">9<small>guides</small></span>
              <span className="t">An editing guide for each tool</span>
            </div>
            <ul className="tool-grid">
              {TOOLS.map((t) => (
                <li className="tool" key={t.name}>
                  <img src={t.logo} alt="" loading="lazy" data-fallback="initial" />
                  <span className="initial">{t.name.charAt(0)}</span>
                  <span className="name">{t.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
