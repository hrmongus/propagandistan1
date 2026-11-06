import { describe, expect, it } from 'vitest';
import { getMetrics, scorePacks } from './metrics';
import type { QuizAnswers } from './config';

const base: QuizAnswers = { listeners: '1k-10k', goal: '100k', aesthetics: ['noir', 'y2k'], age: ['18-24'], gender: 'women', moments: ['night-drive'] };

describe('getMetrics: same input, same output', () => {
  it('is identical across calls', () => {
    expect(getMetrics('4hWnpdm0As7Ruegjv2XD6W', base)).toEqual(getMetrics('4hWnpdm0As7Ruegjv2XD6W', base));
  });

  it('ignores object key order', () => {
    const shuffled = { moments: ['night-drive'], gender: 'women', age: ['18-24'], aesthetics: ['noir', 'y2k'], goal: '100k', listeners: '1k-10k' } as QuizAnswers;
    expect(getMetrics('abc', shuffled)).toEqual(getMetrics('abc', base));
  });

  it('changes with the track or the answers', () => {
    const a = getMetrics('track-a', base), b = getMetrics('track-b', base), c = getMetrics('track-a', { ...base, goal: '500k' });
    expect(a.radar).not.toEqual(b.radar);
    expect(a.radar).not.toEqual(c.radar);
  });

  it('stays in range over many inputs', () => {
    for (let i = 0; i < 2000; i++) {
      const m = getMetrics('t' + i, { ...base, aesthetics: [['noir'], ['y2k', 'coastal'], []][i % 3] });
      expect(m.fanpageFit.score).toBeGreaterThanOrEqual(55);
      expect(m.fanpageFit.score).toBeLessThanOrEqual(97);
      expect(m.fanpageFit.label).toBe(m.fanpageFit.score >= 86 ? 'Excellent fit' : 'Strong fit');
      for (const v of Object.values(m.radar)) { expect(v).toBeGreaterThanOrEqual(68); expect(v).toBeLessThanOrEqual(96); }
      expect(m.pages).toHaveLength(3);
      expect(new Set(m.pages.map((p) => p.kit)).size).toBe(3);
      for (let j = 1; j < 3; j++) expect(m.pages[j].fit).toBeLessThan(m.pages[j - 1].fit);
      for (const p of m.pages) { expect(p.fit).toBeGreaterThanOrEqual(51); expect(p.fit).toBeLessThanOrEqual(97); expect(p.audience).toBeGreaterThanOrEqual(56); expect(p.audience).toBeLessThanOrEqual(96); }
    }
  });

  it('maps listener brackets to untapped %', () => {
    const pct = (listeners: QuizAnswers['listeners']) => getMetrics('x', { ...base, listeners }).untappedAudiencePct;
    expect([pct('lt1k'), pct('1k-10k'), pct('10k-50k'), pct('50k-100k'), pct('100k+')]).toEqual([99, 97, 93, 88, 80]);
  });
});

describe('pack scoring from the fit sheet', () => {
  const q = (o: Partial<QuizAnswers>): QuizAnswers => ({ listeners: '1k-10k', aesthetics: [], ...o });

  it('genre decides the most', () => {
    expect(scorePacks(q({ genre: 'hiphop' }))[0].pack).toBe('midnight');
    expect(scorePacks(q({ genre: 'country' }))[0].pack).not.toBe('midnight');
  });

  it('a clear profile picks the matching pack', () => {
    expect(getMetrics('t', q({ genre: 'hiphop', aesthetics: ['cyberpunk'], moments: ['night-drive'], age: ['25-34'] })).offerPack).toBe('midnight');
    expect(getMetrics('t', q({ genre: 'folk', aesthetics: ['cottagecore'], moments: ['chill'], age: ['35-44'] })).offerPack).toBe('forest');
    expect(getMetrics('t', q({ genre: 'pop', aesthetics: ['old-money'], moments: ['nostalgia'], age: ['13-17'] })).offerPack).toBe('golden');
    expect(getMetrics('t', q({ genre: 'electronic', aesthetics: ['coastal'], moments: ['feel-good'], age: ['25-34'] })).offerPack).toBe('coastal');
  });

  it('ties go to Midnight City', () => {
    expect(scorePacks(q({}))[0].pack).toBe('midnight');
  });

  it('a better match scores higher', () => {
    const good = getMetrics('t', q({ genre: 'hiphop', aesthetics: ['cyberpunk'], moments: ['gym'], age: ['25-34'] })).fanpageFit.score;
    const mixed = getMetrics('t', q({ genre: 'other', aesthetics: ['weirdcore'], moments: ['study'], age: ['45+'] })).fanpageFit.score;
    expect(good).toBeGreaterThan(mixed);
    expect(good).toBeGreaterThanOrEqual(90);
  });

  it('shows a different aesthetic on each page, preferring the artist’s own picks', () => {
    const m = getMetrics('t', q({ genre: 'pop', aesthetics: ['noir', 'cottagecore', 'old-money'] }));
    expect(new Set(m.topFanPages).size).toBe(3);
    expect(m.topFanPages.filter((id) => ['noir', 'cottagecore', 'old-money'].includes(id)).length).toBeGreaterThanOrEqual(2);
  });
});
