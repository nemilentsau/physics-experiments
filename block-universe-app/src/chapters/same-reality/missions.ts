import type { MissionDefinition, MissionStatus, SceneState } from '../../types.ts';
import { eventsOnSlice } from '../../physics/spacetime.ts';

export const missions: MissionDefinition[] = [
  { id: 'find-shared-event', title: 'Shared Event', summary: 'Find common ground.', objective: 'Identify an event that both observers include in their present.', successText: 'Both observers agree this event is happening "now" -- even with different slices.' },
  { id: 'show-disagreement', title: 'Show Disagreement', summary: 'Find where they diverge.', objective: 'Find a configuration where observers disagree on the ordering of two events.', successText: 'Observer A says one event comes first; Observer B says the other does. Both are correct in their frame.' },
  { id: 'toggle-reality', title: 'Toggle Reality', summary: 'Same events, always.', objective: 'Compare slices and confirm the underlying event set is identical.', successText: 'One event. Two valid descriptions. The events themselves never changed.' },
];

export function evaluateMission(missionId: string, sceneState: SceneState & { showCompare?: boolean }): MissionStatus {
  const betaA = sceneState.observers[0]?.beta ?? 0;
  const betaB = sceneState.observers[1]?.beta ?? 0.6;
  const events = sceneState.events;
  switch (missionId) {
    case 'find-shared-event': {
      const onA = eventsOnSlice(events, betaA, 4.5, 0.6);
      const onB = eventsOnSlice(events, betaB, 4.5, 0.6);
      const shared = onA.filter(e => onB.some(b => b.id === e.id));
      return { complete: shared.length > 0, label: shared.length > 0 ? 'Complete' : 'Searching...', detail: shared.length > 0 ? `Event${shared.length > 1 ? 's' : ''} ${shared.map(e => e.label).join(', ')} shared by both.` : 'Adjust observer velocities to find a shared event on both slices.' };
    }
    case 'show-disagreement': {
      const diff = Math.abs(betaA - betaB);
      const complete = diff > 0.3;
      return { complete, label: complete ? 'Complete' : `Difference: ${diff.toFixed(2)}`, detail: complete ? 'The two slices tilt differently enough to reorder events.' : 'Increase the velocity difference between observers.' };
    }
    case 'toggle-reality': {
      const complete = (sceneState as { showCompare?: boolean }).showCompare === true;
      return { complete, label: complete ? 'Complete' : 'Toggle on', detail: complete ? 'Both panels show the same events. Only the slice angles differ.' : 'Enable the "same events" toggle.' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
