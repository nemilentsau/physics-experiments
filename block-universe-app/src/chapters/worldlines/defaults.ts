import { createSceneState } from '../../state/sceneState.ts';

export const defaultState = createSceneState({
  events: [],
  observers: [{ id: 'obs-0', beta: 0, label: 'Observer', color: '#4a9eff' }],
  worldlines: [
    { id: 'wl-stationary', label: 'Station', beta: 0, x0: -2, color: '#4a9eff' },
    { id: 'wl-moving', label: 'Ship', beta: 0.4, x0: 0, color: '#ff6b4a' },
  ],
  worldtubes: [
    { id: 'wt-ship', label: 'Ship hull', beta: 0.4, x0: 3, halfWidth: 0.8, color: 'rgba(141,216,224,0.12)' },
  ],
  showSlices: true,
  showWorldtubes: true,
});
