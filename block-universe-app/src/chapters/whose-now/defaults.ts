import { createSceneState } from '../../state/sceneState.ts';

export const defaultState = createSceneState({
  events: [
    { id: 'evt-A', x: -5, t: 3.8, label: 'A' },
    { id: 'evt-B', x: -2, t: 4.2, label: 'B' },
    { id: 'evt-C', x: 0, t: 4.0, label: 'C' },
    { id: 'evt-D', x: 3, t: 3.6, label: 'D' },
    { id: 'evt-E', x: 5, t: 4.4, label: 'E' },
  ],
  observers: [{ id: 'obs-0', beta: 0, label: 'Observer', color: '#4a9eff' }],
  showSlices: true,
});

export interface WhoseNowPreset {
  name: string;
  beta: number;
  label: string;
}

export const presets: WhoseNowPreset[] = [
  { name: 'Spread', beta: 0, label: 'Five events, rest frame' },
  { name: 'Fast Right', beta: 0.8, label: 'High velocity rightward' },
  { name: 'Fast Left', beta: -0.7, label: 'High velocity leftward' },
];
