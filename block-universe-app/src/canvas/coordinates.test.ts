import { describe, it, expect } from 'vitest';
import { toPixel, toSpacetime } from './coordinates.ts';
import type { Margins } from '../types.ts';

const W = 800;
const H = 600;
const rangeX = 8;
const rangeT = 10;
const margins: Margins = { top: 30, bottom: 40, left: 50, right: 30 };

function roundTrip(x: number, t: number): { x: number; t: number } {
  const pixel = toPixel(x, t, W, H, rangeX, rangeT, margins);
  const st = toSpacetime(pixel.px, pixel.py, W, H, rangeX, rangeT, margins);
  return st;
}

describe('toPixel / toSpacetime round-trip', () => {
  it('origin (0, 0)', () => {
    const rt = roundTrip(0, 0);
    expect(rt.x).toBeCloseTo(0, 8);
    expect(rt.t).toBeCloseTo(0, 8);
  });

  it('center of range (0, 5)', () => {
    const rt = roundTrip(0, 5);
    expect(rt.x).toBeCloseTo(0, 8);
    expect(rt.t).toBeCloseTo(5, 8);
  });

  it('left edge (-8, 5)', () => {
    const rt = roundTrip(-8, 5);
    expect(rt.x).toBeCloseTo(-8, 8);
    expect(rt.t).toBeCloseTo(5, 8);
  });

  it('right edge (8, 5)', () => {
    const rt = roundTrip(8, 5);
    expect(rt.x).toBeCloseTo(8, 8);
    expect(rt.t).toBeCloseTo(5, 8);
  });

  it('top-left corner (-8, 10)', () => {
    const rt = roundTrip(-8, 10);
    expect(rt.x).toBeCloseTo(-8, 8);
    expect(rt.t).toBeCloseTo(10, 8);
  });

  it('top-right corner (8, 10)', () => {
    const rt = roundTrip(8, 10);
    expect(rt.x).toBeCloseTo(8, 8);
    expect(rt.t).toBeCloseTo(10, 8);
  });

  it('bottom-left corner (-8, 0)', () => {
    const rt = roundTrip(-8, 0);
    expect(rt.x).toBeCloseTo(-8, 8);
    expect(rt.t).toBeCloseTo(0, 8);
  });

  it('arbitrary point (3.5, 7.2)', () => {
    const rt = roundTrip(3.5, 7.2);
    expect(rt.x).toBeCloseTo(3.5, 8);
    expect(rt.t).toBeCloseTo(7.2, 8);
  });
});

describe('toPixel boundary tests', () => {
  it('x = -rangeX maps to left margin', () => {
    const pixel = toPixel(-rangeX, 0, W, H, rangeX, rangeT, margins);
    expect(pixel.px).toBeCloseTo(margins.left, 8);
  });

  it('x = +rangeX maps to W - right margin', () => {
    const pixel = toPixel(rangeX, 0, W, H, rangeX, rangeT, margins);
    expect(pixel.px).toBeCloseTo(W - margins.right, 8);
  });

  it('t = 0 maps to H - bottom margin', () => {
    const pixel = toPixel(0, 0, W, H, rangeX, rangeT, margins);
    expect(pixel.py).toBeCloseTo(H - margins.bottom, 8);
  });

  it('t = rangeT maps to top margin', () => {
    const pixel = toPixel(0, rangeT, W, H, rangeX, rangeT, margins);
    expect(pixel.py).toBeCloseTo(margins.top, 8);
  });
});
