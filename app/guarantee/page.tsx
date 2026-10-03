import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBar } from '@/components/PageBar';

export const metadata: Metadata = {
  title: 'Money-back guarantee — FanpageKit',
  description: 'Post 20 of the 30 videos on TikTok within 30 days. If none of them reaches 1,000 views, you get a full refund and keep the pack.',
};

const EDITS = [
  'A text hook that’s relevant to the song.',
  'Your song’s audio, attached from TikTok’s sound library — not “original audio”.',
  'A lyric overlay or another visual engagement element.',
];

const CLAIM = [
  'Links to the 20 videos, or to the TikTok account you posted them from.',
  'The email address you used at checkout.',
];

export default function GuaranteePage() {
  return (
    <main className="page">
      <PageBar><span className="gdot" />Money-back guarantee</PageBar>
      <div className="rules">
        <div className="access-head">
          <span className="ok">30-day money back</span>
          <h1>Post 20. If none reaches 1,000 views, you get every cent back.</h1>
          <p>
            The format works when it&apos;s posted the way it&apos;s built. Do your part, and if it still doesn&apos;t
            work, we refund you in full — and you keep the pack.
          </p>
        </div>

        <h2 className="rules-h">The rules</h2>
        <ol className="rules-list">
          <li>
            <span className="n">01</span>
            <div>
              <span className="t">Post 20 of the 30 videos on TikTok</span>
              <p>All 20 have to go up within 30 days of your purchase.</p>
            </div>
          </li>
          <li>
            <span className="n">02</span>
            <div>
              <span className="t">Do the basic edits on every one of them</span>
              <ul className="edits">{EDITS.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          </li>
        </ol>

        <div className="rules-result">
          <span className="k">The result</span>
          <p>If <b>none</b> of those 20 videos gets 1,000 views, you get 100% of your money back. You keep the videos, the raw clips and the guides.</p>
        </div>

        <h2 className="rules-h">How to claim</h2>
        <div className="rules-claim">
          <p>Email <a href="mailto:hello@fanpagekit.com?subject=Guarantee%20claim">hello@fanpagekit.com</a> with:</p>
          <ul>
            {CLAIM.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="dim">That&apos;s it. No forms, no back-and-forth.</p>
        </div>

        <div className="rules-cta">
          <Link className="btn" href="/#packs">Get the pack — $37</Link>
          <Link className="cta-note" href="/">Back to FanpageKit</Link>
        </div>
      </div>
    </main>
  );
}
