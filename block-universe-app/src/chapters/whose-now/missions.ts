import type { MissionDefinition, MissionStatus, SceneState } from '../../types.ts';
import { eventsOnSlice } from '../../physics/spacetime.ts';

export const missions: MissionDefinition[] = [
  { id: 'vary-and-inspect', title: 'Vary & Inspect', summary: 'Watch events shift on and off the slice.', objective: 'Change beta and identify which events move on/off the slice.', successText: 'Different velocities produce different present slices through the same set of events.' },
  { id: 'preset-extreme', title: 'Preset Extreme', summary: 'See dramatic separation.', objective: 'Load a preset with high velocity and observe the effect.', successText: 'At extreme velocities, the slice tilts so much that most events leave the present.' },
  { id: 'compare-snapshot', title: 'Compare Snapshot', summary: 'Side-by-side comparison.', objective: 'Compare the rest frame and a high-velocity frame side by side.', successText: '"Simultaneous for whom?" is now a real question you can answer by pointing to the slice.' },
];

export function evaluateMission(missionId: string, sceneState: SceneState & { showCompare?: boolean }): MissionStatus {
  const beta = sceneState.observers[0]?.beta ?? 0;
  const events = sceneState.events;
  switch (missionId) {
    case 'vary-and-inspect': {
      const onSlice = eventsOnSlice(events, beta, 4, 0.5);
      const complete = Math.abs(beta) > 0.1 && onSlice.length !== events.length;
      return { complete, label: complete ? 'Complete' : `${onSlice.length} on slice`, detail: complete ? 'Events shifted off the slice.' : 'Move the slider to change which events are "now".' };
    }
    case 'preset-extreme': {
      const complete = Math.abs(beta) >= 0.7;
      return { complete, label: complete ? 'Complete' : 'Load a preset', detail: complete ? 'Dramatic tilt achieved.' : 'Try one of the high-velocity presets.' };
    }
    case 'compare-snapshot': {
      const complete = (sceneState as { showCompare?: boolean }).showCompare === true;
      return { complete, label: complete ? 'Complete' : 'Enable compare', detail: complete ? 'Side-by-side comparison active.' : 'Toggle comparison mode to see two frames at once.' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
