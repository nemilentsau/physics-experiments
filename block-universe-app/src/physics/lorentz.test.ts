import { describe, it, expect } from 'vitest';
import {
  gamma,
  boostEvent,
  inverseBoostEvent,
  intervalSquared,
  classifyRelation,
} from './lorentz.ts';
import type { SpacetimeEvent } from '../types.ts';

function mkEvent(x: number, t: number, label = 'A'): SpacetimeEvent {
  return { id: `test-${label}`, x, t, label };
}

describe('gamma', () => {
  it('returns 1 for beta = 0', () => {
    expect(gamma(0)).toBe(1);
  });

  it('returns ~1.25 for beta = 0.6', () => {
    expect(gamma(0.6)).toBeCloseTo(1.25, 10);
  });

  it('returns ~1.6667 for beta = 0.8', () => {
    expect(gamma(0.8)).toBeCloseTo(5 / 3, 4);
  });

  it('is symmetric: gamma(-0.5) = gamma(0.5)', () => {
    expect(gamma(-0.5)).toBe(gamma(0.5));
  });
});

describe('boostEvent', () => {
  it('round-trip at beta = 0.6', () => {
    const original = mkEvent(3, 7);
    const boosted = boostEvent(original, 0.6);
    const restored = boostEvent(boosted, -0.6);
    expect(restored.x).toBeCloseTo(original.x, 10);
    expect(restored.t).toBeCloseTo(original.t, 10);
  });

  it('round-trip at beta = 0.9', () => {
    const original = mkEvent(-2, 4);
    const boosted = boostEvent(original, 0.9);
    const restored = boostEvent(boosted, -0.9);
    expect(restored.x).toBeCloseTo(original.x, 10);
    expect(restored.t).toBeCloseTo(original.t, 10);
  });

  it('returns same coordinates at beta = 0', () => {
    const original = mkEvent(5, 3);
    const boosted = boostEvent(original, 0);
    expect(boosted.x).toBe(original.x);
    expect(boosted.t).toBe(original.t);
  });
});

describe('inverseBoostEvent', () => {
  it('is the inverse of boostEvent', () => {
    const original = mkEvent(1.5, 6);
    const boosted = boostEvent(original, 0.7);
    const restored = inverseBoostEvent(boosted, 0.7);
    expect(restored.x).toBeCloseTo(original.x, 10);
    expect(restored.t).toBeCloseTo(original.t, 10);
  });
});

describe('intervalSquared', () => {
  it('timelike pair (|dx| < |dt|) gives negative', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(1, 5, 'B');
    expect(intervalSquared(a, b)).toBeLessThan(0);
  });

  it('spacelike pair (|dx| > |dt|) gives positive', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(5, 1, 'B');
    expect(intervalSquared(a, b)).toBeGreaterThan(0);
  });

  it('lightlike pair (|dx| = |dt|) gives ~0', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(3, 3, 'B');
    expect(intervalSquared(a, b)).toBeCloseTo(0, 10);
  });

  it('is Lorentz invariant (same value after boost)', () => {
    const a = mkEvent(1, 2, 'A');
    const b = mkEvent(4, 7, 'B');
    const s2Original = intervalSquared(a, b);
    const aBoosted = boostEvent(a, 0.6);
    const bBoosted = boostEvent(b, 0.6);
    const s2Boosted = intervalSquared(aBoosted, bBoosted);
    expect(s2Boosted).toBeCloseTo(s2Original, 8);
  });
});

describe('classifyRelation', () => {
  it('identifies timelike pair', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(1, 5, 'B');
    expect(classifyRelation(a, b)).toBe('timelike');
  });

  it('identifies spacelike pair', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(5, 1, 'B');
    expect(classifyRelation(a, b)).toBe('spacelike');
  });

  it('identifies lightlike pair', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(3, 3, 'B');
    expect(classifyRelation(a, b)).toBe('lightlike');
  });
});
