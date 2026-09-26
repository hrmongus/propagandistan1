import { Anatomy } from './Anatomy';
import { Compare } from './Compare';

const REASONS = [
  <>The platform doesn&apos;t check who you are. It checks whether people watch to the end, replay, and tap the audio.</>,
  <>A tight 8-second loop with a hook does that — at zero followers or a million.</>,
  <>The thing being consumed <span className="em">is the song</span>. Nobody enjoys the video and forgets what they were listening to.</>,
  <>The tap goes from the audio page straight to your catalogue.</>,
];

export function Bridge() {
  return (
    <section className="section">
      <div className="bridge-head">
        <div className="bridge-quote">
          <h2 className="h2">&quot;That works because it&apos;s a famous artist.&quot;</h2>
          <p>No. It works because the format is built for how short-form video is distributed.</p>
        </div>
        <div className="reasons">
          {REASONS.map((r, i) => (
            <div className="reason" key={i}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="pretty">{r}</span>
            </div>
          ))}
        </div>
      </div>
      <Anatomy />
      <Compare />
    </section>
  );
}
