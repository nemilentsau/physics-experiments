import type { SpacetimeEvent, CausalRelation } from '../types.ts';

export function gamma(beta: number): number {
  return 1 / Math.sqrt(1 - beta * beta);
}

export function boostEvent<T extends { x: number; t: number }>(event: T, beta: number): T {
  const g = gamma(beta);
  return {
    ...event,
    t: g * (event.t - beta * event.x),
    x: g * (event.x - beta * event.t),
  };
}

export function inverseBoostEvent<T extends { x: number; t: number }>(event: T, beta: number): T {
  return boostEvent(event, -beta);
}

export function intervalSquared(eventA: SpacetimeEvent, eventB: SpacetimeEvent): number {
  const dt = eventB.t - eventA.t;
  const dx = eventB.x - eventA.x;
  return dx * dx - dt * dt;
}

export function classifyRelation(eventA: SpacetimeEvent, eventB: SpacetimeEvent): CausalRelation {
  const s2 = intervalSquared(eventA, eventB);
  const eps = 1e-10;
  if (s2 < -eps) return 'timelike';
  if (s2 > eps) return 'spacelike';
  return 'lightlike';
}

export function boostCoords(t: number, x: number, beta: number): { t: number; x: number } {
  const g = gamma(beta);
  return {
    t: g * (t - beta * x),
    x: g * (x - beta * t),
  };
}
