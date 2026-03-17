import { createSceneState } from '../../state/sceneState.ts';

export const defaultState = createSceneState({
  events: [
    { id: 'evt-A', x: -3, t: 2, label: 'A' },
    { id: 'evt-B', x: 1, t: 5, label: 'B' },
    { id: 'evt-C', x: 4, t: 8, label: 'C' },
  ],
  observers: [
    { id: 'obs-A', beta: 0, label: 'Observer A', color: '#4a9eff' },
    { id: 'obs-B', beta: 0.5, label: 'Observer B', color: '#ff6b4a' },
  ],
  worldlines: [{ id: 'wl-1', label: 'Object', beta: 0.2, x0: -1, color: '#8dd8e0' }],
  worldtubes: [{ id: 'wt-1', label: 'Extended body', beta: 0.15, x0: 2, halfWidth: 0.6, color: 'rgba(141,216,224,0.10)' }],
  showSlices: true,
  showCompare: false,
  blockView: false,
});
