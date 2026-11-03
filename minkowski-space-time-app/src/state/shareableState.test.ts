import { describe, expect, it } from 'vitest';
import {
  DEFAULT_JOURNEY_STATE,
  buildSearchFromAppState,
  parseAppStateFromSearch,
  sanitizeJourneyState,
} from './shareableState.js';

describe('shareable app state', () => {
  it('round-trips chapter, parameters, and light-cone scene through the URL', () => {
    const search = buildSearchFromAppState({
      activeExp: 'light-cones',
      journeyState: {
        ...DEFAULT_JOURNEY_STATE,
        beta: 0.88,
        boostBeta: -0.65,
        tripDistance: 6.5,
        accelFraction: 0.21,
        boostMission: 'reverse',
        lightConeMission: 'past-future',
        lightConeScene: 'A:0,5|B:0.8,6.4|C:-2.2,4.6',
        lightConeSelectedLabel: 'C',
      },
    });

    expect(parseAppStateFromSearch(search)).toEqual({
      activeExp: 'light-cones',
      journeyState: {
        ...DEFAULT_JOURNEY_STATE,
        beta: 0.88,
        boostBeta: -0.65,
        tripDistance: 6.5,
        accelFraction: 0.21,
        boostMission: 'reverse',
        lightConeMission: 'past-future',
        lightConeScene: 'A:0,5|B:0.8,6.4|C:-2.2,4.6',
        lightConeSelectedLabel: 'C',
      },
    });
  });

  it('preserves an explicitly empty light-cone scene', () => {
    const search = buildSearchFromAppState({
      activeExp: 'light-cones',
      journeyState: {
        ...DEFAULT_JOURNEY_STATE,
        lightConeScene: 'empty',
      },
    });

    const parsed = parseAppStateFromSearch(search);
    expect(parsed.activeExp).toBe('light-cones');
    expect(parsed.journeyState.lightConeScene).toBe('empty');
  });

  it('sanitizes impossible URL values back into safe ranges', () => {
    expect(sanitizeJourneyState({
      beta: '12',
      boostBeta: '-7',
      tripDistance: '-4',
      accelFraction: '2',
      twinMission: 'unknown',
      lightConeScene: 'broken',
      lightConeSelectedLabel: 'Q',
    })).toEqual({
      ...DEFAULT_JOURNEY_STATE,
      beta: 0.99,
      boostBeta: -0.9,
      tripDistance: 1,
      accelFraction: 0.45,
      lightConeScene: DEFAULT_JOURNEY_STATE.lightConeScene,
      lightConeSelectedLabel: null,
    });
  });
});
