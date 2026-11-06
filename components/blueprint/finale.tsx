'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ANALYZING_MS, ANALYZING_STEPS, GENDERS, GOALS, aestheticById, momentById, type QuizAnswers } from '@/lib/analyzer/config';
import { getMetrics } from '@/lib/analyzer/metrics';
import { setStrategyId, track } from '@/lib/analyzer/track';
import { ICONS, Icon, Img, Logo } from './ui';
import type { ScreenProps } from './screens';
import { clearQuiz } from './state';

/** sessionStorage key for an unsaved test result (see /fanpage-blueprint/results). */
export const PREVIEW_KEY = 'fpb_unsaved_result';
/** The email check is off on non-production builds (testing). */
const TEST_MODE = process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production';

const audienceLabel = (a: Partial<QuizAnswers>) => [a.age?.join(', '), GENDERS.find((g) => g.id === a.gender)?.label.replace('Mostly ', '')].filter(Boolean).join(' · ');

function useMetrics(s: ScreenProps['state']) {
  return useMemo(() => (s.track && s.answers.listeners ? getMetrics(s.track.id, s.answers as QuizAnswers) : null), [s.track, s.answers]);
}

/* ---------------------------------------------------------------- 15 analyzing */

export function Analyzing({ state, next }: ScreenProps) {
  const metrics = useMetrics(state);
  const first = aestheticById(metrics?.pages[0].aesthetic ?? state.answers.aesthetics?.[0] ?? '');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const e = performance.now() - t0;
      setElapsed(e);
      if (e < ANALYZING_MS) raf = requestAnimationFrame(tick);
      else next();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per visit
  }, []);

  const p = Math.min(1, elapsed / ANALYZING_MS);
  const pct = Math.round(100 * (1 - (1 - p) ** 1.6)); // eases out, lands on 100 at the end
  const step = Math.min(ANALYZING_STEPS.length - 1, Math.floor(p * ANALYZING_STEPS.length));
  const filled = Math.min(6, Math.floor(p * 7.2));
  const tiles = first ? [...first.images, ...(aestheticById(state.answers.aesthetics?.[1] ?? '')?.images ?? first.images)].slice(0, 6) : [];

  const chips = [
    { k: 'track', icon: ICONS.wave, label: state.track?.title ?? 'Your track', dx: 96, dy: 150, pos: { left: 0, top: 34 }, accent: true },
    { k: 'aes', img: first?.images[0], label: first?.name ?? 'Your aesthetic', dx: -90, dy: 120, pos: { right: 0, top: 96 } },
    { k: 'aud', icon: ICONS.person, label: audienceLabel(state.answers) || 'Your audience', dx: 100, dy: 10, pos: { left: 0, top: 206 } },
    ...(state.answers.moments ?? []).slice(0, 2).map((m, i) => ({ k: m, icon: momentById(m)?.icon, label: momentById(m)?.label ?? m, dx: i ? 90 : -96, dy: i ? -150 : -40, pos: i ? { left: 6, top: 280 } : { right: 0, top: 210 } })),
  ];

  return (
    <div className="fpb-screen">
      <header className="fpb-top" style={{ justifyContent: 'center' }}><Logo small /></header>
      <main className="fpb-main" style={{ flex: 1, alignItems: 'center', gap: 14, padding: '18px 20px 40px' }}>
        <h2 style={{ margin: 0, textAlign: 'center', font: '600 26px/1.08 var(--font-sans)', letterSpacing: '-0.03em' }}>Building your fan page…</h2>
        <div role="img" aria-label="Your song, audience and aesthetics flowing into a new fan page that fills with posts" style={{ position: 'relative', width: 350, maxWidth: '100%', height: 330 }}>
          <div className="fpb-anim-phone" style={{ position: 'absolute', left: '50%', top: 0, width: 216, height: 436, marginLeft: -108, borderRadius: 34, border: '6px solid #1C1C1F', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px 0', transform: 'scale(0.72)', transformOrigin: 'top center', filter: `blur(${3 * (1 - p)}px)`, opacity: 0.65 + 0.35 * p }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <Icon d={ICONS.back} size={12} stroke={2.5} color="#fff" />
              <span className="fpb-ellipsis" style={{ font: '600 10px/1 var(--font-sans)', color: '#fff' }}>{first?.handle ?? 'your.fan.page'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS.dots }} />
            </div>
            <Img src={first?.images[0]} style={{ marginTop: 12, width: 58, height: 58, borderRadius: '50%' }} />
            <span style={{ marginTop: 7, font: '600 11px/1 var(--font-sans)', color: '#fff' }}>@{first?.handle ?? 'your.fan.page'}</span>
            <div style={{ marginTop: 9, display: 'flex', gap: 14 }}>
              {['Following', 'Followers', 'Likes'].map((l) => (
                <span key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><span style={{ font: '600 11px/1 var(--font-mono)', color: '#fff' }}>0</span><span style={{ fontSize: 8, lineHeight: 1, color: '#8A8A8F' }}>{l}</span></span>
              ))}
            </div>
            <span style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 92, height: 24, borderRadius: 4, background: '#FE2C55', font: '600 10px/1 var(--font-sans)', color: '#fff' }}>Follow</span>
            <span style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, lineHeight: 1.2, color: '#D2D2D7', maxWidth: '100%' }}>
              <Icon d={ICONS.wave} size={9} stroke={3} color="#22D46B" /><span className="fpb-ellipsis">{state.track ? `${state.track.title} · ${state.track.artists[0]}` : ''}</span>
            </span>
            <div style={{ marginTop: 10, width: '100%', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #2A2A2E' }}>
              <span style={{ width: '50%', display: 'flex', justifyContent: 'center', paddingBottom: 6, borderBottom: '1.5px solid #fff' }}><Icon d={ICONS.grid} size={12} stroke={2.2} color="#fff" /></span>
            </div>
            <div style={{ marginTop: 2, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={i < filled ? '' : 'fpb-anim-cell'} style={{ position: 'relative', aspectRatio: '3 / 4', background: '#1C1C1F', overflow: 'hidden' }}>
                  {i < filled && <Img src={tiles[i]} className="fpb-anim-tile" style={{ width: '100%', height: '100%' }} />}
                </div>
              ))}
            </div>
          </div>
          {chips.map((c, i) => (
            <span key={c.k} className="fpb-anim-chip" style={{ ['--dx' as string]: `${c.dx}px`, ['--dy' as string]: `${c.dy}px`, position: 'absolute', ...c.pos, display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 999, background: 'rgba(20,20,22,0.92)', border: `1px solid ${'accent' in c && c.accent ? 'rgba(34,212,107,0.55)' : 'var(--border-strong)'}`, font: '500 12px/1 var(--font-sans)', color: '#fff', whiteSpace: 'nowrap', maxWidth: 200, animationDelay: `${i * 1.2}s` }}>
              {'img' in c && c.img !== undefined ? <Img src={c.img} style={{ width: 16, height: 16, borderRadius: '50%' }} /> : c.icon && <Icon d={c.icon} size={12} stroke={2.4} color={'accent' in c && c.accent ? '#22D46B' : '#fff'} />}
              <span className="fpb-ellipsis">{c.label}</span>
            </span>
          ))}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 314, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ font: '600 64px/1 var(--font-mono)', letterSpacing: '-0.05em', color: '#fff', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>{pct}%</span>
          </div>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 22 }}>
            <span className="fpb-anim-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--ink-400)', borderTopColor: 'var(--signal-500)', flex: 'none' }} />
            <span aria-live="polite" key={step} className="fpb-anim-step" style={{ width: 230, font: '500 15px/20px var(--font-sans)' }}>{ANALYZING_STEPS[step]}</span>
          </div>
          <div style={{ width: 220, height: 4, borderRadius: 999, background: 'var(--ink-300)', overflow: 'hidden' }}><div style={{ width: `${Math.max(2, p * 100)}%`, height: '100%', borderRadius: 999, background: 'var(--signal-500)' }} /></div>
          <span style={{ fontSize: 12, lineHeight: 1, color: 'var(--text-tertiary)' }}>About 15 seconds. Don&apos;t close this page.</span>
        </div>
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- 16 email gate */

