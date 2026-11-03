import { describe, expect, it } from 'vitest';
import {
  getBoostMissionStatus,
  getFrameMissionStatus,
  getLightConeMissionStatus,
  getTwinMissionStatus,
} from './missions.js';

describe('mission evaluators', () => {
  it('marks the twin high-gamma mission complete only at reunion-scale settings', () => {
    expect(getTwinMissionStatus({
      missionId: 'high-gamma',
      animProgress: 0.99,
      tauHomeCurrent: 9,
      tauTravCurrent: 4,
      accelFraction: 0.08,
      velocity: 0.92,
      pctLess: '55.4',
    }).complete).toBe(true);

    expect(getTwinMissionStatus({
      missionId: 'high-gamma',
      animProgress: 0.6,
      tauHomeCurrent: 5,
      tauTravCurrent: 3,
      accelFraction: 0.08,
      velocity: 0.92,
      pctLess: '55.4',
    }).complete).toBe(false);
  });

  it('tracks Lorentz and frame mission thresholds', () => {
    expect(getBoostMissionStatus({
      missionId: 'reverse',
      boostV: -0.65,
      showSimultaneity: true,
    }).complete).toBe(true);

    expect(getFrameMissionStatus({
      missionId: 'flip',
      animProgress: 0.5,
      travelerPhase: 'turnaround',
    }).complete).toBe(true);
  });

  it('classifies light-cone mission completion from the event geometry', () => {
    const boundary = getLightConeMissionStatus([
      { label: 'A', x: 0, t: 2 },
      { label: 'B', x: 3, t: 5 },
      { label: 'C', x: -2, t: 7 },
    ], 'boundary');
    expect(boundary.boundaryComplete).toBe(true);
    expect(boundary.status.complete).toBe(true);

    const acausal = getLightConeMissionStatus([
      { label: 'A', x: 0, t: 3 },
      { label: 'B', x: 0.8, t: 6 },
      { label: 'C', x: 4.5, t: 4 },
    ], 'acausal');
    expect(acausal.acausalRelation).toBe('spacelike');
    expect(acausal.status.complete).toBe(true);

    const split = getLightConeMissionStatus([
      { label: 'A', x: 0, t: 5 },
      { label: 'B', x: 0.8, t: 6.4 },
      { label: 'C', x: -1.2, t: 3.2 },
    ], 'past-future');
    expect(split.pastFutureComplete).toBe(true);
    expect(split.status.complete).toBe(true);
  });
});
