import type { SpacetimeEvent, ChapterState } from '../types.ts';

export const CHAPTER_IDS = [
  'the-shock', 'whose-now', 'same-reality', 'causality',
  'worldlines', 'block-view', 'observer-lab',
] as const;

export const MISSION_IDS_BY_CHAPTER: Record<string, Set<string>> = {
  'the-shock': new Set(['find-disagreement', 'extreme-tilt', 'return-to-rest']),
  'whose-now': new Set(['vary-and-inspect', 'preset-extreme', 'compare-snapshot']),
  'same-reality': new Set(['find-shared-event', 'show-disagreement', 'toggle-reality']),
  'causality': new Set(['find-flip', 'causal-pair', 'boundary-walk']),
  'worldlines': new Set(['cross-section', 'toggle-views', 'different-slices']),
  'block-view': new Set(['compare-slices', 'block-reveal', 'fade-to-block']),
  'observer-lab': new Set(['simultaneous-for-whom', 'causal-sandbox', 'share-scenario']),
};

export const DEFAULT_CHAPTER_STATE: Readonly<ChapterState> = Object.freeze({
  chapter: null,
  mission: null,
  obs: 0,
  obs2: null,
  cmp: 0,
  lc: 0,
  wt: 0,
  sl: 1,
  bv: 0,
  events: null,
});

const EVENT_PATTERN = /^([^:|]+):(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function formatNum(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function encodeEvents(events: readonly SpacetimeEvent[] | null): string | null {
  if (!events || events.length === 0) return null;
  return events.map(e => `${e.label}:${formatNum(e.x)},${formatNum(e.t)}`).join('|');
}

export function decodeEvents(str: string | null): SpacetimeEvent[] | null {
  if (!str) return null;
  const entries = String(str).split('|').map(seg => seg.trim()).filter(Boolean);
  const seen = new Set<string>();
  const results: SpacetimeEvent[] = [];

  entries.forEach((seg, i) => {
    const m = seg.match(EVENT_PATTERN);
    if (!m) return;
    const label = m[1]!.trim().slice(0, 2).toUpperCase();
    if (seen.has(label)) return;
    seen.add(label);
    results.push({
      id: `evt-${label}-${i}`,
      label,
      x: clamp(Number(m[2]), -8, 8, 0),
      t: clamp(Number(m[3]), 0, 10, 0),
    });
  });

  return results.length > 0 ? results : null;
}

export function serializeChapterState(state: Partial<ChapterState>): string {
  const params = new URLSearchParams();
  const s = { ...DEFAULT_CHAPTER_STATE, ...state };

  if (s.chapter && (CHAPTER_IDS as readonly string[]).includes(s.chapter)) params.set('ch', s.chapter);
  if (s.mission) {
    const validMissions = s.chapter ? MISSION_IDS_BY_CHAPTER[s.chapter] : undefined;
    if (validMissions?.has(s.mission)) params.set('m', s.mission);
  }
  if (s.obs !== 0) params.set('obs', formatNum(s.obs));
  if (s.obs2 !== null && s.obs2 !== undefined) params.set('obs2', formatNum(s.obs2));
  if (s.cmp !== 0) params.set('cmp', '1');
  if (s.lc !== 0) params.set('lc', '1');
  if (s.wt !== 0) params.set('wt', '1');
  if (s.sl !== 1) params.set('sl', '0');
  if (s.bv !== 0) params.set('bv', '1');

  const encoded = encodeEvents(s.events ?? null);
  if (encoded) params.set('events', encoded);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function deserializeChapterState(query = '', defaults: Partial<ChapterState> = {}): ChapterState {
  const params = new URLSearchParams(query.startsWith('?') ? query : `?${query}`);
  const merged = { ...DEFAULT_CHAPTER_STATE, ...defaults };

  const ch = params.get('ch');
  const chapter = ch && (CHAPTER_IDS as readonly string[]).includes(ch) ? ch : merged.chapter;

  const missionRaw = params.get('m');
  const validMissions = chapter ? MISSION_IDS_BY_CHAPTER[chapter] : undefined;
  const mission = missionRaw && validMissions?.has(missionRaw) ? missionRaw : merged.mission;

  return {
    chapter,
    mission,
    obs: clamp(Number(params.get('obs') ?? merged.obs), -0.95, 0.95, merged.obs),
    obs2: params.has('obs2') ? clamp(Number(params.get('obs2')), -0.95, 0.95, 0) : merged.obs2,
    cmp: params.get('cmp') === '1' ? 1 : (params.get('cmp') === '0' ? 0 : merged.cmp),
    lc: params.get('lc') === '1' ? 1 : (params.get('lc') === '0' ? 0 : merged.lc),
    wt: params.get('wt') === '1' ? 1 : (params.get('wt') === '0' ? 0 : merged.wt),
    sl: params.get('sl') === '0' ? 0 : (params.get('sl') === '1' ? 1 : merged.sl),
    bv: params.get('bv') === '1' ? 1 : (params.get('bv') === '0' ? 0 : merged.bv),
    events: decodeEvents(params.get('events')) ?? merged.events ?? null,
  };
}

export function buildUrl({ chapter, state, pathname = '/', hash = '' }: {
  chapter: string;
  state: Partial<ChapterState>;
  pathname?: string;
  hash?: string;
}): string {
  return `${pathname}${serializeChapterState({ ...state, chapter })}${hash}`;
}
