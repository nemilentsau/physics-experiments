import type { WorldlinePoint, WorldTube } from '../types.ts';
import { gamma } from './lorentz.ts';

export function sliceWorldLine(
  worldLine: readonly WorldlinePoint[],
  observer: number | { beta: number },
  tPrime = 0,
): WorldlinePoint | null {
  const beta = typeof observer === 'number' ? observer : observer.beta;
  const g = gamma(beta);

  for (let i = 0; i < worldLine.length - 1; i++) {
    const p0 = worldLine[i]!;
    const p1 = worldLine[i + 1]!;
    const dt = p1.t - p0.t;
    const dx = p1.x - p0.x;
    const tSlice0 = g * tPrime + beta * p0.x;
    const denom = dt - beta * dx;
    if (Math.abs(denom) < 1e-12) continue;
    const s = (tSlice0 - p0.t) / denom;
    if (s >= 0 && s <= 1) {
      return { x: p0.x + s * dx, t: p0.t + s * dt };
    }
  }
  return null;
}

export function properTimeAlongSegment(
  worldLine: readonly WorldlinePoint[],
  tStart: number,
  tEnd: number,
): number {
  let tau = 0;
  for (let i = 0; i < worldLine.length - 1; i++) {
    const p0 = worldLine[i]!;
    const p1 = worldLine[i + 1]!;
    const t0 = Math.max(p0.t, tStart);
    const t1 = Math.min(p1.t, tEnd);
    if (t1 <= t0) continue;
    const segDt = p1.t - p0.t;
    if (Math.abs(segDt) < 1e-12) continue;
    const segDx = p1.x - p0.x;
    const v = segDx / segDt;
    const dtClipped = t1 - t0;
    const dxClipped = v * dtClipped;
    const dTau2 = dtClipped * dtClipped - dxClipped * dxClipped;
    if (dTau2 > 0) tau += Math.sqrt(dTau2);
  }
  return tau;
}

export function buildInertialWorldline(
  beta: number,
  tMin: number,
  tMax: number,
  x0 = 0,
  numPoints = 100,
): WorldlinePoint[] {
  const points: WorldlinePoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = tMin + (tMax - tMin) * (i / numPoints);
    points.push({ x: x0 + beta * t, t });
  }
  return points;
}

export function buildWorldTube(centerWorldLine: readonly WorldlinePoint[], halfWidth: number): WorldTube {
  return {
    left: centerWorldLine.map(p => ({ x: p.x - halfWidth, t: p.t })),
    right: centerWorldLine.map(p => ({ x: p.x + halfWidth, t: p.t })),
    center: [...centerWorldLine],
  };
}
