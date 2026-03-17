import { createSceneState } from '../../state/sceneState.ts';
import type { SceneState } from '../../types.ts';

export const defaultState: SceneState = createSceneState({
  events: [
    { id: 'evt-A', x: -3, t: 3, label: 'A' },
    { id: 'evt-B', x: 2, t: 5, label: 'B' },
    { id: 'evt-C', x: 4, t: 2, label: 'C' },
  ],
  observers: [{ id: 'obs-0', beta: 0, label: 'Observer 1', color: '#4a9eff' }],
  showSlices: true,
  showLightCones: false,
});

export interface LabPreset {
  name: string;
  events: { id: string; x: number; t: number; label: string }[];
  observers: { id: string; beta: number; label: string; color: string }[];
}

export const presets: LabPreset[] = [
  { name: 'Twin Flash', events: [{ id: 'p-A', x: -4, t: 5, label: 'A' }, { id: 'p-B', x: 4, t: 5, label: 'B' }], observers: [{ id: 'obs-0', beta: 0, label: 'Rest', color: '#4a9eff' }] },
  { name: 'Causal Chain', events: [{ id: 'p-A', x: 0, t: 1, label: 'A' }, { id: 'p-B', x: 1, t: 4, label: 'B' }, { id: 'p-C', x: 2, t: 7, label: 'C' }], observers: [{ id: 'obs-0', beta: 0, label: 'Rest', color: '#4a9eff' }] },
  { name: 'Spacelike Trio', events: [{ id: 'p-A', x: -5, t: 4, label: 'A' }, { id: 'p-B', x: 0, t: 4.5, label: 'B' }, { id: 'p-C', x: 5, t: 4, label: 'C' }], observers: [{ id: 'obs-0', beta: 0, label: 'Rest', color: '#4a9eff' }, { id: 'obs-1', beta: 0.6, label: 'Moving', color: '#ff6b4a' }] },
  { name: 'Diamond', events: [{ id: 'p-A', x: 0, t: 2, label: 'A' }, { id: 'p-B', x: -3, t: 5, label: 'B' }, { id: 'p-C', x: 3, t: 5, label: 'C' }, { id: 'p-D', x: 0, t: 8, label: 'D' }], observers: [{ id: 'obs-0', beta: 0, label: 'Rest', color: '#4a9eff' }] },
  { name: 'Four Observers', events: [{ id: 'p-A', x: 0, t: 5, label: 'A' }, { id: 'p-B', x: 3, t: 5, label: 'B' }], observers: [{ id: 'obs-0', beta: 0, label: 'Obs 1', color: '#4a9eff' }, { id: 'obs-1', beta: 0.3, label: 'Obs 2', color: '#ff6b4a' }, { id: 'obs-2', beta: -0.4, label: 'Obs 3', color: '#00e5cc' }, { id: 'obs-3', beta: 0.7, label: 'Obs 4', color: '#c77dff' }] },
];
