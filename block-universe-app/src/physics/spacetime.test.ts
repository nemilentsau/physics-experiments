import { describe, it, expect } from 'vitest';
import { simultaneityAngle, eventsOnSlice, temporalOrder } from './spacetime.ts';
import type { SpacetimeEvent } from '../types.ts';

function mkEvent(x: number, t: number, label = 'A'): SpacetimeEvent {
  return { id: `test-${label}`, x, t, label };
}

describe('simultaneityAngle', () => {
  it('returns 0 for beta = 0', () => {
    expect(simultaneityAngle(0)).toBe(0);
  });

  it('returns atan(0.5) for beta = 0.5', () => {
    expect(simultaneityAngle(0.5)).toBeCloseTo(Math.atan(0.5), 10);
  });

  it('returns atan(-0.3) for beta = -0.3', () => {
    expect(simultaneityAngle(-0.3)).toBeCloseTo(Math.atan(-0.3), 10);
  });
});

describe('eventsOnSlice', () => {
  it('at rest (beta=0), events at t=5 are on slice at tPrime=5', () => {
    const events = [mkEvent(0, 5, 'A'), mkEvent(3, 5, 'B'), mkEvent(-2, 5, 'C')];
    const result = eventsOnSlice(events, 0, 5, 0.15);
    expect(result).toHaveLength(3);
  });

  it('moving observer filters some events off the slice', () => {
    const events = [
      mkEvent(0, 5, 'A'),
      mkEvent(3, 5, 'B'),
      mkEvent(-4, 5, 'C'),
      mkEvent(0, 2, 'D'),
    ];
    const result = eventsOnSlice(events, 0.6, 5, 0.15);
    expect(result.length).toBeLessThan(events.length);
  });

  it('tolerance=0 is very strict', () => {
    const events = [mkEvent(0, 5, 'A'), mkEvent(3, 5, 'B')];
    const result = eventsOnSlice(events, 0, 5, 0);
    // Only events whose boosted t equals tPrime exactly pass
    expect(result).toHaveLength(2);
  });

  it('accepts observer as { beta } object', () => {
    const events = [mkEvent(0, 5, 'A'), mkEvent(3, 5, 'B'), mkEvent(-2, 5, 'C')];
    const resultNum = eventsOnSlice(events, 0, 5, 0.15);
    const resultObj = eventsOnSlice(events, { beta: 0 }, 5, 0.15);
    expect(resultObj).toEqual(resultNum);
  });
});

describe('temporalOrder', () => {
  it('at rest, event with lower t comes first (-1)', () => {
    const a = mkEvent(0, 2, 'A');
    const b = mkEvent(0, 7, 'B');
    expect(temporalOrder(a, b, 0)).toBe(-1);
  });

  it('simultaneous events return 0', () => {
    const a = mkEvent(-3, 5, 'A');
    const b = mkEvent(3, 5, 'B');
    expect(temporalOrder(a, b, 0, 0.01)).toBe(0);
  });

  it('spacelike pair can flip order under boost', () => {
    // A and B are spacelike-separated: large dx, small dt
    const a = mkEvent(0, 5, 'A');
    const b = mkEvent(5, 5.1, 'B');
    const orderRest = temporalOrder(a, b, 0, 0.001);
    // Under a large boost, the order can flip
    const orderBoosted = temporalOrder(a, b, 0.9, 0.001);
    expect(orderRest).not.toBe(orderBoosted);
  });

  it('timelike pair preserves order under any boost', () => {
    const a = mkEvent(0, 0, 'A');
    const b = mkEvent(0.5, 5, 'B');
    const betas = [0, 0.3, -0.3, 0.8, -0.8];
    const orders = betas.map(beta => temporalOrder(a, b, beta, 0.001));
    // All should agree: a comes before b
    for (const order of orders) {
      expect(order).toBe(-1);
    }
  });
});
