'use client';

import { useEffect, useRef, useState, type Dispatch, type ReactNode } from 'react';
import {
  AESTHETICS, AGES, ARTIST_COUNT, ASSET, BLOCKERS, GENRES, FANPAGE_EXAMPLES, LANDING_AVATARS, DAILY_TIME, EXPERIENCE, GENDERS, LABEL_LOGOS, LANDING_FAQ, LIMITS,
  LISTENER_BRACKETS, LISTENER_SHORT, LISTENER_START, MOMENTS, PROOF, RELEASES, TRIED, aestheticById, goalsFor, type Option,
} from '@/lib/analyzer/config';
import type { SpotifyTrack } from '@/lib/analyzer/spotify';
import { GoalChart } from './charts';
import { Check, Chip, Footer, ICONS, Icon, Img, Logo, OptionCard, QHeader, Stars, Tick } from './ui';
import { PROGRESS, canContinue, type Action, type Answers, type ScreenId, type State } from './state';

export type ScreenProps = { state: State; dispatch: Dispatch<Action>; next: () => void; back: () => void };

const set = (dispatch: Dispatch<Action>, patch: Answers) => dispatch({ type: 'answer', patch });

/** Toggle `id` in a capped multi-select list (pick order is kept: it matters for aesthetics). */
function toggle<T extends string>(list: T[] | undefined, id: T, max: number): T[] {
  const cur = list ?? [];
  if (cur.includes(id)) return cur.filter((x) => x !== id);
  return cur.length >= max ? cur : [...cur, id];
}

/** Frame shared by the quiz screens: header with progress, content, sticky CTA. */
function QuizScreen({ id, back, children, footer, fit }: { id: ScreenId; back: () => void; children: ReactNode; footer: ReactNode; /** lock to one viewport, no scrolling */ fit?: boolean }) {
  const p = PROGRESS[id] ?? { pct: 0 };
  return (
    <div className={fit ? 'fpb-screen fit' : 'fpb-screen'}>
      <QHeader onBack={back} step={p.step} progress={p.pct} />
      <main className="fpb-main fpb-enter">{children}</main>
      {footer}
    </div>
  );
}

const NextBtn = ({ s, next, label = 'Next', signal }: { s: State; next: () => void; label?: string; signal?: boolean }) => (
  <Footer><button type="button" className={`fpb-btn ${signal ? 'signal' : 'primary'}`} disabled={!canContinue(s)} onClick={next}>{label}</button></Footer>
);

const Titles = ({ title, lede, overline }: { title: string; lede?: ReactNode; overline?: string }) => (
  <div className="fpb-titles">
    {overline && <span className="fpb-overline">{overline}</span>}
    <h2 className="fpb-h2">{title}</h2>
    {lede && <p className="fpb-lede">{lede}</p>}
  </div>
);

function SingleList<T extends string>({ options, value, onPick, smallIcon }: { options: Option<T>[]; value?: T; onPick: (id: T) => void; smallIcon?: boolean }) {
  return (
    <div className="fpb-options" role="radiogroup">
      {options.map((o) => <OptionCard key={o.id} label={o.label} sub={o.sub} icon={o.icon} smallIcon={smallIcon} selected={value === o.id} onClick={() => onPick(o.id)} />)}
    </div>
  );
}

/** Major-label logos (white on transparent) as an endless carousel; the list is doubled so the loop is seamless. */
function LabelLogos() {
  return (
    <div className="fpb-marquee" role="list" aria-label="Major labels">
      <div className="fpb-marquee-track">
        {[...LABEL_LOGOS, ...LABEL_LOGOS].map((l, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} role="listitem" src={l.src} alt={i < LABEL_LOGOS.length ? l.name : ''} aria-hidden={i >= LABEL_LOGOS.length || undefined} style={{ height: l.h, width: 'auto', display: 'block', flex: 'none' }} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 00 landing */

export function Landing({ state, dispatch, next }: ScreenProps) {
  const [open, setOpen] = useState<number | null>(null);
  const go = () => next();
  return (
    <div className="fpb-screen">
      <header className="fpb-top"><Logo /><span className="fpb-meta">FREE · 2 MIN</span></header>
      <main className="fpb-main" style={{ gap: 48, padding: '20px 20px 40px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex' }}>
              {LANDING_AVATARS.map((src, i) => (
                <Img key={src} src={src} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #000', marginLeft: i ? -10 : 0 }} />
              ))}
            </div>
            <span style={{ fontSize: 13, lineHeight: 1.3, color: 'var(--text-secondary)' }}>
              {ARTIST_COUNT ? <>Trusted by <span style={{ color: 'var(--text-primary)' }}>{ARTIST_COUNT}+ independent artists</span></> : <>Loved by <span style={{ color: 'var(--text-primary)' }}>independent artists</span></>}
            </span>
          </div>
          <h1 className="fpb-h1">Free Fanpage Blueprint Builder.</h1>
          <p style={{ margin: 0, maxWidth: 330, fontSize: 17, lineHeight: 1.45, color: 'var(--text-secondary)' }}>
            Get your track&apos;s <span style={{ color: 'var(--text-primary)' }}>Fanpage Fit Score</span> and a personal fan page plan in 2 minutes.
          </p>
        </section>

        <section aria-label="Step 1: find your track" className="fpb-card" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '22px 18px 18px', borderRadius: 28, border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-float)' }}>
          <div className="fpb-titles" style={{ gap: 8 }}>
            <span className="fpb-overline">STEP 1</span>
            <h2 style={{ margin: 0, font: '600 24px/1.1 var(--font-sans)', letterSpacing: '-0.03em' }}>Find your track.</h2>
            <p className="fpb-lede sm">Search a song or paste a Spotify link.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); go(); }}>
            <label className="fpb-field">
              <Icon d={ICONS.search} size={18} />
              <input type="text" value={state.query} onChange={(e) => dispatch({ type: 'query', query: e.target.value })} placeholder="Search a track or paste a Spotify link" aria-label="Search a track or paste a Spotify link" enterKeyHint="search" />
            </label>
          </form>
          <ul className="fpb-ticks">
            <li><Tick />We never store your audio or train AI on it</li>
            <li><Tick />Custom built for your track</li>
          </ul>
          <div className="fpb-hint"><Icon d={ICONS.link} size={16} style={{ marginTop: 1 }} /><span>Can&apos;t find your song? <b>Paste the Spotify track link</b> instead.</span></div>
          <button type="button" className="fpb-btn signal" onClick={go}>Build my Blueprint</button>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Used by all major labels</span>
          <LabelLogos />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <h2 style={{ margin: 0, textAlign: 'center', font: '600 28px/1.06 var(--font-sans)', letterSpacing: '-0.035em' }}>How it works.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { i: ICONS.note, t: '1. Select your track', b: 'Search it or paste the Spotify link. Your music stays private.' },
              { i: ICONS.target, t: '2. Answer target audience and goal questions', b: 'Tell us who should hear your song and where you want to be in 6 months.' },
              { i: ICONS.gauge, t: '3. Get your free Blueprint and Fanpage Fit Score', b: '3 fan page concepts, hooks written for your song, and a 6-month growth plan.' },
            ].map((x) => (
              <div key={x.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 20, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(34,212,107,.12)', color: 'var(--signal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={x.i} size={20} stroke={2.2} /></span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ font: '600 16px/1.25 var(--font-sans)' }}>{x.t}</span><span style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--text-secondary)' }}>{x.b}</span></span>
              </div>
            ))}
          </div>
        </section>

        <section className="fpb-faq">
          {LANDING_FAQ.map((f, i) => (
            <div className="fpb-faq-item" key={f.q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}><span style={{ flex: 1 }}>{f.q}</span><Icon d={ICONS.chevron} size={16} stroke={2.2} /></button>
              {open === i && <p>{f.a}</p>}
            </div>
          ))}
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button type="button" className="fpb-btn primary" onClick={go}>Build my free Blueprint</button>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Free. No login. Works with any song on Spotify.</span>
        </section>
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- 01 search */

