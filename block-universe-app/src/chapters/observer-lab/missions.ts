import type { MissionDefinition, MissionStatus, SpacetimeEvent, Observer } from '../../types.ts';
import { classifyRelation } from '../../physics/lorentz.ts';
import { eventsOnSlice } from '../../physics/spacetime.ts';

interface LabSceneState {
  events: readonly SpacetimeEvent[];
  observers: readonly Observer[];
  showLightCones: boolean;
  showSlices: boolean;
}

export const missions: MissionDefinition[] = [
  { id: 'simultaneous-for-whom', title: 'Simultaneous For Whom?', summary: 'Observer-dependent present.', objective: 'Place events and find a pair simultaneous for one observer but not another.', successText: 'Different observers disagree on which events share the same present. This is the core insight.' },
  { id: 'causal-sandbox', title: 'Causal Sandbox', summary: 'Classify all pairs.', objective: 'Classify all event pairs and verify at least one is spacelike.', successText: 'You found spacelike separation — the condition for observer-dependent ordering.' },
  { id: 'share-scenario', title: 'Share Scenario', summary: 'URL encodes your scene.', objective: 'Create a scenario and verify the URL updates to encode it.', successText: 'The URL captures your entire scene. Copy it to share your specific spacetime configuration.' },
];

export function evaluateMission(missionId: string, sceneState: LabSceneState): MissionStatus {
  const events = sceneState.events;
  const observers = sceneState.observers;
  switch (missionId) {
    case 'simultaneous-for-whom': {
      if (observers.length < 2 || events.length < 2) return { complete: false, label: 'Need 2+ observers and 2+ events', detail: 'Add observers and events.' };
      const sliceA = eventsOnSlice(events, observers[0]!.beta, 5, 0.5);
      const sliceB = eventsOnSlice(events, observers[1]!.beta, 5, 0.5);
      const onBothLabels = sliceA.filter(e => sliceB.some(b => b.id === e.id));
      const diff: boolean = sliceA.length !== sliceB.length || onBothLabels.length < sliceA.length;
      return { complete: diff, label: diff ? 'Complete' : 'Same slices', detail: diff ? 'The two observers disagree on which events are simultaneous.' : 'The slices still agree. Try increasing the velocity difference.' };
    }
    case 'causal-sandbox': {
      if (events.length < 2) return { complete: false, label: 'Need 2+ events', detail: 'Place more events.' };
      if (!sceneState.showLightCones) return { complete: false, label: 'Enable light cones', detail: 'Toggle light cones on to classify pairs.' };
      let hasSpacelike = false;
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          if (classifyRelation(events[i]!, events[j]!) === 'spacelike') hasSpacelike = true;
        }
      }
      return { complete: hasSpacelike, label: hasSpacelike ? 'Complete' : 'No spacelike pairs', detail: hasSpacelike ? 'At least one pair is spacelike-separated.' : 'Arrange events so that at least one pair is spacelike.' };
    }
    case 'share-scenario': {
      const complete: boolean = events.length >= 2 && observers.length >= 2;
      return { complete, label: complete ? 'Complete' : 'Build a scene', detail: complete ? 'The URL now encodes your scenario. Copy it to share.' : 'Place at least 2 events and add a second observer to create a shareable scene.' };
    }
    default: return { complete: false, label: 'Unknown', detail: '' };
  }
}
