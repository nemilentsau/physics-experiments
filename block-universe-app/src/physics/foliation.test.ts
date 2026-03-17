import { describe, it, expect } from 'vitest';
import { foliationFamily, lightConeBounds, sliceLine } from './foliation.ts';
import { gamma } from './lorentz.ts';
import type { SpacetimeEvent } from '../types.ts';

function mkEvent(x: number, t: number, label = 'A'): SpacetimeEvent {
  return { id: `test-${label}`, x, t, label };
}

describe('foliationFamily', () => {
  it('at rest, intercepts equal tPrime values', () => {
    const slices = foliationFamily(0, -3, 3, 1);
    for (const s of slices) {
      expect(s.intercept).toBeCloseTo(s.tPrime, 10);
    }
  });

  it('returns the correct number of slices', () => {
    const slices = foliationFamily(0, 0, 5, 1);
    // tPrime = 0, 1, 2, 3, 4, 5
    expect(slices).toHaveLength(6);
  });

  it('moving observer: intercept = gamma * tPrime', () => {
    const beta = 0.6;
    const g = gamma(beta);
    const slices = foliationFamily(beta, -2, 2, 1);
    for (const s of slices) {
      expect(s.intercept).toBeCloseTo(g * s.tPrime, 10);
      expect(s.slope).toBe(beta);
    }
  });
});

describe('lightConeBounds', () => {
  it('future cone expands with increasing t', () => {
    const event = mkEvent(3, 5);
    const bounds1 = lightConeBounds(event, 6);
    const bounds2 = lightConeBounds(event, 8);
    expect(bounds2.xRight - bounds2.xLeft).toBeGreaterThan(bounds1.xRight - bounds1.xLeft);
  });

  it('past cone expands with decreasing t', () => {
    const event = mkEvent(3, 5);
    const bounds1 = lightConeBounds(event, 4);
    const bounds2 = lightConeBounds(event, 2);
    expect(bounds2.xRight - bounds2.xLeft).toBeGreaterThan(bounds1.xRight - bounds1.xLeft);
  });

  it('at event time, bounds are just the event x', () => {
    const event = mkEvent(3, 5);
    const bounds = lightConeBounds(event, 5);
    expect(bounds.xLeft).toBe(3);
    expect(bounds.xRight).toBe(3);
  });
});

describe('sliceLine', () => {
  it('at rest (beta=0), horizontal line at t = tPrime', () => {
    const points = sliceLine(0, 4, -5, 5, 5);
    for (const p of points) {
      expect(p.t).toBeCloseTo(4, 10);
    }
    expect(points[0]!.x).toBeCloseTo(-5, 10);
    expect(points[points.length - 1]!.x).toBeCloseTo(5, 10);
  });

  it('tilted line at beta = 0.5', () => {
    const beta = 0.5;
    const tPrime = 3;
    const g = gamma(beta);
    const intercept = g * tPrime;
    const points = sliceLine(beta, tPrime, -5, 5, 5);
    for (const p of points) {
      expect(p.t).toBeCloseTo(intercept + beta * p.x, 10);
    }
  });
});
