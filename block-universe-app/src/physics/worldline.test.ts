import { describe, it, expect } from 'vitest';
import {
  buildInertialWorldline,
  sliceWorldLine,
  properTimeAlongSegment,
  buildWorldTube,
} from './worldline.ts';

describe('buildInertialWorldline', () => {
  it('stationary (beta=0) has all x = x0', () => {
    const wl = buildInertialWorldline(0, 0, 10, 3, 20);
    for (const p of wl) {
      expect(p.x).toBe(3);
    }
  });

  it('moving (beta=0.5) has x increasing with t', () => {
    const wl = buildInertialWorldline(0.5, 0, 10, 0, 20);
    for (const p of wl) {
      expect(p.x).toBeCloseTo(0.5 * p.t, 10);
    }
  });

  it('returns correct number of points (numPoints + 1)', () => {
    const wl = buildInertialWorldline(0, 0, 10, 0, 50);
    expect(wl).toHaveLength(51);
  });
});

describe('sliceWorldLine', () => {
  it('stationary worldline at x=-2, slice at tPrime=5 gives intersection near t=5', () => {
    const wl = buildInertialWorldline(0, 0, 10, -2, 100);
    const result = sliceWorldLine(wl, 0, 5);
    expect(result).not.toBeNull();
    expect(result!.t).toBeCloseTo(5, 4);
    expect(result!.x).toBeCloseTo(-2, 4);
  });

  it('returns null if slice does not intersect', () => {
    const wl = buildInertialWorldline(0, 0, 3, 0, 50);
    // Slice at tPrime=20 is beyond the worldline range [0, 3]
    const result = sliceWorldLine(wl, 0, 20);
    expect(result).toBeNull();
  });

  it('moving worldline intersection', () => {
    const wl = buildInertialWorldline(0.4, 0, 10, 0, 100);
    const result = sliceWorldLine(wl, 0, 3);
    expect(result).not.toBeNull();
    expect(result!.t).toBeCloseTo(3, 2);
  });
});

describe('properTimeAlongSegment', () => {
  it('stationary observer (v=0): proper time = coordinate time', () => {
    const wl = buildInertialWorldline(0, 0, 10, 0, 100);
    const tau = properTimeAlongSegment(wl, 0, 10);
    expect(tau).toBeCloseTo(10, 6);
  });

  it('moving observer: proper time < coordinate time', () => {
    const wl = buildInertialWorldline(0.6, 0, 10, 0, 100);
    const tau = properTimeAlongSegment(wl, 0, 10);
    // proper time = dt * sqrt(1 - v^2) = 10 * sqrt(1 - 0.36) = 10 * 0.8 = 8
    expect(tau).toBeCloseTo(8, 4);
    expect(tau).toBeLessThan(10);
  });
});

describe('buildWorldTube', () => {
  it('left edge offset by -halfWidth, right by +halfWidth', () => {
    const wl = buildInertialWorldline(0, 0, 10, 5, 10);
    const tube = buildWorldTube(wl, 2);
    for (let i = 0; i < wl.length; i++) {
      expect(tube.left[i]!.x).toBeCloseTo(wl[i]!.x - 2, 10);
      expect(tube.right[i]!.x).toBeCloseTo(wl[i]!.x + 2, 10);
    }
  });

  it('center matches input worldline', () => {
    const wl = buildInertialWorldline(0.3, 0, 10, 1, 10);
    const tube = buildWorldTube(wl, 1.5);
    for (let i = 0; i < wl.length; i++) {
      expect(tube.center[i]!.x).toBe(wl[i]!.x);
      expect(tube.center[i]!.t).toBe(wl[i]!.t);
    }
  });
});
