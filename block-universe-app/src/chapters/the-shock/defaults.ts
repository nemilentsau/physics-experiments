import { createSceneState } from '../../state/sceneState.ts';

export const defaultState = createSceneState({
  events: [
    { id: 'evt-A', x: -4, t: 5, label: 'A' },
    { id: 'evt-B', x: 0, t: 5, label: 'B' },
    { id: 'evt-C', x: 4, t: 5, label: 'C' },
  ],
  observers: [{ id: 'obs-0', beta: 0, label: 'You', color: '#4a9eff' }],
  showSlices: true,
});
