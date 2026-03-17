import type { ComponentType } from 'react';

export interface SpacetimeEvent {
  readonly id: string;
  readonly x: number;
  readonly t: number;
  readonly label: string;
}

export interface Observer {
  readonly id: string;
  readonly beta: number;
  readonly label: string;
  readonly color: string;
}

export interface WorldlineDefinition {
  readonly id: string;
  readonly label: string;
  readonly beta: number;
  readonly x0: number;
  readonly color: string;
}

export interface WorldtubeDefinition {
  readonly id: string;
  readonly label: string;
  readonly beta: number;
  readonly x0: number;
  readonly halfWidth: number;
  readonly color: string;
}

export interface SceneState {
  readonly events: readonly SpacetimeEvent[];
  readonly observers: readonly Observer[];
  readonly worldlines: readonly WorldlineDefinition[];
  readonly worldtubes: readonly WorldtubeDefinition[];
  readonly showLightCones: boolean;
  readonly showWorldtubes: boolean;
  readonly showSlices: boolean;
  readonly showCompare: boolean;
  readonly blockView: boolean;
  readonly selectedEventId: string | null;
  readonly selectedPair: [string, string] | null;
  readonly sliceTPrime: number;
}

export interface WorldlinePoint {
  readonly x: number;
  readonly t: number;
}

export interface WorldTube {
  readonly left: readonly WorldlinePoint[];
  readonly right: readonly WorldlinePoint[];
  readonly center: readonly WorldlinePoint[];
}

export interface PixelCoord {
  readonly px: number;
  readonly py: number;
}

export interface SpacetimeCoord {
  readonly x: number;
  readonly t: number;
}

export interface Margins {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export type ToPixelFn = (x: number, t: number) => PixelCoord;

export interface MissionDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly successText: string;
  action?: () => void;
}

export interface MissionStatus {
  readonly complete: boolean;
  readonly label: string;
  readonly detail: string;
}

export type CausalRelation = 'timelike' | 'spacelike' | 'lightlike';

export interface ChapterState {
  chapter: string | null;
  mission: string | null;
  obs: number;
  obs2: number | null;
  cmp: number;
  lc: number;
  wt: number;
  sl: number;
  bv: number;
  events: SpacetimeEvent[] | null;
  [key: string]: unknown;
}

export interface ChapterProps {
  chapterState: ChapterState;
  onStateChange: (patch: Partial<ChapterState>) => void;
}

export interface ChapterDefinition {
  readonly id: string;
  readonly chapter: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly goal: string;
  readonly takeaway: string;
  readonly color: string;
  readonly icon: string;
  readonly Component: ComponentType<ChapterProps>;
}

export interface FoliationSlice {
  readonly tPrime: number;
  readonly beta: number;
  readonly intercept: number;
  readonly slope: number;
}

export interface LightConeBoundsResult {
  readonly xLeft: number;
  readonly xRight: number;
}

export interface ViewportInfo {
  readonly width: number;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isCompact: boolean;
}

export interface AnimationLoopResult {
  readonly progress: number;
  readonly isPlaying: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  readonly reset: () => void;
  readonly scrub: (value: number) => void;
}

export interface SliceLineOptions {
  color?: string;
  lineWidth?: number;
  glow?: boolean;
  dash?: number[] | null;
  label?: string | null;
}

export interface EventDrawOptions {
  color?: string;
  size?: number;
  selected?: boolean;
  hovered?: boolean;
  showLabel?: boolean;
}

export interface LightConeDrawOptions {
  color?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
}

export interface WorldLineDrawOptions {
  color?: string;
  lineWidth?: number;
  dash?: number[] | null;
}

export interface WorldTubeDrawOptions {
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}
