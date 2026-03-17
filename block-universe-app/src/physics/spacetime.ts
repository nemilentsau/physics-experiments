import type { SpacetimeEvent } from '../types.ts';
import { boostEvent } from './lorentz.ts';

export function simultaneityAngle(beta: number): number {
  return Math.atan(beta);
}

export function eventsOnSlice(
  events: readonly SpacetimeEvent[],
  observer: number | { beta: number },
  tPrime = 0,
  tolerance = 0.15,
): SpacetimeEvent[] {
  const beta = typeof observer === 'number' ? observer : observer.beta;
  return events.filter(event => {
    const boosted = boostEvent(event, beta);
    return Math.abs(boosted.t - tPrime) <= tolerance;
  });
}

export function temporalOrder(
  eventA: SpacetimeEvent,
  eventB: SpacetimeEvent,
  observer: number | { beta: number },
  tolerance = 0.01,
): -1 | 0 | 1 {
  const beta = typeof observer === 'number' ? observer : observer.beta;
  const aB = boostEvent(eventA, beta);
  const bB = boostEvent(eventB, beta);
  const dt = bB.t - aB.t;
  if (Math.abs(dt) < tolerance) return 0;
  return dt > 0 ? -1 : 1;
}

export function sliceT(x: number, beta: number, x0 = 0, t0 = 0): number {
  return t0 + beta * (x - x0);
}

let nextId = 0;
export function createEvent(x: number, t: number, label?: string): SpacetimeEvent {
  const id = `evt-${nextId++}`;
  return { id, x, t, label: label ?? String.fromCharCode(65 + (nextId - 1) % 26) };
}

export function resetEventIds(): void {
  nextId = 0;
}

export function boostedCoords(event: SpacetimeEvent, beta: number): SpacetimeEvent {
  return boostEvent(event, beta);
}
