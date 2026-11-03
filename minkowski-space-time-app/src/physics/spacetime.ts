// Spacetime event and causal structure utilities

import { intervalSquared, causalRelation } from './lorentz.js';

let nextId = 1;

export function createEvent(x, t, label = '') {
  return { id: nextId++, x, t, label };
}

export function resetEventIds() {
  nextId = 1;
}

// Compute interval between two events
export function eventInterval(e1, e2) {
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
export function isInCausalFuture(eventA, eventB) {
  const dt = eventB.t - eventA.t;
  const dx = eventB.x - eventA.x;
  return dt > 0 && Math.abs(dx) <= dt + 1e-10;
}

// Check if event B is in the causal past of event A
export function isInCausalPast(eventA, eventB) {
  return isInCausalFuture(eventB, eventA);
}

// Get the light cone boundaries from an event at a given time
export function lightConeBounds(event, t) {
  const dt = t - event.t;
  if (dt < 0) return null; // Only future light cone for now
  return {
    xLeft: event.x - dt,
    xRight: event.x + dt,
  };
}

// Classify all pairs of events
export function classifyPairs(events) {
  const pairs = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const info = eventInterval(events[i], events[j]);
      pairs.push({
        i,
        j,
        eventA: events[i],
        eventB: events[j],
        ...info,
      });
    }
  }
  return pairs;
}
