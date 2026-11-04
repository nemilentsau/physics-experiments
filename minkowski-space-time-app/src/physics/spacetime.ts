// Spacetime event and causal structure utilities

import { intervalSquared, causalRelation, CausalRelation } from './lorentz.ts';

export interface SpacetimeEvent {
  id: number | string;
  x: number;
  t: number;
  label: string;
}

export interface EventInterval {
  dt: number;
  dx: number;
  s2: number;
  relation: CausalRelation;
}

let nextId = 1;

export function createEvent(x: number, t: number, label: string = ''): SpacetimeEvent {
  return { id: nextId++, x, t, label };
}

export function resetEventIds(): void {
  nextId = 1;
}

// Compute interval between two events
export function eventInterval(e1: SpacetimeEvent, e2: SpacetimeEvent): EventInterval {
  const dt = e2.t - e1.t;
  const dx = e2.x - e1.x;
  return {
    dt,
    dx,
    s2: intervalSquared(dt, dx),
    relation: causalRelation(dt, dx),
  };
}

// Check if event B is in the causal future of event A
export function isInCausalFuture(eventA: { x: number; t: number }, eventB: { x: number; t: number }): boolean {
  const dt = eventB.t - eventA.t;
  const dx = eventB.x - eventA.x;
  return dt > 0 && Math.abs(dx) <= dt + 1e-10;
}

// Check if event B is in the causal past of event A
export function isInCausalPast(eventA: { x: number; t: number }, eventB: { x: number; t: number }): boolean {
  return isInCausalFuture(eventB, eventA);
}

// Get the light cone boundaries from an event at a given time
export function lightConeBounds(event: SpacetimeEvent, t: number): { xLeft: number; xRight: number } | null {
  const dt = t - event.t;
  if (dt < 0) return null; // Only future light cone for now
  return {
    xLeft: event.x - dt,
    xRight: event.x + dt,
  };
}

// Classify all pairs of events
export interface EventPair extends EventInterval {
  i: number;
  j: number;
  eventA: SpacetimeEvent;
  eventB: SpacetimeEvent;
}

export function classifyPairs(events: SpacetimeEvent[]): EventPair[] {
  const pairs: EventPair[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const info = eventInterval(events[i]!, events[j]!);
      pairs.push({
        i,
        j,
        eventA: events[i]!,
        eventB: events[j]!,
        ...info,
      });
    }
  }
  return pairs;
}
