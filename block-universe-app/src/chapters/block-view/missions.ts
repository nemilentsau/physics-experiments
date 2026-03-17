import type { MissionDefinition, MissionStatus } from '../../types.ts';

interface BlockViewSceneState { showCompare: boolean; blockView: boolean; }

export const missions: MissionDefinition[] = [
  { id: 'compare-slices', title: 'Compare Slices', summary: 'Two observers, one spacetime.', objective: 'View two observer slices simultaneously and identify where they diverge.', successText: 'The slices tilt at different angles. Each observer sees a different "now" — but through the same spacetime.' },
  { id: 'block-reveal', title: 'Block Reveal', summary: 'See the whole picture.', objective: 'Trigger the guided reveal animation to see the full block view emerge.', successText: 'The block view shows all of spacetime at once. Events, worldlines, and slices are all part of one geometry.' },
  { id: 'fade-to-block', title: 'Fade to Block', summary: 'Everything was already there.', objective: 'Toggle to full block view and confirm all events are always present.', successText: 'Nothing new was added. Only the geometry was taken seriously.' },
];

export function evaluateMission(missionId: string, sceneState: BlockViewSceneState): MissionStatus {
  switch (missionId) {
    case 'compare-slices': {
      const complete: boolean = sceneState.showCompare;
      return { complete, label: complete ? 'Complete' : 'Enable compare', detail: complete ? 'Both slices visible. The divergence is clear.' : 'Toggle compare mode to see both observer slices.' };
    }
    case 'block-reveal': {
      const complete: boolean = sceneState.blockView;
      return { complete, label: complete ? 'Complete' : 'Trigger reveal', detail: complete ? 'The full block is revealed.' : 'Click the block view button to trigger the reveal.' };
    }
    case 'fade-to-block': {
      const complete: boolean = sceneState.blockView;
      return { complete, label: complete ? 'Complete' : 'Enable block view', detail: complete ? 'All events are always present. The block universe is the complete geometry.' : 'Toggle to full block view.' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
