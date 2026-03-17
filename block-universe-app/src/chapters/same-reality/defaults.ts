import { createSceneState } from '../../state/sceneState.ts';

export const defaultState = createSceneState({
  events: [
    { id: 'evt-A', x: -4, t: 4.2, label: 'A' },
    { id: 'evt-B', x: -1, t: 4.8, label: 'B' },
    { id: 'evt-C', x: 2, t: 4.3, label: 'C' },
    { id: 'evt-D', x: 5, t: 4.7, label: 'D' },
  ],
  observers: [
    { id: 'obs-A', beta: 0, label: 'Observer A', color: '#4a9eff' },
    { id: 'obs-B', beta: 0.6, label: 'Observer B', color: '#ff6b4a' },
  ],
  showSlices: true,
  showCompare: false,
});
