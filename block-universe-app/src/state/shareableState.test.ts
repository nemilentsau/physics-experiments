import { describe, it, expect } from 'vitest';
import {
  encodeEvents,
  decodeEvents,
  serializeChapterState,
  deserializeChapterState,
  buildUrl,
  DEFAULT_CHAPTER_STATE,
} from './shareableState.ts';
import type { SpacetimeEvent } from '../types.ts';

function mkEvent(x: number, t: number, label: string, id?: string): SpacetimeEvent {
  return { id: id ?? `evt-${label}`, x, t, label };
}

describe('encodeEvents', () => {
  it('returns null for null input', () => {
    expect(encodeEvents(null)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(encodeEvents([])).toBeNull();
  });

  it('formats correctly', () => {
    const events = [mkEvent(1.5, 3.25, 'A'), mkEvent(-2, 7, 'B')];
    const encoded = encodeEvents(events);
    expect(encoded).toBe('A:1.5,3.25|B:-2,7');
  });
});

describe('decodeEvents', () => {
  it('returns null for null input', () => {
    expect(decodeEvents(null)).toBeNull();
  });

  it('round-trips with encodeEvents', () => {
    const events = [mkEvent(2, 4, 'A'), mkEvent(-3.5, 8, 'B')];
    const encoded = encodeEvents(events);
    const decoded = decodeEvents(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded).toHaveLength(2);
    expect(decoded![0]!.label).toBe('A');
    expect(decoded![0]!.x).toBeCloseTo(2, 3);
    expect(decoded![0]!.t).toBeCloseTo(4, 3);
    expect(decoded![1]!.label).toBe('B');
    expect(decoded![1]!.x).toBeCloseTo(-3.5, 3);
    expect(decoded![1]!.t).toBeCloseTo(8, 3);
  });

  it('deduplicates labels', () => {
    const decoded = decodeEvents('A:1,2|A:3,4');
    expect(decoded).not.toBeNull();
    expect(decoded).toHaveLength(1);
    expect(decoded![0]!.x).toBe(1);
  });

  it('clamps coordinates to valid ranges', () => {
    const decoded = decodeEvents('A:20,50');
    expect(decoded).not.toBeNull();
    expect(decoded![0]!.x).toBeLessThanOrEqual(8);
    expect(decoded![0]!.t).toBeLessThanOrEqual(10);
  });

  it('handles malformed input gracefully', () => {
    expect(decodeEvents('not-valid')).toBeNull();
    expect(decodeEvents('|||')).toBeNull();
    expect(decodeEvents('')).toBeNull();
  });
});

describe('serializeChapterState', () => {
  it('defaults produce empty string', () => {
    expect(serializeChapterState(DEFAULT_CHAPTER_STATE)).toBe('');
  });

  it('chapter only', () => {
    const qs = serializeChapterState({ chapter: 'the-shock' });
    expect(qs).toContain('ch=the-shock');
    expect(qs).not.toContain('obs=');
  });

  it('full state', () => {
    const qs = serializeChapterState({
      chapter: 'causality',
      mission: 'find-flip',
      obs: 0.5,
      cmp: 1,
      lc: 1,
      wt: 1,
      sl: 0,
      bv: 1,
      events: [mkEvent(1, 2, 'A')],
    });
    expect(qs).toContain('ch=causality');
    expect(qs).toContain('m=find-flip');
    expect(qs).toContain('obs=0.5');
    expect(qs).toContain('cmp=1');
    expect(qs).toContain('lc=1');
    expect(qs).toContain('wt=1');
    expect(qs).toContain('sl=0');
    expect(qs).toContain('bv=1');
    expect(qs).toContain('events=');
  });
});

describe('deserializeChapterState', () => {
  it('empty query returns defaults', () => {
    const state = deserializeChapterState('');
    expect(state.chapter).toBe(DEFAULT_CHAPTER_STATE.chapter);
    expect(state.obs).toBe(DEFAULT_CHAPTER_STATE.obs);
    expect(state.sl).toBe(DEFAULT_CHAPTER_STATE.sl);
  });

  it('parses chapter', () => {
    const state = deserializeChapterState('ch=worldlines');
    expect(state.chapter).toBe('worldlines');
  });

  it('parses valid mission', () => {
    const state = deserializeChapterState('ch=the-shock&m=find-disagreement');
    expect(state.mission).toBe('find-disagreement');
  });

  it('rejects invalid mission', () => {
    const state = deserializeChapterState('ch=the-shock&m=nonexistent-mission');
    expect(state.mission).toBeNull();
  });

  it('clamps beta (obs) to [-0.95, 0.95]', () => {
    const state = deserializeChapterState('obs=5');
    expect(state.obs).toBeLessThanOrEqual(0.95);
    expect(state.obs).toBeGreaterThanOrEqual(-0.95);
  });

  it('parses events', () => {
    const state = deserializeChapterState('events=A%3A1%2C2%7CB%3A3%2C4');
    expect(state.events).not.toBeNull();
    expect(state.events).toHaveLength(2);
    expect(state.events![0]!.label).toBe('A');
  });

  it('round-trips with serializeChapterState', () => {
    const original = {
      chapter: 'observer-lab' as const,
      mission: 'causal-sandbox' as const,
      obs: 0.4,
      obs2: null,
      cmp: 1,
      lc: 0,
      wt: 1,
      sl: 0,
      bv: 1,
      events: [mkEvent(2, 3, 'A'), mkEvent(-1, 7, 'B')],
    };
    const serialized = serializeChapterState(original);
    const restored = deserializeChapterState(serialized);
    expect(restored.chapter).toBe(original.chapter);
    expect(restored.mission).toBe(original.mission);
    expect(restored.obs).toBeCloseTo(original.obs, 3);
    expect(restored.cmp).toBe(original.cmp);
    expect(restored.wt).toBe(original.wt);
    expect(restored.sl).toBe(original.sl);
    expect(restored.bv).toBe(original.bv);
    expect(restored.events).toHaveLength(2);
  });
});

describe('buildUrl', () => {
  it('basic URL with chapter', () => {
    const url = buildUrl({ chapter: 'the-shock', state: {} });
    expect(url).toContain('ch=the-shock');
    expect(url).toMatch(/^\//);
  });

  it('URL with events', () => {
    const url = buildUrl({
      chapter: 'observer-lab',
      state: { events: [mkEvent(1, 2, 'A')] },
      pathname: '/app',
      hash: '#intro',
    });
    expect(url).toContain('/app');
    expect(url).toContain('ch=observer-lab');
    expect(url).toContain('events=');
    expect(url).toContain('#intro');
  });
});