const isLink = (q: string) => /open\.spotify\.com\/|^spotify:track:/.test(q.trim());
const year = (d: string | null) => (d ? d.slice(0, 4) : '');

export function Search({ state, dispatch, next, back }: ScreenProps) {
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');
  const q = state.query;
  const seq = useRef(0);

  const term = q.trim();
  const active = term.length >= 2;
  useEffect(() => {
    if (!active) { seq.current++; return; }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setStatus('loading');
      try {
        const res = await fetch(isLink(term) ? `/api/spotify/track?url=${encodeURIComponent(term)}` : `/api/spotify/search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (mine !== seq.current) return;
        const list: SpotifyTrack[] = data.track ? [data.track] : data.tracks ?? [];
        setResults(list.slice(0, 6));
        setStatus(res.ok ? (list.length ? 'idle' : 'empty') : res.status === 404 || res.status === 400 ? 'empty' : 'error');
      } catch {
        if (mine === seq.current) setStatus('error');
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term, active]);

  // Keep the picked track visible even when it isn't in the current results.
  const list = active ? results : [];
  const shown = state.track && !list.some((r) => r.id === state.track!.id) ? [state.track, ...list] : list;
  const shownStatus = active ? status : 'idle';

  return (
    <div className="fpb-screen">
      <header className="fpb-top">
        <button type="button" className="fpb-back" aria-label="Back" onClick={back}><Icon d={ICONS.back} /></button>
        <Logo /><span className="fpb-meta">FREE · 2 MIN</span>
      </header>
      <main className="fpb-main fpb-enter" style={{ gap: 24, paddingTop: 20 }}>
        <div className="fpb-titles" style={{ gap: 14 }}>
          <span className="fpb-overline">FAN PAGE STRATEGY BUILDER</span>
          <h1 style={{ margin: 0, font: '600 36px/1.02 var(--font-sans)', letterSpacing: '-0.04em' }}>See how far your track can go with faceless fan pages.</h1>
          <p className="fpb-lede">Search your song on Spotify. We build <b>your personal fan page strategy</b> around it.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="fpb-field" style={{ height: 48, boxShadow: '0 0 0 1px var(--border-subtle)' }}>
            <input autoFocus type="text" value={q} onChange={(e) => dispatch({ type: 'query', query: e.target.value })} placeholder="Search your song or artist name" aria-label="Search your song" enterKeyHint="search" />
            {shownStatus === 'loading' && <span className="fpb-anim-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--ink-400)', borderTopColor: 'var(--signal-500)', flex: 'none' }} />}
          </label>
          <div role="radiogroup" aria-label="Search results" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shown.map((t) => {
              const on = state.track?.id === t.id;
              return (
                <button key={t.id} type="button" role="radio" aria-checked={on} className="fpb-result" onClick={() => dispatch({ type: 'track', track: on ? null : t })}>
                  <Img src={t.artworkUrl} className="art" />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="fpb-ellipsis" style={{ font: '600 16px/1.2 var(--font-sans)', letterSpacing: '-0.01em' }}>{t.title}</span>
                    <span className="fpb-ellipsis" style={{ fontSize: 13, lineHeight: 1.2, color: 'var(--text-secondary)' }}>{t.artists.join(', ')}{year(t.releaseDate) && ` · ${year(t.releaseDate)}`}</span>
                  </span>
                  {on && <Check on />}
                </button>
              );
            })}
          </div>
          {shownStatus === 'empty' && <p className="fpb-lede sm">No match. Try the artist name, or paste the Spotify track link.</p>}
          {shownStatus === 'error' && <p className="fpb-lede sm">Search is unavailable right now. Paste the Spotify track link, or try again in a moment.</p>}
          {/* "Not on Spotify yet? Upload an MP3": hidden in v1 (no audio analysis). */}
        </div>
      </main>
      <Footer ruled>
        <button type="button" className="fpb-btn signal" disabled={!state.track} onClick={next}>Analyze my track</button>
        <p className="fpb-fine">Free. No login. Works with any song on Spotify.</p>
      </Footer>
    </div>
  );
}

/* ---------------------------------------------------------------- 02 listeners */

function TrackPill({ track }: { track: SpotifyTrack | null }) {
  if (!track) return null;
  return (
    <div className="fpb-trackpill">
      <Img src={track.artworkUrl} className="art" />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span className="fpb-ellipsis" style={{ font: '600 14px/1.2 var(--font-sans)' }}>{track.title}</span>
        <span className="fpb-ellipsis" style={{ fontSize: 12, lineHeight: 1.2, color: 'var(--text-tertiary)' }}>{track.artists.join(', ')}</span>
      </span>
      <span className="fpb-live">ANALYZING</span>
    </div>
  );
}

export function Genre({ state, dispatch, next, back }: ScreenProps) {
  const v = state.answers.genre;
  return (
    <QuizScreen id="genre" back={back} footer={<NextBtn s={state} next={next} />}>
      <TrackPill track={state.track} />
      <Titles title="What genre is your music?" lede="Pick the closest one." />
      <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
        {GENRES.map((g) => (
          <button key={g.id} type="button" role="radio" aria-checked={v === g.id} onClick={() => set(dispatch, { genre: g.id })} className="fpb-opt compact" style={{ minHeight: 48, padding: '0 10px', gap: 10, borderRadius: 14 }}>
            <span className="ico" style={{ width: 28, height: 28, borderRadius: 8 }}><Icon d={g.icon!} size={16} /></span>
            <span className="txt"><span className="t" style={{ fontSize: 14, lineHeight: 1.15 }}>{g.label}</span></span>
          </button>
        ))}
      </div>
    </QuizScreen>
  );
}

export function Listeners({ state, dispatch, next, back }: ScreenProps) {
  return (
    <QuizScreen id="listeners" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="Where are you right now?" lede="Your current monthly listeners on Spotify." />
      <SingleList options={LISTENER_BRACKETS} value={state.answers.listeners} onPick={(id) => set(dispatch, { listeners: id })} />
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 03 did you know */

const LAUREL = '<path d="M34 88 C12 74 6 40 22 4" fill="none" stroke="#F0DEA8" stroke-width="1.8" stroke-linecap="round"/>' +
  [[22, 81, -55, 3.4, 7], [14, 68, -40, 3.4, 7], [9, 55, -25, 3.4, 7], [7, 42, -12, 3.4, 7], [9, 29, 0, 3.4, 7], [13, 17, 12, 3.2, 6.5], [32, 76, 35, 3.2, 6.5], [24, 62, 30, 3.2, 6.5], [20, 48, 25, 3.2, 6.5], [20, 34, 25, 3.2, 6.5], [23, 20, 30, 3, 6], [22, 6, 10, 2.8, 5]]
    .map(([x, y, r, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="#F0DEA8"/>`).join('');

export function DidYouKnow({ back, next }: ScreenProps) {
  return (
    <QuizScreen id="did-you-know" back={back} footer={<Footer><button type="button" className="fpb-btn primary" onClick={next}>Continue</button></Footer>}>
      <section aria-label="Faceless fan pages: the number one organic music marketing method of 2026" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 18px 24px', borderRadius: 28, overflow: 'hidden', background: 'radial-gradient(120% 75% at 50% 32%, #D4B466 0%, #B58E3E 38%, #8C6B28 70%, #5C4415 100%)', textAlign: 'center' }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-30%', width: '160%', top: -232, height: 270, borderRadius: '50%', background: 'linear-gradient(180deg, #46330F 0%, #7A5C22 100%)', borderBottom: '2px solid rgba(240,218,150,0.7)', boxShadow: '0 6px 18px rgba(225,190,105,0.3)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
          <svg width="28" height="63" viewBox="0 0 40 90" aria-hidden="true" style={{ flex: 'none' }} dangerouslySetInnerHTML={{ __html: LAUREL }} />
          <h2 style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#2a1d06', font: '500 24px/1.12 var(--font-sans)', letterSpacing: '-0.02em' }}>
            <span>#1 Organic Music</span><span>Marketing Method</span>
          </h2>
          <svg width="28" height="63" viewBox="0 0 40 90" aria-hidden="true" style={{ flex: 'none', transform: 'scaleX(-1)' }} dangerouslySetInnerHTML={{ __html: LAUREL }} />
        </div>
        <span style={{ position: 'relative', marginTop: -10, font: '500 13px/1.2 var(--font-sans)', color: 'rgba(42,29,6,0.8)' }}>2026 · Faceless fan pages</span>
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none" role="img" aria-label="Music" style={{ position: 'relative', flex: 'none', filter: 'drop-shadow(0 22px 24px rgba(5,10,40,0.55))' }}>
          <defs>
            <linearGradient id="fpb-mtl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F3E4B4" /><stop offset="0.2" stopColor="#D6BA70" /><stop offset="0.42" stopColor="#98782F" /><stop offset="0.58" stopColor="#E6D194" /><stop offset="0.8" stopColor="#AD8C3F" /><stop offset="1" stopColor="#6E5420" /></linearGradient>
            <linearGradient id="fpb-mtl2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
          </defs>
          <rect x="2" y="2" width="92" height="92" rx="26" fill="url(#fpb-mtl)" stroke="#EEDCA2" strokeWidth="2" />
          <rect x="4" y="4" width="88" height="44" rx="24" fill="url(#fpb-mtl2)" />
          <g transform="translate(0 1.5)" opacity="0.7" stroke="#fff" fill="#fff"><path d="M40 66V34l24-6v32" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx="33" cy="67" r="8" stroke="none" /><circle cx="57" cy="61" r="8" stroke="none" /></g>
          <g stroke="#000" fill="#000"><path d="M40 66V34l24-6v32" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx="33" cy="67" r="8" stroke="none" /><circle cx="57" cy="61" r="8" stroke="none" /></g>
        </svg>
      </section>
      <p style={{ margin: '6px auto 0', maxWidth: 290, fontSize: 15, lineHeight: 1.5, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Major labels run fan page networks for their biggest releases. <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>New audiences, every day.</span>
      </p>
      <span className="fpb-meta" style={{ alignSelf: 'center' }}>USED BY</span>
      <LabelLogos />
      <p className="fpb-lede sm">Keep going. A few more questions and your strategy is ready.</p>
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 04 goal */

export function Goal({ state, dispatch, next, back }: ScreenProps) {
  const options = goalsFor(state.answers.listeners);
  const picked = options.find((g) => g.id === state.answers.goal);
  return (
    <QuizScreen id="goal" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="Your goal in 6 months?" />
      <GoalChart start={LISTENER_START[state.answers.listeners ?? 'lt1k']} today={state.answers.listeners ? LISTENER_SHORT[state.answers.listeners] : '—'} goal={picked?.short ?? null} goalValue={picked?.value ?? 0} />
      <SingleList options={options} value={state.answers.goal} onPick={(id) => set(dispatch, { goal: id })} />
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 05 blocker */

export function Blocker({ state, dispatch, next, back }: ScreenProps) {
  const v = state.answers.blocker;
  return (
    <QuizScreen id="blocker" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="What's holding your music back the most?" lede="Pick the one that hits hardest." />
      <div className="fpb-options" role="radiogroup">
        {BLOCKERS.map((o) => (
          <div key={o.id} className={v === o.id ? 'fpb-opt-wrap on' : 'fpb-opt-wrap'}>
            <OptionCard label={o.label} icon={o.icon} selected={v === o.id} onClick={() => set(dispatch, { blocker: o.id })} />
          </div>
        ))}
      </div>
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 06 how it works */

const LAYERS = [
  { t: 'Relatable hook', s: 'Stops the scroll in the first second' },
  { t: 'Your lyrics', s: 'A line from your track. Puts the focus on the song' },
  { t: 'Background video', s: 'Creates the emotion' },
  { t: 'Your track', s: 'Attached as the audio. One tap to stream' },
];

/** Where each numbered marker sits on the example video (percent of the phone screen). */
const MARKERS: React.CSSProperties[] = [
  { top: '15.5%', left: '1.5%' }, // 1: POV hook at the top of the video
  { top: '41%', left: '9%' },     // 2: lyric line in the middle of the clip
  { top: '29%', right: '19%' },   // 3: the footage itself
  { bottom: '1.6%', left: '3%' },  // 4: the sound row (song attached as audio)
];

const TT = {
  heart: '<path d="M12 21s-8.5-5.4-10.2-10.6C.6 6.6 3 3.5 6.4 3.5c2.1 0 3.9 1.1 5.6 3.2 1.7-2.1 3.5-3.2 5.6-3.2 3.4 0 5.8 3.1 4.6 6.9C20.5 15.6 12 21 12 21z"/>',
  comment: '<path d="M12 3C6.5 3 2 6.7 2 11.3c0 2.6 1.4 4.9 3.7 6.4-.2 1.3-.9 2.6-2 3.6 2.3-.1 4.2-.9 5.6-2 .9.2 1.8.3 2.7.3 5.5 0 10-3.7 10-8.3S17.5 3 12 3z"/>',
  bookmark: '<path d="M6 2.5h12a1.5 1.5 0 0 1 1.5 1.5v17.5L12 16.8l-7.5 4.7V4A1.5 1.5 0 0 1 6 2.5z"/>',
  share: '<path d="M13.5 4.5 22 12l-8.5 7.5v-4.3c-5.4 0-9 1.6-11.5 5.3 1-5.6 4.1-10.7 11.5-11.6z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6.5v-6h-5v6H3z"/>',
  friends: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.5 2.7 3.5 5.5"/>',
  inbox: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
};

const PHONE_W = 276, PHONE_H = 566;

/** A short-form app "For You" screen: example post video with the familiar overlay (no app logos). */
function PhoneMock({ handle, sound, revealed, active }: { handle: string; sound: string; revealed: number; active: number }) {
  const rail = (d: string, label: string, filled = true) => (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width="27" height="27" viewBox="0 0 24 24" fill={filled ? '#fff' : 'none'} stroke={filled ? 'none' : '#fff'} strokeWidth="2" aria-hidden="true" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))' }} dangerouslySetInnerHTML={{ __html: d }} />
      <span style={{ font: '600 10px/1 var(--font-sans)', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{label}</span>
    </span>
  );
  const nav = (d: string, label: string, on = false) => (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, color: on ? '#fff' : 'rgba(255,255,255,.62)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? '#fff' : 'none'} stroke="currentColor" strokeWidth={on ? 0 : 1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
      <span style={{ font: '500 8.5px/1 var(--font-sans)' }}>{label}</span>
    </span>
  );
  return (
    <div style={{ position: 'relative', width: PHONE_W, height: PHONE_H, borderRadius: 38, padding: 7, background: '#1C1C1F', boxShadow: 'var(--shadow-float), 0 0 0 1px rgba(255,255,255,.08)', flex: 'none' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 31, overflow: 'hidden', background: '#000', display: 'flex', flexDirection: 'column' }}>
        {/* video area: the example post, 9:16 */}
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <video src={ASSET('video/how-it-works.mp4')} poster={ASSET('video/how-it-works.jpg')} autoPlay muted loop playsInline preload="auto"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} aria-label="Example fan page post" />
          {/* status bar */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 9, left: 20, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', font: '600 12px/1 var(--font-sans)' }}>
            <span>9:41</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="16" height="11" viewBox="0 0 16 11" fill="#fff"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.3" y="5" width="3" height="6" rx="1"/><rect x="8.6" y="2.5" width="3" height="8.5" rx="1"/><rect x="12.9" y="0" width="3" height="11" rx="1"/></svg>
              <svg width="15" height="11" viewBox="0 0 24 17" fill="#fff"><path d="M12 3.5c3.6 0 6.9 1.4 9.4 3.7l1.8-1.9A16 16 0 0 0 12 1 16 16 0 0 0 .8 5.3l1.8 1.9A13.4 13.4 0 0 1 12 3.5zm0 5c2.3 0 4.4.9 6 2.4l1.8-1.9A11 11 0 0 0 12 6a11 11 0 0 0-7.8 3l1.8 1.9c1.6-1.5 3.7-2.4 6-2.4zm0 5c1 0 1.9.4 2.6 1L12 17l-2.6-2.5c.7-.6 1.6-1 2.6-1z"/></svg>
              <svg width="24" height="11" viewBox="0 0 26 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3" stroke="#fff" strokeOpacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.8" fill="#fff"/><rect x="23.5" y="4" width="1.8" height="4" rx="1" fill="#fff" fillOpacity=".5"/></svg>
            </span>
          </div>
          {/* top tabs */}
          <div style={{ position: 'absolute', top: 34, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, font: '600 13px/1 var(--font-sans)', textShadow: '0 1px 2px rgba(0,0,0,.4)' }}>
            <span style={{ color: 'rgba(255,255,255,.62)' }}>Following</span>
            <span style={{ color: '#fff', position: 'relative' }}>For You<span style={{ position: 'absolute', left: '50%', bottom: -7, width: 22, height: 2.5, marginLeft: -11, borderRadius: 2, background: '#fff' }} /></span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', right: 12 }} dangerouslySetInnerHTML={{ __html: TT.search }} />
          </div>
          {/* right rail */}
          <div style={{ position: 'absolute', right: 7, bottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13 }}>
            <span style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{ display: 'block', width: 38, height: 38, borderRadius: '50%', border: '1.5px solid #fff', background: 'linear-gradient(135deg,#4a4a4f,#1c1c1f)' }} />
              <span style={{ position: 'absolute', left: '50%', bottom: -8, width: 17, height: 17, marginLeft: -8.5, borderRadius: '50%', background: '#FE2C55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px/1 var(--font-sans)' }}>+</span>
            </span>
            {rail(TT.heart, '48.2K')}
            {rail(TT.comment, '1,204')}
            {rail(TT.bookmark, '8,903')}
            {rail(TT.share, 'Share')}
            <span className="fpb-spin-slow" style={{ width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle, #555 0 22%, #111 23% 100%)', border: '6px solid #2a2a2e', marginTop: 2 }} />
          </div>
          {/* caption + sound */}
          <div style={{ position: 'absolute', left: 11, right: 60, bottom: 14, display: 'flex', flexDirection: 'column', gap: 6, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>
            <span style={{ font: '700 13.5px/1.2 var(--font-sans)' }}>@{handle}</span>
            <span style={{ font: '400 12px/1.3 var(--font-sans)' }}>this one hits different at 2am <span style={{ fontWeight: 600 }}>#fyp</span></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: '500 12px/1.2 var(--font-sans)', minWidth: 0, paddingLeft: 26 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" aria-hidden="true" style={{ flex: 'none' }} dangerouslySetInnerHTML={{ __html: TT.note }} />
              <span className="fpb-ellipsis">{sound}</span>
            </span>
          </div>
          {/* numbered markers */}
          {MARKERS.map((pos, i) => (
            <span key={i} aria-hidden="true" style={{
              position: 'absolute', ...pos, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: '700 12px/1 var(--font-mono)', background: 'var(--signal-500)', color: 'var(--signal-ink)',
              boxShadow: active === i ? '0 0 0 4px rgba(34,212,107,.35), 0 2px 8px rgba(0,0,0,.5)' : '0 2px 8px rgba(0,0,0,.5)',
              opacity: i < revealed ? 1 : 0, transform: i < revealed ? 'scale(1)' : 'scale(.4)', transition: 'opacity 320ms var(--ease-out), transform 420ms var(--ease-out), box-shadow 280ms',
            }}>{i + 1}</span>
          ))}
        </div>
        {/* bottom nav */}
        <div style={{ height: 50, flex: 'none', display: 'flex', alignItems: 'center', padding: '0 4px 4px', background: '#000', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {nav(TT.home, 'Home', true)}
          {nav(TT.friends, 'Friends')}
          <span style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ position: 'relative', width: 40, height: 26 }}>
              <span style={{ position: 'absolute', inset: 0, left: -3, right: 3, borderRadius: 8, background: '#25F4EE' }} />
              <span style={{ position: 'absolute', inset: 0, left: 3, right: -3, borderRadius: 8, background: '#FE2C55' }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 20px/1 var(--font-sans)' }}>+</span>
            </span>
          </span>
          {nav(TT.inbox, 'Inbox')}
          {nav(TT.profile, 'Profile')}
        </div>
      </div>
    </div>
  );
}

/** Scales the phone mock down to whatever height is left between the headline, the bubble and the Next button. */
function FitPhone({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setK(Math.min(1, el.clientHeight / PHONE_H, el.clientWidth / PHONE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: PHONE_W * k, height: PHONE_H * k, opacity: k ? 1 : 0 }}>
        <div style={{ transform: `scale(${k})`, transformOrigin: 'top left', width: PHONE_W, height: PHONE_H }}>{children}</div>
      </div>
    </div>
  );
}

export function HowItWorks({ state, back, next }: ScreenProps) {
  // Markers appear one by one; a single explanation bubble shows the current one and is replaced by the next.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = setInterval(() => setTick((n) => n + 1), reduce ? 3000 : 2400);
    return () => clearInterval(t);
  }, []);
  const revealed = Math.min(4, tick + 1);
  const active = tick % 4;
  const l = LAYERS[active];
  const first = aestheticById(state.answers.aesthetics?.[0] ?? '');
  const sound = state.track ? `${state.track.title} - ${state.track.artists[0]}` : 'Your track - You';
  return (
    <QuizScreen id="how-it-works" fit back={back} footer={<Footer><button type="button" className="fpb-btn primary" onClick={next}>Next</button></Footer>}>
      <Titles title="Faceless content puts music first" />
      <FitPhone><PhoneMock handle={first?.handle ?? 'goldenhour.library'} sound={sound} revealed={revealed} active={active} /></FitPhone>
      <div aria-live="polite" style={{ flex: 'none' }}>
        <div key={active} className="fpb-enter" style={{
          display: 'flex', gap: 10, padding: '11px 14px', borderRadius: 14, alignItems: 'center',
          border: '1px solid rgba(34,212,107,.45)', background: 'rgba(34,212,107,.08)',
        }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--signal-500)', color: 'var(--signal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px/1 var(--font-mono)', flex: 'none' }}>{active + 1}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
            <span style={{ font: '600 14px/1.2 var(--font-sans)' }}>{l.t}</span>
            <span style={{ fontSize: 12, lineHeight: 1.35, color: 'var(--text-secondary)' }}>{l.s}</span>
          </span>
        </div>
      </div>
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 07 aesthetics */

export function Aesthetics({ state, dispatch, next, back }: ScreenProps) {
  const picks = state.answers.aesthetics ?? [];
  const names = picks.map((id) => aestheticById(id)?.name).filter(Boolean).join(' · ');
  return (
    <QuizScreen id="aesthetics" back={back} footer={
      <Footer ruled>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
          <div style={{ display: 'flex' }}>
            {picks.map((id, i) => <Img key={id} src={aestheticById(id)?.images[0]} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #000', marginLeft: i ? -10 : 0 }} />)}
          </div>
          <span className="fpb-ellipsis" style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.3, color: 'var(--text-secondary)' }}>{names || 'Pick up to 3. Your first pick leads.'}</span>
        </div>
        <button type="button" className="fpb-btn primary" disabled={!canContinue(state)} onClick={next}>{picks.length ? `Next · ${picks.length} of 3 selected` : 'Next'}</button>
      </Footer>
    }>
      <Titles title="Which aesthetics fit your song?" lede={<>Pick up to 3. <b>Each one can become its own fan page.</b> Your first pick leads.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {AESTHETICS.map((a) => {
          const order = picks.indexOf(a.id);
          const on = order >= 0;
          const full = !on && picks.length >= LIMITS.aesthetics;
          return (
            <button key={a.id} type="button" role="checkbox" aria-checked={on} aria-disabled={full} aria-label={`${a.name}${on ? `, pick ${order + 1}` : ''}`}
              onClick={() => !full && set(dispatch, { aesthetics: toggle(picks, a.id, LIMITS.aesthetics) })}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, borderRadius: 20, border: on ? '1.5px solid var(--signal-500)' : '1px solid var(--border-subtle)', background: on ? 'rgba(34,212,107,.10)' : 'var(--surface-card)', textAlign: 'left', cursor: full ? 'not-allowed' : 'pointer', minWidth: 0, transition: 'background 280ms' }}>
              <span style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 3, height: 150, borderRadius: 14, overflow: 'hidden', width: '100%' }}>
                <Img src={a.images[0]} style={{ gridRow: '1 / 3', width: '100%', height: '100%' }} />
                <Img src={a.images[1]} style={{ width: '100%', height: '100%' }} />
                <Img src={a.images[2]} style={{ width: '100%', height: '100%' }} />
                {on ? (
                  <span style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--signal-500)', color: 'var(--signal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px/1 var(--font-mono)' }}>{order + 1}</span>
                ) : (
                  <span style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #fff', background: 'rgba(0,0,0,0.3)' }} />
                )}
              </span>
              <span style={{ padding: '0 4px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: '600 14px/1.2 var(--font-sans)' }}>{a.name}</span>
                <span style={{ font: '400 10.5px/1.35 var(--font-mono)', color: on ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>{a.genres}</span>
              </span>
            </button>
          );
        })}
      </div>
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 08 audience */

export function Audience({ state, dispatch, next, back }: ScreenProps) {
  const a = state.answers;
  return (
    <QuizScreen id="audience" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="Who should hear this song?" lede="Describe your ideal listener. We aim each fan page at them." />
      <section className="fpb-section">
        <div className="fpb-section-h"><h3>Age</h3><span className="fpb-count" style={{ width: 'auto' }}>UP TO 2</span></div>
        <div className="fpb-chips">
          {AGES.map((o) => <Chip key={o.id} label={o.label} selected={!!a.age?.includes(o.id)} disabled={(a.age?.length ?? 0) >= LIMITS.age} onClick={() => set(dispatch, { age: toggle(a.age, o.id, LIMITS.age) })} />)}
        </div>
      </section>
      <section className="fpb-section">
        <div className="fpb-section-h"><h3>Gender</h3></div>
        <div className="fpb-seg" role="radiogroup" aria-label="Gender">
          {GENDERS.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={a.gender === o.id} onClick={() => set(dispatch, { gender: o.id })}>
              <Icon d={o.icon!} size={16} />{o.label}
            </button>
          ))}
        </div>
      </section>
      <section className="fpb-section">
        <div className="fpb-section-h"><h3>When should your song hit?</h3><span className="fpb-count" style={{ width: 'auto' }}>UP TO 3</span></div>
        <div className="fpb-chips grid3">
          {MOMENTS.map((m) => <Chip key={m.id} label={m.label} icon={m.icon} selected={!!a.moments?.includes(m.id)} disabled={(a.moments?.length ?? 0) >= LIMITS.moments} onClick={() => set(dispatch, { moments: toggle(a.moments, m.id, LIMITS.moments) })} />)}
        </div>
      </section>
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 09 several pages */

const CARD_W = 300, CARD_H = 470;

const TTI = {
  back: '<path d="m15 18-6-6 6-6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/>',
  share: '<path d="M13.5 4.5 21 12l-7.5 7.5v-4c-5 0-8.3 1.4-10.5 4.8.9-5 3.7-9.6 10.5-10.5z"/>',
  dm: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m21 3-11 10"/>',
  grid: '<path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z"/>',
  repost: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  heartLock: '<path d="M12 20s-7-4.4-8.6-8.7C2.4 8.2 4.4 5.5 7.2 5.5c1.8 0 3.3.9 4.8 2.7 1.5-1.8 3-2.7 4.8-2.7 2.8 0 4.8 2.7 3.8 5.8"/><rect x="15" y="15" width="7" height="6" rx="1"/><path d="M16.5 15v-1.5a2 2 0 0 1 4 0V15"/>',
};

/** One fan page as a short-video app profile: top bar, avatar, stats, buttons, tabs and the real post grid. */
function ProfileCard({ p }: { p: (typeof FANPAGE_EXAMPLES)[number] }) {
  const ic = (d: string, size = 18, sw = 2) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />;
  const stat = (n: string, l: string) => (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 56 }}>
      <b style={{ font: '700 15px/1 var(--font-sans)' }}>{n}</b>
      <span style={{ font: '400 11px/1 var(--font-sans)', color: 'rgba(255,255,255,.6)' }}>{l}</span>
    </span>
  );
  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 22, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,.12)', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 6px' }}>
        {ic(TTI.back, 20, 2.4)}
        <span style={{ font: '700 14px/1 var(--font-sans)' }}>{p.name}</span>
        <span style={{ display: 'flex', gap: 12 }}>{ic(TTI.bell)}{ic(TTI.share)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 12px 10px' }}>
        <Img src={p.avatar} style={{ width: 64, height: 64, borderRadius: '50%' }} />
        <span style={{ font: '600 13.5px/1 var(--font-sans)' }}>@{p.handle}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {stat(p.following, 'Following')}<span style={{ width: 1, height: 12, background: 'rgba(255,255,255,.18)' }} />
          {stat(p.followers, 'Followers')}<span style={{ width: 1, height: 12, background: 'rgba(255,255,255,.18)' }} />
          {stat(p.likes, 'Likes')}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ width: 128, height: 34, borderRadius: 6, background: '#FE2C55', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 14px/1 var(--font-sans)' }}>Follow</span>
          <span style={{ width: 40, height: 34, borderRadius: 6, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic(TTI.dm, 17)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        {[TTI.grid, TTI.repost, TTI.heartLock].map((d, i) => (
          <span key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '7px 0 8px', color: i ? 'rgba(255,255,255,.45)' : '#fff', borderBottom: i ? '2px solid transparent' : '2px solid #fff' }}>{ic(d, 18, i ? 2 : 1.6)}</span>
        ))}
      </div>
      {/* the real post grid (screenshot), cropped to the top rows */}
      <div style={{ flex: 1, minHeight: 0, backgroundImage: `url("${p.grid}")`, backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundColor: '#111' }} role="img" aria-label={`Posts from @${p.handle}`} />
    </div>
  );
}

/**
 * Continuous slow drift for a horizontal carousel whose items are rendered twice: scrolls ~speed px per frame and
 * wraps at the halfway point, so it loops forever. Holding a finger (or mouse) on it pauses it; after letting go,
 * swiping or using the wheel it resumes from wherever the user left it after `resumeMs`.
 */
function useDrift(ref: React.RefObject<HTMLDivElement | null>, speed = 0.35, resumeMs = 2500) {
  const held = useRef(false);
  const resumeAt = useRef(0);
  const pos = useRef(-1);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(64, t - last) : 16; last = t;
      if (held.current || t < resumeAt.current) { pos.current = -1; return; }
      const half = el.scrollWidth / 2;
      if (half <= el.clientWidth) return;
      if (pos.current < 0) pos.current = el.scrollLeft;
      pos.current += speed * (dt / 16.7);
      if (pos.current >= half) pos.current -= half;
      el.scrollLeft = pos.current;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, speed]);
  const later = () => { resumeAt.current = performance.now() + resumeMs; };
  return {
    onPointerDown: () => { held.current = true; },
    onPointerUp: () => { held.current = false; later(); },
    onPointerCancel: () => { held.current = false; later(); },
    onPointerLeave: () => { if (held.current) { held.current = false; later(); } },
    onWheel: later,
    onTouchMove: later,
  };
}

/** Row of profile cards, scaled to the space left on the screen, drifting slowly in an endless loop. */
function PageCarousel() {
  const box = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setK(Math.min(0.82, (el.clientHeight / CARD_H) * 0.9));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const drift = useDrift(row, 0.4);
  const w = CARD_W * k;
  return (
    <div ref={box} style={{ flex: 1, minHeight: 0, margin: '0 -20px', display: 'flex', alignItems: 'center' }}>
      <div ref={row} {...drift} className="fpb-carousel" aria-label="Example fan pages" style={{ width: '100%', alignItems: 'center', gap: 12, padding: '0 20px', scrollSnapType: 'none', opacity: k ? 1 : 0 }}>
        {[...FANPAGE_EXAMPLES, ...FANPAGE_EXAMPLES].map((p, i) => (
          <div key={i} aria-hidden={i >= FANPAGE_EXAMPLES.length || undefined} style={{ flex: 'none', width: w, height: CARD_H * k, userSelect: 'none', WebkitTouchCallout: 'none' }}>
            <div style={{ transform: `scale(${k})`, transformOrigin: 'top left', width: CARD_W, height: CARD_H }}><ProfileCard p={p} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeveralPages({ back, next }: ScreenProps) {
  return (
    <QuizScreen id="several-pages" fit back={back} footer={<Footer><button type="button" className="fpb-btn primary" onClick={next}>Continue</button></Footer>}>
      <Titles overline="WHAT FAN PAGES LOOK LIKE" title="Real pages. Real followers." />
      <PageCarousel />
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 10 tried */

export function Tried({ state, dispatch, next, back }: ScreenProps) {
  const cur = state.answers.tried ?? [];
  const pick = (id: (typeof TRIED)[number]['id']) => {
    // "Nothing yet" clears the others; picking anything else clears "Nothing yet".
    if (id === 'nothing') return set(dispatch, { tried: cur.includes('nothing') ? [] : ['nothing'] });
    const rest = cur.filter((x) => x !== 'nothing');
    set(dispatch, { tried: rest.includes(id) ? rest.filter((x) => x !== id) : [...rest, id] });
  };
  return (
    <QuizScreen id="tried" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="What have you tried so far?" lede="Select all that apply." />
      <div className="fpb-options tight">
        {TRIED.map((o) => <OptionCard key={o.id} multi compact label={o.label} icon={o.icon} selected={cur.includes(o.id)} onClick={() => pick(o.id)} />)}
      </div>
    </QuizScreen>
  );
}

/* ---------------------------------------------------------------- 11 proof */

export function ProofCards() {
  const ref = useRef<HTMLDivElement>(null);
  const drift = useDrift(ref, 0.35);
  return (
    <div ref={ref} {...drift} className="fpb-carousel" style={{ scrollSnapType: 'none' }}>
      {[...PROOF, ...PROOF].map((p, i) => (
          <article key={i} aria-hidden={i >= PROOF.length || undefined} style={{ width: 'min(306px, 82vw)', flex: 'none', userSelect: 'none', WebkitTouchCallout: 'none', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 24, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {p.avatar ? <Img src={p.avatar} style={{ width: 36, height: 36, borderRadius: '50%', flex: 'none' }} /> : <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 14px/1 var(--font-sans)', flex: 'none' }}>{p.initial}</span>}
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ font: '600 14px/1.2 var(--font-sans)' }}>{p.name}</span><span style={{ fontSize: 11, lineHeight: 1.2, color: 'var(--text-tertiary)' }}>{p.meta}</span></span>
              {p.verified && <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: '500 10px/1 var(--font-mono)', letterSpacing: '.06em', color: 'var(--signal-400)' }}><Icon d={ICONS.check} size={12} stroke={2.6} />VERIFIED</span>}
            </div>
            <Stars n={p.stars} />
            <p style={{ margin: 0, font: '600 19px/1.25 var(--font-sans)', letterSpacing: '-0.02em' }}>&ldquo;{p.quote}&rdquo;</p>
            {p.image && <Img src={p.image} label={p.imageAlt} style={{ width: '100%', height: 220, borderRadius: 14, backgroundColor: '#fff', backgroundSize: 'contain, 0 0', backgroundPosition: p.position ?? 'center' }} />}
            {p.caption && <span style={{ font: '400 11px/1.2 var(--font-mono)', color: 'var(--text-tertiary)' }}>{p.caption}</span>}
          </article>
      ))}
    </div>
  );
}

export function Proof({ back, next }: ScreenProps) {
  return (
    <div className="fpb-screen">
      <QHeader onBack={back} progress={PROGRESS.proof!.pct} />
      <main className="fpb-main fpb-enter" style={{ paddingRight: 0 }}>
        <div style={{ paddingRight: 20 }}>
          <Titles overline="REAL RESULTS" title="Artists who started with fan pages." lede={<>Straight from Spotify for Artists. <b>Organic growth, no paid promo.</b></>} />
        </div>
        <ProofCards />
      </main>
      <Footer><button type="button" className="fpb-btn primary" onClick={next}>Continue</button></Footer>
    </div>
  );
}

/* ---------------------------------------------------------------- 12–14 */

export function DailyTime({ state, dispatch, next, back }: ScreenProps) {
  return (
    <QuizScreen id="daily-time" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="How much time can you give promo each day?" lede="Be honest. We build the plan around it." />
      <SingleList options={DAILY_TIME} value={state.answers.dailyTime} onPick={(id) => set(dispatch, { dailyTime: id })} />
    </QuizScreen>
  );
}

export function Release({ state, dispatch, next, back }: ScreenProps) {
  return (
    <QuizScreen id="release" back={back} footer={<NextBtn s={state} next={next} />}>
      <Titles title="When's your next release?" lede="Fan pages work best when they're warmed up before release day." />
      <SingleList options={RELEASES} value={state.answers.release} onPick={(id) => set(dispatch, { release: id })} smallIcon />
    </QuizScreen>
  );
}

export function Experience({ state, dispatch, next, back }: ScreenProps) {
  return (
    <QuizScreen id="experience" back={back} footer={<NextBtn s={state} next={next} label="Build my strategy" signal />}>
      <div className="fpb-titles">
        <span className="fpb-overline muted">LAST QUESTION</span>
        <h2 className="fpb-h2">Have you run a fan page before?</h2>
      </div>
      <SingleList options={EXPERIENCE} value={state.answers.experience} onPick={(id) => set(dispatch, { experience: id })} smallIcon />
    </QuizScreen>
  );
}
