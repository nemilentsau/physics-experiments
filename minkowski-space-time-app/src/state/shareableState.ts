const EXPERIENCE_IDS = [
  'twin-paradox',
  'lorentz-boost',
  'reference-frames',
  'light-cones',
];

const TWIN_MISSION_IDS = new Set(['coast-gap', 'wide-turn', 'high-gamma']);
const BOOST_MISSION_IDS = new Set(['tilt', 'simultaneity', 'reverse']);
const FRAME_MISSION_IDS = new Set(['turnaround', 'flip', 'reunion']);
const LIGHT_CONE_MISSION_IDS = new Set(['boundary', 'acausal', 'past-future']);

export const DEFAULT_LIGHT_CONE_SCENE = 'A:0,3|B:2,7|C:-3,5';
const EMPTY_LIGHT_CONE_SCENE = 'empty';

export const DEFAULT_JOURNEY_STATE = Object.freeze({
  beta: 0.6,
  boostBeta: null,
  tripDistance: 4,
  accelFraction: 0.08,
  twinMission: 'coast-gap',
  boostMission: 'tilt',
  frameMission: 'turnaround',
  lightConeMission: 'boundary',
  lightConeScene: DEFAULT_LIGHT_CONE_SCENE,
  lightConeSelectedLabel: null,
});

export const DEFAULT_APP_STATE = Object.freeze({
  activeExp: null,
  journeyState: DEFAULT_JOURNEY_STATE,
});

