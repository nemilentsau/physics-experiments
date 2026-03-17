import type { MissionDefinition, MissionStatus } from '../../types.ts';

interface WorldlineSceneState {
  observers: readonly { beta: number }[];
  sliceTPrime: number;
  showWorldtubes: boolean;
}

export const missions: MissionDefinition[] = [
  { id: 'cross-section', title: 'Cross-Section', summary: 'Slice the ship.', objective: 'Move the slice until it cuts the ship worldtube at a visible cross-section.', successText: 'The slice cuts through the worldtube — that cross-section is "the ship right now" for this observer.' },
  { id: 'toggle-views', title: 'Toggle Views', summary: 'Moment vs worldline.', objective: 'Switch between moment view and worldline view to see the difference.', successText: 'Moment view shows a snapshot. Worldline view shows the complete spacetime history.' },
  { id: 'different-slices', title: 'Different Slices', summary: 'Two observers, one ship.', objective: 'Compare what two observers see as "the ship right now".', successText: 'Different slices cut the worldtube at different angles, producing different "ships right now".' },
];

export function evaluateMission(missionId: string, sceneState: WorldlineSceneState): MissionStatus {
  const beta: number = sceneState.observers[0]?.beta ?? 0;
  switch (missionId) {
    case 'cross-section': {
      const complete: boolean = Math.abs(sceneState.sliceTPrime - 5) < 2;
      return { complete, label: complete ? 'Complete' : 'Adjust slice', detail: complete ? 'The slice intersects the worldtube.' : 'Move the slice position to cut through the ship.' };
    }
    case 'toggle-views': {
      const complete: boolean = sceneState.showWorldtubes;
      return { complete, label: complete ? 'Complete' : 'Show worldtubes', detail: complete ? 'Worldtube view active — the ship extends through time.' : 'Enable worldtube view to see the full spacetime path.' };
    }
    case 'different-slices': {
      const complete: boolean = Math.abs(beta) > 0.2;
      return { complete, label: complete ? 'Complete' : `v = ${beta.toFixed(2)}c`, detail: complete ? 'At this velocity, the slice cuts the worldtube at a different angle.' : 'Change observer velocity to see a different cross-section.' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
