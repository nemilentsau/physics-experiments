import type { MissionDefinition, MissionStatus, SceneState } from '../../types.ts';
import { eventsOnSlice } from '../../physics/spacetime.ts';

export const missions: MissionDefinition[] = [
  { id: 'find-disagreement', title: 'Find Disagreement', summary: 'Break the flat present.', objective: 'Move the slider until two initially-simultaneous events stop being on the same slice.', successText: 'Events A and C were simultaneous at rest. Your motion separated them. The present is not universal.' },
  { id: 'extreme-tilt', title: 'Extreme Tilt', summary: 'See dramatic reordering.', objective: 'Push velocity past 0.7c to see how far the slice can tilt.', successText: 'At high velocity, events that were "at the same time" are now separated by significant coordinate time.' },
  { id: 'return-to-rest', title: 'Return to Rest', summary: 'Confirm reversibility.', objective: 'Return to v = 0 and confirm the original simultaneity restores.', successText: 'Back at rest, all three events line up again. Nothing moved. Only your now-slice changed.' },
];

export function evaluateMission(missionId: string, sceneState: SceneState): MissionStatus {
  const beta = sceneState.observers[0]?.beta ?? 0;
  const events = sceneState.events;
  switch (missionId) {
    case 'find-disagreement': {
      const onSlice = eventsOnSlice(events, beta, 5, 0.3);
      const complete = Math.abs(beta) > 0.05 && onSlice.length < events.length;
      return { complete, label: complete ? 'Complete' : `${onSlice.length}/${events.length} on slice`, detail: complete ? 'The slice no longer catches all events.' : 'All events are still on the same slice. Try moving the velocity slider.' };
    }
    case 'extreme-tilt': {
      const complete = Math.abs(beta) > 0.7;
      return { complete, label: complete ? 'Complete' : `|v| = ${Math.abs(beta).toFixed(2)}c`, detail: complete ? 'At this velocity, the tilt is dramatic.' : 'Push the velocity past 0.7c.' };
    }
    case 'return-to-rest': {
      const complete = Math.abs(beta) < 0.02;
      const onSlice = eventsOnSlice(events, beta, 5, 0.3);
      return { complete: complete && onSlice.length === events.length, label: complete ? 'Complete' : `v = ${beta.toFixed(2)}c`, detail: complete ? 'All events are simultaneous again. The present restored.' : 'Return the slider to rest (v near 0).' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
