import { causalRelation, intervalSquared, CausalRelation } from '../physics/lorentz.ts';
import { isInCausalFuture, isInCausalPast } from '../physics/spacetime.ts';
import type { TravelerPhase } from '../physics/worldline.ts';

export interface MissionStatus {
  complete: boolean;
  label: string;
  detail: string;
}

interface TwinMissionParams {
  missionId: string;
  animProgress: number;
  tauHomeCurrent: number;
  tauTravCurrent: number;
  accelFraction: number;
  velocity: number;
  pctLess: string | number;
}

interface BoostMissionParams {
  missionId: string;
  boostV: number;
  showSimultaneity: boolean;
}

interface FrameMissionParams {
  missionId: string;
  animProgress: number;
  travelerPhase: TravelerPhase;
}

interface LightConeEvent {
  label: string;
  x: number;
  t: number;
}

export interface LightConeMissionResult {
  eventA: LightConeEvent | undefined;
  eventB: LightConeEvent | undefined;
  eventC: LightConeEvent | undefined;
  boundaryS2: number | null;
  boundaryComplete: boolean;
  acausalRelation: CausalRelation | null;
  pastFutureComplete: boolean;
  status: MissionStatus;
}

export function getTwinMissionStatus({
  missionId,
  animProgress,
  tauHomeCurrent,
  tauTravCurrent,
  accelFraction,
  velocity,
  pctLess,
}: TwinMissionParams): MissionStatus {
  if (missionId === 'coast-gap') {
    return {
      complete: animProgress > 0.4 && (tauHomeCurrent - tauTravCurrent) > 0.5,
      label: 'Scrub past 40%',
      detail: 'Watch the proper-time bars before turnaround. The gap should already be visible during the outbound coast.',
    };
  }

  if (missionId === 'wide-turn') {
    return {
      complete: accelFraction >= 0.3 && animProgress > 0.98,
      label: 'Reach reunion',
      detail: 'Stretch the acceleration phase, then carry the run to reunion and compare the final age difference.',
    };
  }

  return {
    complete: velocity >= 0.9 && animProgress > 0.98 && Number(pctLess) >= 50,
    label: 'Push high γ',
    detail: 'This preset pays off at reunion: the traveler should finish at least 50% younger than the home twin.',
  };
}

export function getBoostMissionStatus({ missionId, boostV, showSimultaneity }: BoostMissionParams): MissionStatus {
  if (missionId === 'tilt') {
    return {
      complete: Math.abs(boostV) >= 0.55,
      label: 'Reach β≈0.6',
      detail: 'As β climbs, both primed axes lean toward the cone. You want a tilt large enough to read without crowding the cone completely.',
    };
  }

  if (missionId === 'simultaneity') {
    return {
      complete: Math.abs(boostV) >= 0.75 && showSimultaneity,
      label: 'Show t′=0',
      detail: 'Keep the simultaneity line visible while pushing β high enough that horizontal and primed-now are clearly different.',
    };
  }

  return {
    complete: boostV <= -0.55,
    label: 'Boost left',
    detail: 'Run the same geometry in the opposite direction. The physics is unchanged; only the tilt flips.',
  };
}

export function getFrameMissionStatus({ missionId, animProgress, travelerPhase }: FrameMissionParams): MissionStatus {
  if (missionId === 'turnaround') {
    return {
      complete: animProgress >= 0.46 && animProgress <= 0.54,
      label: 'Pause near midpoint',
      detail: 'The key comparison point is the turnaround band. Scrub into the middle of the trip until the frame swap is visually active.',
    };
  }

  if (missionId === 'flip') {
    return {
      complete: travelerPhase === 'turnaround',
      label: 'Enter frame flip',
      detail: 'The mission is complete as soon as the traveler is in the turnaround phase and the right-hand frame is actively transitioning.',
    };
  }

  return {
    complete: animProgress > 0.98,
    label: 'Reach reunion',
    detail: 'Carry the same event set all the way to reunion so both panels can collapse back onto a shared ending.',
  };
}

export function getLightConeMissionStatus(events: LightConeEvent[], missionId: string): LightConeMissionResult {
  const eventA = events.find((event) => event.label === 'A');
  const eventB = events.find((event) => event.label === 'B');
  const eventC = events.find((event) => event.label === 'C');

  const boundaryS2 = eventA && eventB
    ? intervalSquared(eventB.t - eventA.t, eventB.x - eventA.x)
    : null;
  const boundaryComplete = boundaryS2 !== null && Math.abs(boundaryS2) < 0.18;

  const acausalRelation = eventA && eventC
    ? causalRelation(eventC.t - eventA.t, eventC.x - eventA.x)
    : null;

  const pastFutureComplete = Boolean(
    eventA
    && eventB
    && eventC
    && isInCausalFuture(eventA, eventB)
    && isInCausalPast(eventA, eventC)
    && causalRelation(eventB.t - eventA.t, eventB.x - eventA.x) === 'timelike'
    && causalRelation(eventC.t - eventA.t, eventC.x - eventA.x) === 'timelike'
  );

  const status = missionId === 'boundary'
    ? {
      complete: boundaryComplete,
      label: 'Drag B to cone',
      detail: 'Select A and drag B until the A↔B interval lands exactly on the boundary with s²≈0.',
    }
    : missionId === 'acausal'
      ? {
        complete: acausalRelation === 'spacelike',
        label: 'Move C outside',
        detail: 'Push C far enough away from A that their separation becomes spacelike and no signal can connect them.',
      }
      : {
        complete: pastFutureComplete,
        label: 'Build both halves',
        detail: 'Keep B in A’s causal future and drag C into A’s causal past so one event sits on each side of the cone.',
      };

  return {
    eventA,
    eventB,
    eventC,
    boundaryS2,
    boundaryComplete,
    acausalRelation,
    pastFutureComplete,
    status,
  };
}
