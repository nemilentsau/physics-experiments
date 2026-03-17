import type { SceneState, SpacetimeEvent, Observer } from '../types.ts';

interface CreateSceneStateOptions {
  events?: SpacetimeEvent[];
  observers?: Observer[];
  worldlines?: SceneState['worldlines'];
  worldtubes?: SceneState['worldtubes'];
  showLightCones?: boolean;
  showWorldtubes?: boolean;
  showSlices?: boolean;
  showCompare?: boolean;
  blockView?: boolean;
  selectedEventId?: string | null;
  selectedPair?: [string, string] | null;
  sliceTPrime?: number;
}

export function createSceneState(opts: CreateSceneStateOptions = {}): SceneState {
  return {
    events: opts.events ?? [],
    observers: opts.observers ?? [{ id: 'obs-0', beta: 0, label: 'Observer A', color: '#4a9eff' }],
    worldlines: opts.worldlines ?? [],
    worldtubes: opts.worldtubes ?? [],
    showLightCones: opts.showLightCones ?? false,
    showWorldtubes: opts.showWorldtubes ?? false,
    showSlices: opts.showSlices ?? true,
    showCompare: opts.showCompare ?? false,
    blockView: opts.blockView ?? false,
    selectedEventId: opts.selectedEventId ?? null,
    selectedPair: opts.selectedPair ?? null,
    sliceTPrime: opts.sliceTPrime ?? 0,
  };
}

export function addEvent(state: SceneState, event: SpacetimeEvent): SceneState {
  return { ...state, events: [...state.events, event] };
}

export function removeEvent(state: SceneState, eventId: string): SceneState {
  return {
    ...state,
    events: state.events.filter(e => e.id !== eventId),
    selectedEventId: state.selectedEventId === eventId ? null : state.selectedEventId,
  };
}

export function updateEvent(state: SceneState, eventId: string, patch: Partial<SpacetimeEvent>): SceneState {
  return {
    ...state,
    events: state.events.map(e => e.id === eventId ? { ...e, ...patch } : e),
  };
}

export function addObserver(state: SceneState, observer: Observer): SceneState {
  if (state.observers.length >= 4) return state;
  return { ...state, observers: [...state.observers, observer] };
}

export function removeObserver(state: SceneState, observerId: string): SceneState {
  if (state.observers.length <= 1) return state;
  return { ...state, observers: state.observers.filter(o => o.id !== observerId) };
}

export function updateObserver(state: SceneState, observerId: string, patch: Partial<Observer>): SceneState {
  return { ...state, observers: state.observers.map(o => o.id === observerId ? { ...o, ...patch } : o) };
}

export function setObserverBeta(state: SceneState, observerIndex: number, beta: number): SceneState {
  const clamped = Math.max(-0.95, Math.min(0.95, beta));
  return { ...state, observers: state.observers.map((o, i) => i === observerIndex ? { ...o, beta: clamped } : o) };
}

export function toggleCompare(state: SceneState): SceneState {
  return { ...state, showCompare: !state.showCompare };
}

export function toggleLightCones(state: SceneState): SceneState {
  return { ...state, showLightCones: !state.showLightCones };
}

export function toggleWorldtubes(state: SceneState): SceneState {
  return { ...state, showWorldtubes: !state.showWorldtubes };
}

export function toggleBlockView(state: SceneState): SceneState {
  return { ...state, blockView: !state.blockView };
}

export function selectEvent(state: SceneState, eventId: string | null): SceneState {
  return { ...state, selectedEventId: eventId };
}
