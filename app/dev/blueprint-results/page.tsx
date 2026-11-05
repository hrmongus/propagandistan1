import { geistMono } from '@/components/blueprint/fonts';
import { Results, type StrategyRow } from '@/components/blueprint/results';
import { fallbackHooks } from '@/lib/analyzer/hooks';
import { getMetrics } from '@/lib/analyzer/metrics';
import type { QuizAnswers } from '@/lib/analyzer/config';
import '@/components/blueprint/blueprint.css';

/*
 * Design preview of the results page (screen 17 + checkout sheets) with the handoff's example answers, without
 * Supabase. Uses the real getMetrics and the default hooks. Not linked anywhere; noindex via app/dev/layout.tsx.
 */
const answers: QuizAnswers = {
  listeners: '1k-10k', goal: '100k', blocker: 'reach', aesthetics: ['light-academia', 'clean-girl', 'coquette'],
  age: ['18-24'], gender: 'women', moments: ['heartbreak', 'night-drive'], tried: ['playlists', 'ads'],
  dailyTime: '15', release: 'month', experience: 'never',
};

export default function BlueprintResultsPreview() {
  const trackId = '4hWnpdm0As7Ruegjv2XD6W';
  const metrics = getMetrics(trackId, answers);
  const row: StrategyRow = {
    id: 'Preview01',
    first_name: 'Nova',
    track: { id: trackId, title: 'Paper Planes in July', artists: ['Nova Reyes'], artworkUrl: null, releaseDate: '2026-09-16', popularity: null, spotifyUrl: `https://open.spotify.com/track/${trackId}` },
    answers,
    metrics,
    hooks: { pages: fallbackHooks({ aesthetics: metrics.topFanPages, moments: answers.moments }), fallback: true },
    lyric_line: null,
  };
  return (
    <div className={`fpb ${geistMono.variable}`} style={{ margin: -16 }}>
      <Results row={row} />
    </div>
  );
}
