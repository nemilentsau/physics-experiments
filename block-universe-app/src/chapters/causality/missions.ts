import type { MissionDefinition, MissionStatus, SceneState } from '../../types.ts';
import { classifyRelation } from '../../physics/lorentz.ts';
import { temporalOrder } from '../../physics/spacetime.ts';

export const missions: MissionDefinition[] = [
  { id: 'find-flip', title: 'Find a Flip', summary: 'Order reversal for spacelike pairs.', objective: 'Find an event pair whose temporal order flips when observer velocity changes, but remains spacelike.', successText: 'Spacelike pairs can have their order reversed. This is not a causal violation — no signal could connect them.' },
  { id: 'causal-pair', title: 'Causal Pair', summary: 'Timelike pairs are fixed.', objective: 'Identify a timelike pair and confirm its order cannot be reversed.', successText: 'Timelike separation means one event could cause the other. The order is absolute.' },
  { id: 'boundary-walk', title: 'Boundary Walk', summary: 'The light cone edge.', objective: 'Drag observer velocity and demonstrate that lightlike pairs stay lightlike.', successText: 'The light cone boundary is invariant. It separates what can influence what.' },
];

export function evaluateMission(missionId: string, sceneState: SceneState): MissionStatus {
  const beta: number = sceneState.observers[0]?.beta ?? 0;
  const events = sceneState.events;
  const selected = sceneState.selectedEventId;
  switch (missionId) {
    case 'find-flip': {
      let foundFlip = false;
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const rel = classifyRelation(events[i]!, events[j]!);
          if (rel === 'spacelike') {
            const restOrder = temporalOrder(events[i]!, events[j]!, 0);
            const boostedOrder = temporalOrder(events[i]!, events[j]!, beta);
            if (restOrder !== 0 && boostedOrder !== 0 && restOrder !== boostedOrder) foundFlip = true;
          }
        }
      }
      return { complete: foundFlip, label: foundFlip ? 'Complete' : `v = ${beta.toFixed(2)}c`, detail: foundFlip ? 'A spacelike pair had its temporal order reversed.' : 'Try different velocities to flip the order of a spacelike pair.' };
    }
    case 'causal-pair': {
      if (!selected) return { complete: false, label: 'Select an event', detail: 'Click an event to start.' };
      const selEvent = events.find(e => e.id === selected);
      if (!selEvent) return { complete: false, label: 'Unknown', detail: '' };
      const timelikePairs = events.filter(e => e.id !== selected && classifyRelation(selEvent, e) === 'timelike');
      return { complete: timelikePairs.length > 0, label: timelikePairs.length > 0 ? 'Complete' : 'Find timelike pair', detail: timelikePairs.length > 0 ? `${selEvent.label} is timelike-separated from ${timelikePairs.map(e => e.label).join(', ')}. Their order is absolute.` : 'Select an event and find one connected to it by a timelike interval.' };
    }
    case 'boundary-walk': {
      const complete: boolean = Math.abs(beta) > 0.5;
      return { complete, label: complete ? 'Complete' : `|v| = ${Math.abs(beta).toFixed(2)}c`, detail: complete ? 'The light cone never tilted. Only the simultaneity slice moved.' : 'Increase velocity past 0.5c while watching the light cone.' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
