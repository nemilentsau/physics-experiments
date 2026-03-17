import type { SpacetimeEvent, FoliationSlice, LightConeBoundsResult, WorldlinePoint } from '../types.ts';
import { gamma } from './lorentz.ts';

export function foliationFamily(
  observer: number | { beta: number },
  tMin: number,
  tMax: number,
  spacing = 1,
): FoliationSlice[] {
  const beta = typeof observer === 'number' ? observer : observer.beta;
  const g = gamma(beta);
  const slices: FoliationSlice[] = [];
  for (let tPrime = tMin; tPrime <= tMax; tPrime += spacing) {
    slices.push({ tPrime, beta, intercept: g * tPrime, slope: beta });
  }
  return slices;
}

export function lightConeBounds(event: SpacetimeEvent, t: number): LightConeBoundsResult {
  const spread = Math.abs(t - event.t);
  return { xLeft: event.x - spread, xRight: event.x + spread };
}

export function sliceLine(
  beta: number,
  tPrime: number,
  xMin: number,
  xMax: number,
  numPoints = 2,
): WorldlinePoint[] {
  const g = gamma(beta);
  const intercept = g * tPrime;
  const points: WorldlinePoint[] = [];
  for (let i = 0; i <= numPoints - 1; i++) {
    const x = xMin + (xMax - xMin) * (i / (numPoints - 1));
    points.push({ x, t: intercept + beta * x });
  }
  return points;
}