const LIGHT_CONE_SCENE_PATTERN = /^([^:|]+):(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function sanitizeMission(value, validIds, fallback) {
  return validIds.has(value) ? value : fallback;
}

function formatNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function canonicalizeSceneEntries(entries) {
  const deduped = [];
  const seen = new Set();

  entries.forEach((entry) => {
    const label = String(entry.label ?? '').trim().slice(0, 2).toUpperCase();
    if (!label || seen.has(label)) return;

    deduped.push({
      label,
      x: clampNumber(Number(entry.x), -8, 8, 0),
      t: clampNumber(Number(entry.t), 0, 10, 0),
    });
    seen.add(label);
  });

  return deduped;
}

export function decodeLightConeScene(scene = DEFAULT_LIGHT_CONE_SCENE) {
  if (scene === EMPTY_LIGHT_CONE_SCENE) return [];

  const rawEntries = String(scene)
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const parsedEntries = rawEntries
    .map((segment) => {
      const match = segment.match(LIGHT_CONE_SCENE_PATTERN);
      if (!match) return null;

      return {
        label: match[1],
        x: Number(match[2]),
        t: Number(match[3]),
      };
    })
    .filter(Boolean);

  const entries = canonicalizeSceneEntries(parsedEntries);
  const fallbackEntries = canonicalizeSceneEntries(
    DEFAULT_LIGHT_CONE_SCENE.split('|').map((segment) => {
      const [, label, x, t] = segment.match(LIGHT_CONE_SCENE_PATTERN);
      return { label, x: Number(x), t: Number(t) };
    }),
  );

  const finalEntries = entries.length > 0 ? entries : fallbackEntries;

  return finalEntries.map((entry, index) => ({
    id: `${entry.label}-${index}`,
    ...entry,
  }));
}

export function encodeLightConeScene(events) {
  const canonical = canonicalizeSceneEntries(events ?? []);
  if (canonical.length === 0) return EMPTY_LIGHT_CONE_SCENE;

  return canonical
    .map((event) => `${event.label}:${formatNumber(event.x)},${formatNumber(event.t)}`)
    .join('|');
}

export function getNextLightConeLabel(events) {
  const labels = (events ?? [])
    .map((event) => String(event.label ?? '').trim().toUpperCase())
    .filter(Boolean);

  if (labels.length === 0) return 'A';

  const highestCode = labels.reduce((maxCode, label) => {
    const code = label.charCodeAt(0);
    return Number.isFinite(code) ? Math.max(maxCode, code) : maxCode;
  }, 64);

  return highestCode >= 90 ? 'Z' : String.fromCharCode(highestCode + 1);
}

export function sanitizeJourneyState(input = {}) {
  const lightConeEvents = decodeLightConeScene(input.lightConeScene ?? DEFAULT_JOURNEY_STATE.lightConeScene);
  const lightConeScene = encodeLightConeScene(lightConeEvents);
  const selectedLabel = input.lightConeSelectedLabel;
  const hasSelectedLabel = lightConeEvents.some((event) => event.label === selectedLabel);
  const rawBoostBeta = input.boostBeta;
  const boostBeta = rawBoostBeta === null || rawBoostBeta === undefined || rawBoostBeta === ''
    ? null
    : clampNumber(Number(rawBoostBeta), -0.9, 0.9, null);

  return {
    beta: clampNumber(Number(input.beta), 0.1, 0.99, DEFAULT_JOURNEY_STATE.beta),
    boostBeta,
    tripDistance: clampNumber(Number(input.tripDistance), 1, 10, DEFAULT_JOURNEY_STATE.tripDistance),
    accelFraction: clampNumber(Number(input.accelFraction), 0.01, 0.45, DEFAULT_JOURNEY_STATE.accelFraction),
    twinMission: sanitizeMission(input.twinMission, TWIN_MISSION_IDS, DEFAULT_JOURNEY_STATE.twinMission),
    boostMission: sanitizeMission(input.boostMission, BOOST_MISSION_IDS, DEFAULT_JOURNEY_STATE.boostMission),
    frameMission: sanitizeMission(input.frameMission, FRAME_MISSION_IDS, DEFAULT_JOURNEY_STATE.frameMission),
    lightConeMission: sanitizeMission(input.lightConeMission, LIGHT_CONE_MISSION_IDS, DEFAULT_JOURNEY_STATE.lightConeMission),
    lightConeScene,
    lightConeSelectedLabel: hasSelectedLabel ? selectedLabel : null,
  };
}

export function parseAppStateFromSearch(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const chapter = params.get('chapter');

  return {
    activeExp: EXPERIENCE_IDS.includes(chapter) ? chapter : null,
    journeyState: sanitizeJourneyState({
      beta: params.get('beta'),
      boostBeta: params.get('boostBeta'),
      tripDistance: params.get('tripDistance'),
      accelFraction: params.get('accelFraction'),
      twinMission: params.get('twinMission'),
      boostMission: params.get('boostMission'),
      frameMission: params.get('frameMission'),
      lightConeMission: params.get('lightConeMission'),
      lightConeScene: params.get('lightConeScene'),
      lightConeSelectedLabel: params.get('lightConeSelectedLabel'),
    }),
  };
}

export function buildSearchFromAppState({ activeExp = null, journeyState = DEFAULT_JOURNEY_STATE }) {
  const params = new URLSearchParams();
  const state = sanitizeJourneyState(journeyState);

  if (EXPERIENCE_IDS.includes(activeExp)) params.set('chapter', activeExp);
  if (state.beta !== DEFAULT_JOURNEY_STATE.beta) params.set('beta', formatNumber(state.beta));
  if (state.boostBeta !== null && state.boostBeta !== state.beta) params.set('boostBeta', formatNumber(state.boostBeta));
  if (state.tripDistance !== DEFAULT_JOURNEY_STATE.tripDistance) params.set('tripDistance', formatNumber(state.tripDistance));
  if (state.accelFraction !== DEFAULT_JOURNEY_STATE.accelFraction) params.set('accelFraction', formatNumber(state.accelFraction));
  if (state.twinMission !== DEFAULT_JOURNEY_STATE.twinMission) params.set('twinMission', state.twinMission);
  if (state.boostMission !== DEFAULT_JOURNEY_STATE.boostMission) params.set('boostMission', state.boostMission);
  if (state.frameMission !== DEFAULT_JOURNEY_STATE.frameMission) params.set('frameMission', state.frameMission);
  if (state.lightConeMission !== DEFAULT_JOURNEY_STATE.lightConeMission) params.set('lightConeMission', state.lightConeMission);
  if (state.lightConeScene !== DEFAULT_JOURNEY_STATE.lightConeScene) params.set('lightConeScene', state.lightConeScene);
  if (state.lightConeSelectedLabel) params.set('lightConeSelectedLabel', state.lightConeSelectedLabel);

  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : '';
}

export function buildUrlFromAppState({
  activeExp = null,
  journeyState = DEFAULT_JOURNEY_STATE,
  pathname = '/',
  hash = '',
}) {
  return `${pathname}${buildSearchFromAppState({ activeExp, journeyState })}${hash}`;
}