const ERRORS: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  disposable_email: 'Please use your real email address so your Blueprint reaches you.',
  invalid_track: 'Something is off with your track. Go back and pick it again.',
  invalid_answers: 'Some answers are missing. Go back and check the questions.',
};

export function EmailGate({ state, dispatch, back }: ScreenProps) {
  const router = useRouter();
  const metrics = useMetrics(state);
  const goal = GOALS.find((g) => g.id === state.answers.goal);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: state.track, answers: state.answers, firstName, email }),
      });
      const data = await res.json().catch(() => ({}));
      // Test builds only: the database rejected the save, so show the results unsaved.
      if (res.ok && data.saved === false && data.preview) {
        try { sessionStorage.setItem(PREVIEW_KEY, JSON.stringify({ ...data.preview, reason: data.reason })); } catch { /* ignore */ }
        router.push('/fanpage-blueprint/results');
        return;
      }
      if (!res.ok || !data.id) throw new Error(data.error ?? 'save_failed');
      setStrategyId(data.id);
      track('email_submitted', 'email-gate', data.id);
      router.push(`/s/${data.id}?new=1`);
    } catch (err) {
      setError(ERRORS[(err as Error).message] ?? 'Could not save your Blueprint. Please try again.');
      setBusy(false);
    }
  };

  const pages = metrics?.pages.map((p) => aestheticById(p.aesthetic)) ?? [];
  return (
    <div className="fpb-screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 20, padding: '70px 20px 0', filter: 'blur(4px)', opacity: 0.85, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, background: 'var(--surface-card)' }}>
          <Img src={state.track?.artworkUrl} style={{ width: 48, height: 48, borderRadius: 10 }} />
          <span style={{ font: '600 15px/1.2 var(--font-sans)' }}>{state.track?.title}</span>
        </div>
        <h1 style={{ margin: 0, font: '600 34px/1.04 var(--font-sans)', letterSpacing: '-0.04em' }}>Your path to {goal ? goal.value.toLocaleString('en-US') : 'more'} monthly listeners.</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div style={{ height: 180, borderRadius: 24, background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 44px/1 var(--font-mono)' }}>{metrics?.fanpageFit.score}</div>
          <div style={{ height: 180, borderRadius: 24, background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 32px/1 var(--font-mono)' }}>{metrics?.untappedAudiencePct}%</div>
        </div>
        <div style={{ borderRadius: 24, background: 'var(--surface-card)', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, minHeight: 220 }}>
          <span style={{ font: '500 10px/1 var(--font-mono)', letterSpacing: '.12em', color: 'var(--text-tertiary)' }}>YOUR BLUEPRINT</span>
          <span style={{ font: '600 20px/1.15 var(--font-sans)', letterSpacing: '-0.03em' }}>Your top 3 fan pages</span>
          {pages.map((p) => <div key={p?.id} style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--ink-200)', font: '600 13px/1.2 var(--font-sans)' }}>@{p?.handle}</div>)}
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

      {/* Way out of the gate: back to the last question, or start over with a different song. */}
      <header className="fpb-top" style={{ position: 'relative', zIndex: 2 }}>
        <button type="button" className="fpb-back" aria-label="Back" onClick={back}><Icon d={ICONS.back} /></button>
        <Logo small />
        <button type="button" onClick={() => { clearQuiz(); history.replaceState({ fpb: 'landing' }, ''); dispatch({ type: 'reset' }); }}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', font: '500 13px/1 var(--font-sans)', cursor: 'pointer', padding: '10px 0', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Start over
        </button>
      </header>
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '8px 20px 24px' }}>
        <form onSubmit={submit} aria-label="Unlock your strategy" className="fpb-enter" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px 22px', borderRadius: 28, background: 'var(--ink-100)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-float)' }}>
          <div className="fpb-titles">
            <span className="fpb-overline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal-500)' }} />YOUR STRATEGY IS READY</span>
            <h2 className="fpb-h3">Where should we send your fan page strategy?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {[
              { v: `${metrics?.untappedAudiencePct ?? ''}%`, l: 'Untapped audience' },
              { v: String(metrics?.fanpageFit.score ?? ''), l: 'Fanpage Fit Score', c: 'var(--signal-400)' },
              { v: goal?.short ?? '', l: 'Your Blueprint' },
            ].map((x) => (
              <div key={x.l} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 10px', borderRadius: 16, background: 'var(--ink-200)', textAlign: 'center' }}>
                <span aria-hidden="true" style={{ font: '600 22px/1 var(--font-mono)', letterSpacing: '-0.02em', color: x.c ?? 'var(--text-primary)', filter: 'blur(3.5px)', userSelect: 'none' }}>{x.v}</span>
                <span style={{ fontSize: 11, lineHeight: 1.25, color: 'var(--text-secondary)' }}>{x.l}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="fpb-field light"><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" autoComplete="given-name" aria-label="First name" maxLength={80} /></label>
            <label className="fpb-field light"><input type={TEST_MODE ? 'text' : 'email'} required={!TEST_MODE} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" aria-label="Email" inputMode="email" maxLength={254} /></label>
          </div>
          {error && <p role="alert" style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: '#FF8A6E' }}>{error}</p>}
          <button type="submit" className="fpb-btn signal" disabled={busy || (!TEST_MODE && !email)}>{busy ? 'Saving your Blueprint…' : 'Show my blueprint'}</button>
          <p className="fpb-fine">We also email you a link to your results. No spam.</p>
          <p className="fpb-fine" style={{ fontSize: 11 }}>By proceeding you agree to receive marketing emails and to our <a href="/privacy" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.</p>
        </form>
      </div>
    </div>
  );
}
