import { InView } from '../InView';
import { Anatomy } from './Anatomy';
import { Compare } from './Compare';

/* ---------- one animated illustration per reason ---------- */

const STRANGERS = [[12, 22], [80, 14], [90, 58], [70, 86], [24, 82], [6, 54], [44, 6], [52, 92]];

/** 01: a zero-follower account whose clip still spreads to strangers. */
const Reach = () => (
  <div className="viz reach" aria-hidden="true">
    {[0, 1, 2].map((k) => <span key={k} className="ring" style={{ animationDelay: `${k * 0.9}s` }} />)}
    {STRANGERS.map(([x, y], k) => (
      <span key={k} className="who" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${0.3 + k * 0.28}s` }} />
    ))}
    <span className="me"><b>0</b> followers</span>
  </div>
);

// 30 days of posting: every day a little higher than the last
const DAYS = Array.from({ length: 30 }, (_, i) => 10 + Math.pow(i / 29, 1.5) * 82 + ((i * 37) % 11) - 5);

/** 02: thirty daily bars that keep climbing, next to the one spike a budget buys. */
const Channel = () => (
  <div className="viz channel" aria-hidden="true">
    <svg className="spike" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M0 96 L18 96 L22 18 L30 70 L40 92 L100 95" />
    </svg>
    <div className="bars">
      {DAYS.map((h, i) => <span key={i} style={{ height: `${h}%`, transitionDelay: `${i * 35}ms` }} />)}
    </div>
    <span className="lbl a">Paid spike</span>
    <span className="lbl b">Day 30</span>
  </div>
);

const EQ = Array.from({ length: 22 }, (_, i) => i);

/** 03: the song is the whole show — an equalizer and the one tap that matters. */
const Music = () => (
  <div className="viz music" aria-hidden="true">
    <div className="eq">
      {EQ.map((i) => <span key={i} style={{ animationDelay: `${-((i * 0.37) % 1.1)}s`, animationDuration: `${0.8 + ((i * 7) % 5) * 0.12}s` }} />)}
    </div>
    <span className="use">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18.5a3 3 0 1 1-2-2.8V5l12-2.5v12.5a3 3 0 1 1-2-2.8V6.6L9 8.2z" /></svg>
      Use this sound
    </span>
  </div>
);

const REASONS = [
  {
    t: 'The videos are shown to people who don’t follow you.',
    b: 'Instagram and TikTok push every clip into the feeds of strangers. That’s the default, not a reward for having an audience. A first post and a ten-thousandth post start the same way.',
    viz: <Reach />,
  },
  {
    t: 'You’re building a channel, not chasing a post.',
    b: 'Thirty clips over thirty days is a distribution channel you own. It doesn’t switch off when a budget runs out, and it’s still there for the next release, and the one after that.',
    viz: <Channel />,
  },
  {
    t: 'Music is the centrepiece, not background noise.',
    b: 'This isn’t a vlog with your song underneath it. There’s nothing else to watch. That’s why this format converts views into streams better than anything else you can post — people tap the audio because the audio is the point.',
    viz: <Music />,
  },
];

export function Bridge() {
  return (
    <section className="section">
      <div className="bridge-head">
        <h2 className="h2">Why this works at <span className="hl">zero followers</span>.</h2>
        <InView className="reasons">
          {REASONS.map((r, i) => (
            <div className="reason" key={r.t} style={{ '--i': i } as React.CSSProperties}>
              {r.viz}
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{r.t}</span>
              <p>{r.b}</p>
            </div>
          ))}
        </InView>
      </div>
      <Anatomy />
      <Compare />
    </section>
  );
}
