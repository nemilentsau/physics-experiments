import { createSceneState } from '../../state/sceneState.ts';

export const defaultState = createSceneState({
  events: [
    { id: 'evt-A', x: 0, t: 2, label: 'A' },
    { id: 'evt-B', x: 1, t: 7, label: 'B' },
    { id: 'evt-C', x: 5, t: 3, label: 'C' },
    { id: 'evt-D', x: -3, t: 8, label: 'D' },
  ],
  observers: [{ id: 'obs-0', beta: 0, label: 'Observer', color: '#4a9eff' }],
  showSlices: true,
  showLightCones: true,
});
