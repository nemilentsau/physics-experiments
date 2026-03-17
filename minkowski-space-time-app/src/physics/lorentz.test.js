import { describe, expect, it } from 'vitest';
import { boostEvent, intervalSquared } from './lorentz.js';
import { integrateProperTime } from './worldline.js';

describe('Lorentz invariants', () => {
  it('preserves the interval under a boost', () => {
    const start = { t: 1.5, x: -0.75 };
    const end = { t: 6.25, x: 2.5 };
    const originalInterval = intervalSquared(end.t - start.t, end.x - start.x);

    const startPrime = boostEvent(start.t, start.x, 0.72);
    const endPrime = boostEvent(end.t, end.x, 0.72);
    const boostedInterval = intervalSquared(
      endPrime.t - startPrime.t,
      endPrime.x - startPrime.x,
    );

    expect(boostedInterval).toBeCloseTo(originalInterval, 10);
  });

  it('keeps the traveling proper time below coordinate time for the twin trip', () => {
    const velocity = 0.8;
    const tripDistance = 4;
    const tOutbound = tripDistance / velocity;
    const tTotal = 2 * tOutbound;
    const tauTraveler = integrateProperTime(tTotal, velocity, tOutbound, 0.08 * tOutbound);

    expect(tauTraveler).toBeLessThan(tTotal);
  });
});
