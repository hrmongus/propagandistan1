import { describe, expect, it } from 'vitest';
import { fillTopFanPages, getMetrics } from './metrics';
import { AESTHETICS, aestheticById, type QuizAnswers } from './config';

const base: QuizAnswers = { listeners: '1k-10k', goal: 'streams', aesthetics: ['noir', 'y2k'], age: '18-24', gender: 'mixed', moments: ['night-drive'] };

describe('getMetrics: same input, same output', () => {
  it('is identical across calls', () => {
    expect(getMetrics('4hWnpdm0As7Ruegjv2XD6W', base)).toEqual(getMetrics('4hWnpdm0As7Ruegjv2XD6W', base));
  });

  it('ignores object key order', () => {
    const shuffled = { moments: ['night-drive'], gender: 'mixed', age: '18-24', aesthetics: ['noir', 'y2k'], goal: 'streams', listeners: '1k-10k' } as QuizAnswers;
    expect(getMetrics('abc', shuffled)).toEqual(getMetrics('abc', base));
  });

  it('changes with the track or the answers', () => {
    const a = getMetrics('track-a', base), b = getMetrics('track-b', base), c = getMetrics('track-a', { ...base, goal: 'viral' });
    expect(a.radar).not.toEqual(b.radar);
    expect(a.radar).not.toEqual(c.radar);
  });

  it('stays in range over many inputs', () => {
    for (let i = 0; i < 2000; i++) {
      const m = getMetrics('t' + i, { ...base, goal: String(i % 7) });
      expect(m.fanpageFit.score).toBeGreaterThanOrEqual(78);
      expect(m.fanpageFit.score).toBeLessThanOrEqual(90);
      expect(m.fanpageFit.label).toBe(m.fanpageFit.score >= 86 ? 'Excellent fit' : 'Strong fit');
      for (const v of Object.values(m.radar)) { expect(v).toBeGreaterThanOrEqual(68); expect(v).toBeLessThanOrEqual(96); }
    }
  });

  it('maps listener brackets to untapped %', () => {
    const pct = (listeners: QuizAnswers['listeners']) => getMetrics('x', { ...base, listeners }).untappedAudiencePct;
    expect([pct('lt1k'), pct('1k-10k'), pct('10k-50k'), pct('50k-100k'), pct('100k+')]).toEqual([99, 97, 93, 88, 80]);
  });
});

describe('top fan pages: fill rule', () => {
  it('keeps 3 picks in pick order', () => {
    expect(fillTopFanPages(['western', 'noir', 'y2k'])).toEqual(['western', 'noir', 'y2k']);
  });

  it('fills from the first pick’s pack, in config order, skipping picks', () => {
    const top = fillTopFanPages(['noir', 'y2k']); // noir is midnight
    expect(top.slice(0, 2)).toEqual(['noir', 'y2k']);
    expect(aestheticById(top[2])!.pack).toBe('midnight');
    expect(top[2]).toBe(AESTHETICS.find((a) => a.pack === 'midnight' && a.id !== 'noir')!.id);
  });

  it('fills two slots for a single pick', () => {
    const top = fillTopFanPages(['cottagecore']);
    expect(top).toHaveLength(3);
    expect(top.every((id) => aestheticById(id)!.pack === 'forest')).toBe(true);
    expect(new Set(top).size).toBe(3);
  });

  it('drops unknown ids and duplicates, caps at 3', () => {
    expect(fillTopFanPages(['nope', 'noir', 'noir', 'y2k', 'western', 'grunge'])).toEqual(['noir', 'y2k', 'western']);
  });

  it('falls back to any aesthetic when the pack runs out', () => {
    const tiny = AESTHETICS.filter((a) => a.id === 'noir' || a.pack === 'golden');
    const top = fillTopFanPages(['noir'], tiny);
    expect(top[0]).toBe('noir');
    expect(top).toHaveLength(3);
  });

  it('offer pack is the first pick’s pack', () => {
    expect(getMetrics('x', { ...base, aesthetics: ['coastal', 'noir'] }).offerPack).toBe('coastal');
  });

  it('still returns 3 pages with no picks', () => {
    const m = getMetrics('x', { ...base, aesthetics: [] });
    expect(m.topFanPages).toHaveLength(3);
    expect(m.offerPack).toBe(aestheticById(m.topFanPages[0])!.pack);
  });
});
