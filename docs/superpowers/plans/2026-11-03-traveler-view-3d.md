# The Traveler's View (3D Twin Paradox) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Chapter 5 with two linked 3D views of the twin trip, one outside spacetime and one from the ship, both driven by the traveler's proper time.

**Architecture:** Pure physics in `src/physics` feeds one pure function, `frameAt(trip, tau)`. Two thin Three.js view modules and the HTML readouts draw only from that frame. A stills script renders each story beat from its URL for review against a written checklist.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest, three 0.187, Playwright 1.64 (stills only).

**Spec:** `docs/superpowers/specs/2026-11-03-traveler-view-3d-design.md`

## Before You Start

- The current branch `fix-minkowski-ux` has 31 modified files and an untracked `tsconfig.json`, and this plan builds on them (`npx tsc` cannot run without that config). They must be committed before branching. **Do not commit them without the user's say-so.** Then run `git switch -c traveler-view-3d`.
- Baseline, verified on 2026-11-03: 8 tests pass; typecheck, lint and build are clean.

## Global Constraints

- Run every command from `minkowski-space-time-app/`. Vitest must print `RUN ... /minkowski-space-time-app`. Running it from a parent folder sweeps up other projects' tests.
- New dependencies, exactly: `three@^0.187.0`; dev `@types/three@^0.187.0`, `playwright@^1.64.1`. No React Three Fiber, no custom GLSL.
- One input: everything visible derives from `frameAt(trip, tau)`, given the trip parameters, the camera mode and `viewLook`.
- No relativity formulas in view modules or React components. They belong in `src/physics` or `frame.ts`.
- `frameAt`, `shotAt`, `storyFor` and the views' `render` read no clock, no `Date`, no `Math.random`. Random scene data uses the seeded `starDirections`.
- Units are c = 1. Never scale time and space separately; cones stay at 45°.
- Three.js is imported only under `src/experiences/traveler-view/`, and the main `index-*.js` chunk must not contain it.
- Colour: gold (`colors.lightCone`) only for light-cone things, teal (`colors.home`) for home, coral (`colors.traveler`) for the traveler.
- Caption shown under the inside view, verbatim: `Colours are schematic: bluer means shifted up, redder means shifted down.`
- Use the codebase's spelling `traveler` in all identifiers and copy. Keep `.ts`/`.tsx` import extensions and inline styles, and reuse `Panel`, `Slider`, `Toggle`, `StoryCallout`, `CanvasAnnotation`.
- 2D chapters keep their behaviour, apart from the worldline fix in Task 1.

## Review Focus

1. **Traveler exactly at home (τ = 0, reunion):** zero distance must give finite values, and the seen-rate readout must show the limit (1/3, then 3), not a default of 1. Tests in Tasks 3 and 4.
2. **Extreme trips from a URL or slider (`beta=0.99&tripDistance=1`, `beta=0.1&tripDistance=10`, `accelFraction=0.45`):** beats stay ordered, shots stay finite and framed. Tests in Tasks 2 and 6; stills in Task 7.
3. **Bad or stale time in a shared link (`viewTau=abc`, `-3`, `9999`, or past the end of the trip after beta changes):** clamps to a valid moment and never errors. Tests in Tasks 2 and 5.
4. **Playback writing to the URL every frame:** browsers rate-limit `history.replaceState` and Safari throws. Expect zero writes while playing, one on pause or scrub. Check in Task 7.
5. **Leaving and re-entering the chapter repeatedly, or having no WebGL at all:** no leaked contexts under StrictMode, and a readable fallback instead of a blank panel. Checks in Task 7.

## Frame Review Checklist

Used in Tasks 7, 8 and 10. Read the PNGs and `.stills/frames.json`. A pass means every tile is clean.

1. **Physics:** the gold dot sits where the cone meets the home worldline, the white dot where the plane meets it, and both match `homeSeenT` and `homeNowT` in `frames.json`. The traveler's tube closes at reunion. The cone apex is on the traveler.
2. **Diagram:** at `departure` the outside view reads as the 2D diagram, with cone edges at 45°.
3. **Inside view:** home looks redder and dimmer on the outbound leg, bluer and brighter on the return. Lattice lines curve. There are no black holes or missing geometry.
4. **Composition:** one focal point per view, nothing within 60 px of an edge, and no label covering what it names.
5. **Type:** nothing clipped, and the key readout is legible at 390 px wide.
6. **Colour:** gold appears only on light-cone things, the schematic caption is visible, and there are no blown-out surfaces.

## Files

```
src/physics/worldline.ts            modify: close the worldline
src/physics/worldline.test.ts       create
src/physics/twinTrip.ts(+test)      create: trip table, lookups, what home sees, beats
src/physics/appearance.ts(+test)    create: seenFrom, what a source looks like to the traveler
src/state/shareableState.ts(+test)  modify: viewTau, viewLook, chapter id
src/hooks/useAnimationLoop.ts       modify: initial progress
src/App.tsx                         modify: register chapter, copy
src/experiences/traveler-view/
  frame.ts(+test)     the one input: tau → everything
  story.ts(+test)     live callout copy from the frame
  shots.ts(+test)     outside camera script from tau
  layout.ts(+test)    scene coordinates, extents, beacons, stars, lattice, Doppler colour
  stage.ts            renderer lifecycle, looks, WebGL detection
  OutsideView.ts      spacetime block
  InsideView.ts       the traveler's sight
  TravelerView.tsx    chapter component
scripts/stills.mjs    render beats, run browser checks
```

---

### Task 1: Close the traveler's worldline

**Files:**
- Modify: `src/physics/worldline.ts:48-53`
- Test: `src/physics/worldline.test.ts`

**Interfaces:**
- Produces: `getTravelerState` with its signature unchanged, x(t) continuous, and x = 0 at `2 * tOutbound`.

- [ ] **Step 1: Write the failing test**

```ts
const TRIPS = [[0.6, 4, 0.08], [0.6, 4, 0.45], [0.99, 1, 0.01], [0.1, 10, 0.45]] as const;

it.each(TRIPS)('returns home at reunion (v=%f L=%f frac=%f)', (v, L, frac) => {
  const tO = L / v;
  expect(getTravelerState(2 * tO, v, tO, frac * tO).x).toBeCloseTo(0, 9);
});

it.each(TRIPS)('does not jump at the end of the turnaround (v=%f L=%f frac=%f)', (v, L, frac) => {
  const tO = L / v, a = frac * tO;
  const before = getTravelerState(tO + a - 1e-9, v, tO, a).x;
  const after = getTravelerState(tO + a + 1e-9, v, tO, a).x;
  expect(Math.abs(after - before)).toBeLessThan(1e-6);
});

it('peaks at the turnaround midpoint', () => {
  const tO = 4 / 0.6;
  expect(getTravelerState(tO, 0.6, tO, 0.08 * tO).x).toBeCloseTo(3.88372, 4);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/physics/worldline.test.ts`
Expected: FAIL. Reunion x is 0.20372 for the first trip, and the jump is 1.14592 for the second.

- [ ] **Step 3: Fix the return branch of `getTravelerState`**

The turnaround's displacement integrates to zero, so the return leg starts at `v * tA1`, not at the midpoint peak. Replace `realPeak` with `const turnEndX = v * tA1; x = turnEndX - v * (t - tA2);`.

- [ ] **Step 4: Run all tests to verify they pass**

Run: `npm test`
Expected: PASS, 8 existing tests plus the new ones.

- [ ] **Step 5: Commit**

```bash
git add src/physics/worldline.ts src/physics/worldline.test.ts
git commit -m "fix(physics): close the traveler worldline at reunion"
```

---

### Task 2: Trip table

**Files:**
- Create: `src/physics/twinTrip.ts`
- Test: `src/physics/twinTrip.test.ts`

**Interfaces:**
- Consumes: `getTravelerState`, `TravelerPhase` from `worldline.ts`.
- Produces:

```ts
export interface TripParams { beta: number; distance: number; accelFraction: number }
export interface TripSample { tau: number; t: number; x: number; v: number; phase: TravelerPhase }
export interface Trip extends TripParams {
  tOutbound: number; accelDuration: number; tTotal: number;
  tauTotal: number; xPeak: number; tNodes: number[]; tauNodes: number[];
}
export type BeatId = 'departure' | 'reveal' | 'coast' | 'turnaround' | 'news' | 'reunion';
export interface Beat { id: BeatId; tau: number }
export function buildTrip(params: TripParams): Trip;
export function tripAtT(trip: Trip, t: number): TripSample;       // clamps t to [0, tTotal]
export function tripAtTau(trip: Trip, tau: number): TripSample;   // clamps tau to [0, tauTotal]
export function homeSeesTraveler(trip: Trip, tHome: number): TripSample;
export function tripBeats(trip: Trip): Beat[];
```

- [ ] **Step 1: Write the failing tests**

```ts
const HAND = { beta: 0.8, distance: 4, accelFraction: 0.001 };
const DEFAULTS = { beta: 0.6, distance: 4, accelFraction: 0.08 };
const GRID = [0.1, 0.3, 0.6, 0.8, 0.95, 0.99].flatMap((beta) =>
  [1, 4, 10].flatMap((distance) =>
    [0.01, 0.08, 0.45].map((accelFraction) => ({ beta, distance, accelFraction }))));

it('matches the hand check', () => {
  const trip = buildTrip(HAND);
  expect(trip.tTotal).toBeCloseTo(10, 9);
  expect(trip.tauTotal).toBeCloseTo(6.00213, 4);
  expect(trip.xPeak).toBeCloseTo(3.99855, 4);
});

it('matches the default trip', () => {
  const trip = buildTrip(DEFAULTS);
  expect(trip.tauTotal).toBeCloseTo(10.7763, 4);
  expect(trip.xPeak).toBeCloseTo(3.88372, 4);
});

it('reads samples by proper time', () => {
  const trip = buildTrip(HAND);
  const out = tripAtTau(trip, 1.5);
  expect(out.t).toBeCloseTo(2.5, 6); expect(out.x).toBeCloseTo(2, 6); expect(out.v).toBeCloseTo(0.8, 9);
  const back = tripAtTau(trip, 4.5);
  expect(back.t).toBeCloseTo(7.49646, 4); expect(back.x).toBeCloseTo(2.00283, 4); expect(back.v).toBeCloseTo(-0.8, 9);
});

it('round-trips tau and t across the grid', () => {
  for (const params of GRID) {
    const trip = buildTrip(params);
    for (let i = 0; i <= 100; i++) {
      const tau = (i / 100) * trip.tauTotal;
      expect(tripAtT(trip, tripAtTau(trip, tau).t).tau).toBeCloseTo(tau, 9);
    }
  }
});

it('clamps out-of-range input', () => {
  const trip = buildTrip(DEFAULTS);
  expect(tripAtTau(trip, -1).tau).toBe(0);
  expect(tripAtTau(trip, 1e6).tau).toBeCloseTo(trip.tauTotal, 9);
  expect(tripAtTau(trip, 1e6).x).toBeCloseTo(0, 9);
});

it('finds what home sees', () => {
  const trip = buildTrip(HAND);
  const seen = homeSeesTraveler(trip, 5);
  expect(seen.t).toBeCloseTo(2.77778, 4); expect(seen.x).toBeCloseTo(2.22222, 4); expect(seen.tau).toBeCloseTo(1.66667, 4);
  const news = homeSeesTraveler(trip, trip.tOutbound + trip.xPeak);
  expect(news.t).toBeCloseTo(5, 4); expect(news.tau).toBeCloseTo(3.00106, 4);
  expect(homeSeesTraveler(trip, 0).tau).toBe(0);
});

it('places the beats', () => {
  const beats = tripBeats(buildTrip(HAND));
  expect(beats.map((b) => b.id)).toEqual(['departure', 'reveal', 'coast', 'turnaround', 'news', 'reunion']);
  [0, 0.60021, 1.95069, 3.00106, 5.40125, 6.00213].forEach((tau, i) => expect(beats[i]!.tau).toBeCloseTo(tau, 4));
});

it('keeps beats strictly increasing on extreme trips', () => {
  for (const params of GRID) {
    const taus = tripBeats(buildTrip(params)).map((b) => b.tau);
    taus.slice(1).forEach((tau, i) => expect(tau).toBeGreaterThan(taus[i]!));
  }
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/physics/twinTrip.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/physics/twinTrip.ts`**

- Do not reuse `integrateProperTime`. Its 500 uniform steps under-resolve short turnarounds (6.00000 versus the correct 6.00213 for `HAND`).
- Nodes: `tNodes = [0, tA1, ...513 evenly spaced across the turnaround, up to tA2, tTotal]`, skipping duplicates. τ is linear on the coast legs, so two nodes there are exact. Build `tauNodes` by trapezoid on `sqrt(1 - v²)`.
- Lookups use binary search plus linear interpolation, then call `getTravelerState` at the resulting t.
- `xPeak` is x at `tOutbound`.
- `homeSeesTraveler`: bisect t_e in `[0, min(tHome, tTotal)]` on `t_e + |x(t_e)| = tHome` for 60 iterations. The left side is monotonic because |v| < 1. Return the sample at t_e, or the τ = 0 sample when `tHome <= 0`.
- `tripBeats`, with `turn = tripAtT(trip, tOutbound)`: departure 0; reveal `0.2 * turn.tau`; coast `0.65 * turn.tau`; turnaround `turn.tau`; news τ at `tOutbound + xPeak`; reunion `tauTotal`.

- [ ] **Step 4: Run them to verify they pass**

Run: `npm test -- src/physics/twinTrip.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/physics/twinTrip.ts src/physics/twinTrip.test.ts
git commit -m "feat(physics): add twin trip table, beats, and what home sees"
```

---

### Task 3: What a source looks like to the traveler

**Files:**
- Create: `src/physics/appearance.ts`
- Test: `src/physics/appearance.test.ts`

**Interfaces:**
- Consumes: `boostEvent` from `lorentz.ts`.
- Produces:

```ts
export interface Vec3 { x: number; y: number; z: number }
export interface Observer { t: number; x: number; v: number } // on the x axis, moving along x
export interface Appearance {
  direction: Vec3;   // unit vector toward the source in the observer's rest frame
  distance: number;  // light-travel distance in that frame (= doppler × home-frame distance)
  doppler: number;   // observed frequency / emitted frequency
  emissionT: number; // home-frame time the arriving light left the source
}
export function seenFrom(observer: Observer, source: Vec3): Appearance;
```

- [ ] **Step 1: Write the failing tests**

```ts
const ORIGIN = (v: number) => ({ t: 20, x: 0, v });

it.each([
  [0.6, { x: 10, y: 0, z: 0 }, [1, 0, 0], 20, 2],
  [0.6, { x: -10, y: 0, z: 0 }, [-1, 0, 0], 5, 0.5],
  [0.6, { x: 0, y: 10, z: 0 }, [0.6, 0.8, 0], 12.5, 1.25],
  [0.8, { x: 10, y: 0, z: 0 }, [1, 0, 0], 30, 3],
  [0.8, { x: -10, y: 0, z: 0 }, [-1, 0, 0], 10 / 3, 1 / 3],
] as const)('matches known results at v=%f', (v, source, dir, distance, doppler) => {
  const seen = seenFrom(ORIGIN(v), source);
  expect(seen.direction.x).toBeCloseTo(dir[0], 9);
  expect(seen.direction.y).toBeCloseTo(dir[1], 9);
  expect(seen.direction.z).toBeCloseTo(dir[2], 9);
  expect(seen.distance).toBeCloseTo(distance, 9);
  expect(seen.doppler).toBeCloseTo(doppler, 9);
});

it('matches the aberration formula at 60 degrees', () => {
  const seen = seenFrom(ORIGIN(0.6), { x: Math.cos(Math.PI / 3), y: Math.sin(Math.PI / 3), z: 0 });
  expect(seen.direction.x).toBeCloseTo(1.1 / 1.3, 9);
  expect(seen.doppler).toBeCloseTo(1.625, 9);
});

it('reports when the light left the source', () => {
  expect(seenFrom(ORIGIN(0.6), { x: 10, y: 0, z: 0 }).emissionT).toBeCloseTo(10, 9);
});

it('changes nothing at zero velocity, including mid-turnaround', () => {
  const seen = seenFrom({ t: 5, x: 1, v: 0 }, { x: 4, y: 4, z: 0 });
  expect(seen.direction.x).toBeCloseTo(0.6, 9);
  expect(seen.direction.y).toBeCloseTo(0.8, 9);
  expect(seen.distance).toBeCloseTo(5, 9);
  expect(seen.doppler).toBeCloseTo(1, 9);
});

it('stays finite at zero distance', () => {
  expect(seenFrom({ t: 3, x: 2, v: 0.6 }, { x: 2, y: 0, z: 0 })).toEqual({
    direction: { x: 0, y: 0, z: 0 }, distance: 0, doppler: 1, emissionT: 3,
  });
});

it.each([[0.6, 40], [0.6, 90], [0.6, 140], [0.9, 40], [0.9, 90], [0.9, 140]])(
  'keeps a small circle circular at v=%f, %f degrees', (v, deg) => {
    const th = (deg * Math.PI) / 180, ring = 0.01, c = Math.cos(ring), s = Math.sin(ring);
    const dirs = Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * 2 * Math.PI;
      return seenFrom(ORIGIN(v), {
        x: Math.cos(th) * c - Math.sin(th) * s * Math.cos(a),
        y: Math.sin(th) * c + Math.cos(th) * s * Math.cos(a),
        z: s * Math.sin(a),
      }).direction;
    });
    const m = dirs.reduce((acc, d) => ({ x: acc.x + d.x, y: acc.y + d.y, z: acc.z + d.z }), { x: 0, y: 0, z: 0 });
    const len = Math.hypot(m.x, m.y, m.z);
    const radii = dirs.map((d) => Math.acos((d.x * m.x + d.y * m.y + d.z * m.z) / len));
    const doppler = seenFrom(ORIGIN(v), { x: Math.cos(th), y: Math.sin(th), z: 0 }).doppler;
    expect(Math.max(...radii) / Math.min(...radii)).toBeLessThan(1.02);
    expect((Math.max(...radii) + Math.min(...radii)) / 2 / ring).toBeCloseTo(1 / doppler, 2);
  },
);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/physics/appearance.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `seenFrom`**

With Δ = source − observer position and r = |Δ|: when r < 1e-9, return the zero-distance result the test pins. Otherwise boost the past-pointing null separation with `boostEvent(-r, Δx, v)` to get (t′, x′). Then `doppler = t′ / -r`, `distance = -t′`, `direction = (x′, Δy, Δz) / distance`, `emissionT = t - r`. This is valid at any point of the trip because every source is at rest in the home frame, so only the traveler's current position and velocity matter.

- [ ] **Step 4: Run them to verify they pass**

Run: `npm test -- src/physics/appearance.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/physics/appearance.ts src/physics/appearance.test.ts
git commit -m "feat(physics): add seenFrom for aberration, Doppler, and light delay"
```

---

### Task 4: The one input

**Files:**
- Create: `src/experiences/traveler-view/frame.ts`, `src/experiences/traveler-view/story.ts`
- Test: `src/experiences/traveler-view/frame.test.ts`, `src/experiences/traveler-view/story.test.ts`

**Interfaces:**
- Consumes: Task 2 (`Trip`, `TripSample`, `tripAtTau`, `homeSeesTraveler`, `tripBeats`), Task 3 (`seenFrom`), `gamma`.
- Produces:

```ts
export interface ViewFrame {
  tau: number; t: number; x: number; v: number; phase: TravelerPhase;
  gamma: number; ageGap: number;
  homeNowT: number;      // home event on the traveler's "now" plane: t - v * x
  homeSeenT: number;     // home clock in the light arriving now: t - |x|
  homeSeenRate: number;  // Doppler factor of home's image
  seenByHome: TripSample; // what home sees of the traveler at home time t
}
export function frameAt(trip: Trip, tau: number): ViewFrame;
export function nowPlaneT(frame: ViewFrame, x: number): number; // t + v * (x - frame.x)

export type StoryId = 'side-on' | 'outbound' | 'turnaround' | 'news-in-flight' | 'both-fast' | 'reunion';
export interface Story { id: StoryId; accent: string; badge: string; title: string; body: string; question: string; answer: string }
export function storyFor(frame: ViewFrame, trip: Trip): Story;
```

- [ ] **Step 1: Write the failing tests**

```ts
// frame.test.ts, using HAND and GRID as in Task 2
const trip = buildTrip(HAND);

it('matches the hand check on the outbound leg', () => {
  const f = frameAt(trip, 1.5);
  expect(f.t).toBeCloseTo(2.5, 6); expect(f.x).toBeCloseTo(2, 6); expect(f.gamma).toBeCloseTo(5 / 3, 9);
  expect(f.ageGap).toBeCloseTo(1, 6); expect(f.homeSeenT).toBeCloseTo(0.5, 6);
  expect(f.homeNowT).toBeCloseTo(0.9, 6); expect(f.homeSeenRate).toBeCloseTo(1 / 3, 6);
});

it('matches the hand check on the return leg', () => {
  const f = frameAt(trip, 4.5);
  expect(f.homeSeenT).toBeCloseTo(5.49362, 4); expect(f.homeNowT).toBeCloseTo(9.09872, 4);
  expect(f.homeSeenRate).toBeCloseTo(3, 6);
});

it('swings the now plane across the turnaround', () => {
  const at = (t: number) => frameAt(trip, tripAtT(trip, t).tau);
  expect(at(trip.tOutbound - trip.accelDuration).homeNowT).toBeCloseTo(1.7982, 3);
  expect(at(trip.tOutbound).homeNowT).toBeCloseTo(5, 6);
  expect(at(trip.tOutbound + trip.accelDuration).homeNowT).toBeCloseTo(8.2018, 3);
});

it('shows the limiting seen rate when the traveler is exactly at home', () => {
  expect(frameAt(trip, 0).homeSeenRate).toBeCloseTo(1 / 3, 6);
  expect(frameAt(trip, trip.tauTotal).homeSeenRate).toBeCloseTo(3, 6);
});

it('moves the seen home clock forward without jumps across the grid', () => {
  for (const params of GRID) {
    const g = buildTrip(params);
    const maxRate = gamma(params.beta) * (1 + params.beta);
    const dTau = g.tauTotal / 400;
    let prev = frameAt(g, 0).homeSeenT;
    for (let i = 1; i <= 400; i++) {
      const seen = frameAt(g, i * dTau).homeSeenT;
      expect(seen).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(seen - prev).toBeLessThanOrEqual(maxRate * dTau + 1e-9);
      prev = seen;
    }
  }
});

it('reports what home sees, and nowPlaneT agrees with the frame', () => {
  const news = tripBeats(trip).find((b) => b.id === 'news')!;
  expect(frameAt(trip, news.tau).seenByHome.t).toBeCloseTo(5, 3);
  const f = frameAt(trip, 1.5);
  expect(nowPlaneT(f, f.x)).toBeCloseTo(f.t, 9);
  expect(nowPlaneT(f, 0)).toBeCloseTo(f.homeNowT, 9);
});

it('is pure', () => {
  expect(frameAt(trip, 2)).toEqual(frameAt(trip, 2));
});

// story.test.ts
it.each([
  [0, 'side-on'], [1.5, 'outbound'], [4.5, 'news-in-flight'], [5.7, 'both-fast'],
])('picks the story for tau=%f', (tau, id) => {
  expect(storyFor(frameAt(trip, tau), trip).id).toBe(id);
});
it('picks turnaround and reunion by their exact beats', () => {
  const beats = tripBeats(trip);
  expect(storyFor(frameAt(trip, beats[3]!.tau), trip).id).toBe('turnaround');
  expect(storyFor(frameAt(trip, trip.tauTotal), trip).id).toBe('reunion');
});
it('quotes live values', () => {
  const body = storyFor(frameAt(trip, 1.5), trip).body;
  expect(body).toContain('0.50');
  expect(body).toContain('0.90');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/experiences/traveler-view`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `frameAt` and `nowPlaneT`**

Sample with `tripAtTau`. `homeSeenRate = seenFrom({ t, x: Math.max(x, 1e-6), v }, origin).doppler`. The tiny offset keeps home in the −x direction at τ = 0 and at reunion, which gives the correct limits. `seenByHome = homeSeesTraveler(trip, t)`. `gamma` is local, from the current `v`.

- [ ] **Step 4: Implement `storyFor` with this exact copy**

Selection, first match wins: τ below the `reveal` beat → `side-on`; τ within 0.1% of `tauTotal` → `reunion`; phase `turnaround` → `turnaround`; t below `tOutbound` → `outbound`; t below `tOutbound + xPeak` → `news-in-flight`; otherwise `both-fast`. Numbers use `.toFixed(2)`.

| id | title | body | question | answer |
|---|---|---|---|---|
| side-on | Side-on, this is the diagram you already know | Rotate out of this view and the two diagonal lines become a cone. The 2D chapters were a cross-section of this block. | Why add a dimension? | With one space dimension a light cone is only two lines. With two, it is a surface that cuts through everything around you. |
| outbound | You are seeing home in the past | The gold cone is everything you can see right now. It meets the home worldline at ${homeSeenT} yr, while your "now" plane meets it at ${homeNowT} yr. | Why do the two dots differ? | "Now" is a choice of coordinates. What you see is light that has already reached you, so it always lies on your past cone. |
| turnaround | Your "now" swings, but what you see does not jump | Your "now" plane is sweeping across the home clock, currently at ${homeNowT} yr. The clock you see reads ${homeSeenT} yr and keeps moving smoothly. | Does anything happen at home? | No. The plane moves because your frame is changing. The light reaching you never stopped arriving. |
| news-in-flight | You see home speeding up, but home has not noticed yet | The home clock now looks ${homeSeenRate}× fast. Home still sees you heading outward, because the light from your turnaround is on its way. | When will home find out? | When that light arrives, at home time ${tOutbound + xPeak} yr. Watch the ray from your turnaround reach the home worldline. |
| both-fast | Now each twin sees the other's clock running fast | Home saw your turnaround at ${tOutbound + xPeak} yr, well after you lived it. | So where is the asymmetry? | You saw the switch halfway through your trip. Home saw it later, so home watched your clock run slow for longer. |
| reunion | Same place, same moment, no frame left to choose | Home has aged ${t} yr and you have aged ${tau} yr. | Is the gap real? | Yes. The two paths through spacetime have different lengths, and proper time measures that length. |

Accents: `colors.lightCone` for `side-on`, `outbound` and `news-in-flight`; `colors.travelerAlt` for `turnaround`; `colors.home` for `both-fast` and `reunion`. Badge: `gap ${ageGap} yr`.

- [ ] **Step 5: Run them to verify they pass**

Run: `npm test -- src/experiences/traveler-view`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experiences/traveler-view
git commit -m "feat(traveler-view): derive every value from proper time"
```

---

### Task 5: Reproducible moments in the URL

**Files:**
- Modify: `src/state/shareableState.ts`, `src/state/shareableState.test.ts`, `src/hooks/useAnimationLoop.ts`

**Interfaces:**
- Produces: `JourneyState` gains `viewTau: number | null` (default null) and `viewLook: 'home' | 'away'` (default `'home'`). `'traveler-view'` joins `EXPERIENCE_IDS`. URL params are `viewTau` and `viewLook`. `useAnimationLoop(duration = 6000, initialProgress = 1)`, where `reset` returns to `initialProgress`.

- [ ] **Step 1: Write the failing tests**

```ts
it('round-trips the traveler view state', () => {
  const journeyState = { ...DEFAULT_JOURNEY_STATE, viewTau: 3.25, viewLook: 'away' as const };
  const search = buildSearchFromAppState({ activeExp: 'traveler-view', journeyState });
  expect(parseAppStateFromSearch(search)).toEqual({ activeExp: 'traveler-view', journeyState });
});

it('leaves defaults out of the URL', () => {
  expect(buildSearchFromAppState({ activeExp: 'traveler-view', journeyState: DEFAULT_JOURNEY_STATE }))
    .toBe('?chapter=traveler-view');
});

it.each([['abc', null], ['-3', 0], ['9999', 200], ['', null]])('sanitizes viewTau=%s', (raw, expected) => {
  expect(parseAppStateFromSearch(`?viewTau=${raw}`).journeyState.viewTau).toBe(expected);
});

it('falls back to facing home for an unknown look', () => {
  expect(parseAppStateFromSearch('?viewLook=up').journeyState.viewLook).toBe('home');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/state/shareableState.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Follow the `boostBeta` pattern in `sanitizeJourneyState` (null, undefined and `''` become null, otherwise clamp to 0–200). 200 is the longest possible trip. Parse and serialize like the other fields. Add the `initialProgress` parameter to the hook, with its default keeping the other chapters unchanged.

- [ ] **Step 4: Run all checks**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/state src/hooks/useAnimationLoop.ts
git commit -m "feat(state): carry traveler view time and look in the URL"
```

---

### Task 6: Camera script and scene layout

**Files:**
- Create: `src/experiences/traveler-view/shots.ts`, `src/experiences/traveler-view/layout.ts`
- Test: `src/experiences/traveler-view/shots.test.ts`, `src/experiences/traveler-view/layout.test.ts`

**Interfaces:**
- Consumes: Task 2 (`Trip`, `tripBeats`), `Vec3`.
- Produces:

```ts
// layout.ts: no three imports
export interface BlockExtent { xMax: number; yMax: number; tMax: number }
export function toScene(x: number, y: number, t: number): [number, number, number]; // [x, t, y]: time is up
export function blockExtent(trip: Trip): BlockExtent;  // xMax = yMax = 1.5 * distance, tMax = 1.05 * tTotal
export function beaconPositions(distance: number): Vec3[];
export function starDirections(count: number, seed: number): Float32Array; // xyz triples, unit length
export function latticeLines(distance: number): Float32Array;              // LineSegments endpoints, xyz
export function dopplerColor(doppler: number): [number, number, number];   // 0–1 RGB

// shots.ts
export const SHOT_FOV_DEG = 18;
export interface Shot { azimuth: number; elevation: number; distance: number; target: [number, number, number] }
export function shotAt(trip: Trip, tau: number): Shot; // degrees; target in scene coordinates
```

- [ ] **Step 1: Write the failing tests**

```ts
// layout.test.ts
it('puts time on the scene up axis', () => expect(toScene(1, 2, 3)).toEqual([1, 3, 2]));
it('sizes the block from the trip', () => {
  expect(blockExtent(buildTrip({ beta: 0.6, distance: 4, accelFraction: 0.08 })).xMax).toBe(6);
  expect(blockExtent(buildTrip({ beta: 0.1, distance: 10, accelFraction: 0.45 })).tMax).toBeCloseTo(210, 6);
});
it('keeps beacons inside the block and in the z = 0 plane', () => {
  const beacons = beaconPositions(4);
  expect(beacons).toHaveLength(6);
  beacons.forEach((b) => { expect(Math.abs(b.x)).toBeLessThanOrEqual(6); expect(Math.abs(b.y)).toBeLessThanOrEqual(6); expect(b.z).toBe(0); });
});
it('generates stars deterministically on the unit sphere', () => {
  const a = starDirections(100, 7);
  expect(a).toEqual(starDirections(100, 7));
  expect(a).not.toEqual(starDirections(100, 8));
  for (let i = 0; i < 100; i++) expect(Math.hypot(a[3 * i]!, a[3 * i + 1]!, a[3 * i + 2]!)).toBeCloseTo(1, 5);
});
it('builds a tessellated lattice below the plane of travel', () => {
  const lattice = latticeLines(4);
  expect(lattice.length).toBe(22 * 64 * 2 * 3);
  expect(lattice[2]).toBeCloseTo(-3.2, 5);
});
it('colours by Doppler factor', () => {
  const [r, g, b] = dopplerColor(1);
  expect(r).toBeCloseTo(g, 5); expect(g).toBeCloseTo(b, 5);
  const blue = dopplerColor(3), red = dopplerColor(1 / 3);
  expect(blue[2]).toBeGreaterThan(blue[0]);
  expect(red[0]).toBeGreaterThan(red[2]);
  [0.0709, 14.1, 1e-6, 1e6].flatMap(dopplerColor).forEach((c) => { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(1); });
});

// shots.test.ts, using GRID as in Task 2
const trip = buildTrip({ beta: 0.6, distance: 4, accelFraction: 0.08 });
it('starts and ends side-on', () => {
  for (const tau of [0, trip.tauTotal]) {
    expect(shotAt(trip, tau).azimuth).toBeCloseTo(0, 9);
    expect(shotAt(trip, tau).elevation).toBeCloseTo(0, 9);
  }
});
it('pins the reveal', () => {
  const reveal = tripBeats(trip).find((b) => b.id === 'reveal')!;
  expect(shotAt(trip, reveal.tau).azimuth).toBeCloseTo(38, 6);
  expect(shotAt(trip, reveal.tau).elevation).toBeCloseTo(16, 6);
});
it('never cuts', () => {
  let prev = shotAt(trip, 0);
  for (let i = 1; i <= 1000; i++) {
    const next = shotAt(trip, (i / 1000) * trip.tauTotal);
    expect(Math.abs(next.azimuth - prev.azimuth)).toBeLessThan(2);
    expect(Math.abs(next.elevation - prev.elevation)).toBeLessThan(2);
    prev = next;
  }
});
it('frames the whole block on extreme trips', () => {
  for (const params of GRID) {
    const g = buildTrip(params), e = blockExtent(g);
    const radius = Math.hypot(e.xMax, e.yMax, e.tMax / 2);
    for (const { tau } of tripBeats(g)) {
      const shot = shotAt(g, tau);
      [shot.azimuth, shot.elevation, shot.distance].forEach((n) => expect(Number.isFinite(n)).toBe(true));
      expect(shot.distance * Math.sin((SHOT_FOV_DEG / 2) * Math.PI / 180)).toBeGreaterThanOrEqual(radius);
    }
  }
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- src/experiences/traveler-view/shots.test.ts src/experiences/traveler-view/layout.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `layout.ts`**

- Beacon multipliers × `distance`, z = 0: (0.5, 1.1), (1.2, −0.9), (−0.6, 0.8), (1.4, 0.7), (0.9, −1.3), (−1.1, −0.6).
- `starDirections`: mulberry32 seeded from `seed`, uniform on the sphere.
- `latticeLines`: plane z = −0.8 × distance, x and y across ±3 × distance, 11 lines each way at 0.6 × distance spacing, 64 segments per line.
- `dopplerColor`: `s = clamp(log2(D) / 3, -1, 1)`. Blend white toward `#7fb2ff` for s > 0 and toward `#ff6a4a` for s < 0, then multiply by `clamp(0.55 * D², 0.12, 1)`.

- [ ] **Step 4: Implement `shots.ts`**

Azimuth and elevation pinned at each beat: departure (0, 0), reveal (38, 16), coast (38, 16), turnaround (58, 12), news (24, 20), reunion (0, 0). Between beats use smootherstep. `target` is `toScene(0, 0, tMax / 2)`. `distance` is `1.05 * radius / sin(SHOT_FOV_DEG / 2)`, with radius as in the test.

- [ ] **Step 5: Run them to verify they pass**

Run: `npm test -- src/experiences/traveler-view`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/experiences/traveler-view
git commit -m "feat(traveler-view): add camera script and scene layout"
```

---

### Task 7: Chapter shell, outside view, and stills

**Files:**
- Create: `src/experiences/traveler-view/stage.ts`, `src/experiences/traveler-view/OutsideView.ts`, `src/experiences/traveler-view/TravelerView.tsx`, `scripts/stills.mjs`
- Modify: `src/App.tsx:11-14,29-78,363,659-667`, `package.json`, `.gitignore`

**Interfaces:**
- Consumes: Tasks 2 to 6.
- Produces:

```ts
// stage.ts
export type StageLook = 'night' | 'studio';
export function detectWebGL(): boolean;
export interface Stage {
  renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement;
  size(): { width: number; height: number };
  onResize(callback: () => void): void;
  dispose(): void;
}
export function createStage(container: HTMLElement, options: { maxPixelRatio: number }): Stage;

// OutsideView.ts
export type OutsideAnchor = 'traveler' | 'homeSeen' | 'homeNow';
export interface ScreenPoint { x: number; y: number; visible: boolean } // CSS pixels within the view
export interface OutsideView {
  setTrip(trip: Trip): void;
  render(frame: ViewFrame, shot: Shot): void;
  setFreeCamera(on: boolean): void;
  anchors(): Record<OutsideAnchor, ScreenPoint>;
  dispose(): void;
}
export function createOutsideView(container: HTMLElement, trip: Trip, look: StageLook, options: { maxPixelRatio: number }): OutsideView;
```

Development-only hook, consumed by the stills script:

```ts
window.__travelerView = { beats: Beat[], frame: ViewFrame, rendered: number, renderMs: number }
```

- [ ] **Step 1: Install dependencies**

Run: `npm i three@^0.187.0 && npm i -D @types/three@^0.187.0 playwright@^1.64.1 && npx playwright install chromium`
Expected: exits 0. Add `"stills": "node scripts/stills.mjs"` to `package.json` scripts and `.stills` to `.gitignore`.

- [ ] **Step 2: Implement `stage.ts`**

`createStage` creates a **new canvas inside the container on every call**. `dispose` calls `renderer.dispose()`, then `renderer.forceContextLoss()`, then removes the canvas. StrictMode double-runs effects, and a lost context on a reused canvas would break the second mount. Enable `localClippingEnabled`, and use a `ResizeObserver` for size. Define `LOOKS` for both looks: night (background `#07070c`) and studio (light neutral background, soft shadows).

- [ ] **Step 3: Implement `OutsideView.ts`**

Map all coordinates through `toScene`. Render on demand: on `render`, on resize, and on `OrbitControls` change, with no continuous loop. Contents:

- Home worldline tube (teal), traveler worldline tube (coral) sampled from `tripAtT` with extra samples through the turnaround, thin neutral beacon worldlines.
- Past cone (gold, translucent) with its apex on the traveler, reaching t = 0. A faint future cone reaching `tMax`. Both clipped to the block with clipping planes. Guard against zero height at τ = 0.
- Traveler marker. Gold dot at `(0, 0, homeSeenT)` with a gold ray to the traveler. White dot at `(0, 0, homeNowT)`.
- "Now" plane: translucent white quad across x and y using `nowPlaneT`, clipped to the block.
- A coral ray from `seenByHome` to the home worldline at time t.
- A faint block outline and a time axis label.

`setFreeCamera(false)` follows `Shot` with a `SHOT_FOV_DEG` perspective camera. `setFreeCamera(true)` enables `OrbitControls`. Set `touch-action: pan-y` on the canvas when free camera is off, so mobile users can still scroll past it, and `none` when on.

- [ ] **Step 4: Implement `TravelerView.tsx`**

Props match the other chapters.

- **State:** `beta`, `tripDistance`, `accelFraction` initialized from `journeyState`, following the `useEffect` sync at `TwinParadox.tsx:267-274`. `trip = useMemo(buildTrip)`. `useAnimationLoop(16000, initialProgress)`, where `initialProgress` is `min(1, viewTau / tauTotal)` and defaults to 0 when `viewTau` is null. `tau = progress * trip.tauTotal`, `frame = useMemo(frameAt)`.
- **URL:** write `viewTau` through `onJourneyChange` **only when `isPlaying` is false**, debounced by 200 ms. App writes history on every journey change, so per-frame writes would hit browser rate limits.
- **WebGL:** `const [webglOk] = useState(detectWebGL)`. When false, render a `Panel` reading `This chapter needs WebGL, which this browser has turned off.` with a button to the Twin Paradox chapter.
- **Views:** create in a mount effect, dispose in its cleanup. Call `setTrip` in an effect on `trip`. Call `render(frame, shotAt(trip, tau))` in an effect on frame.
- **Labels:** position imperatively through refs from `anchors()`, never through React state. Labels are `You`, `You see this`, `"Now" for you`, using `CanvasAnnotation`.
- **Controls:** τ scrubber, Play and Reset (style from `TwinParadox.tsx:673-684`), six beat buttons, sliders for β (0.1–0.99), distance (1–10), turnaround fraction (0.01–0.45), a `Free camera` toggle, and `StoryCallout` from `storyFor`.
- **Readouts:** your clock τ, home clock t, home clock as seen, home clock "now", seen rate, gap.
- **Look:** read `?stage=studio|night` from `location.search`, default night. This is temporary and removed in Task 9.
- **Layout:** two columns at 3fr/2fr, 520 px tall, at `isTablet` false; stacked otherwise (outside 360 px, inside 300 px on mobile). Max pixel ratio is 1.5 on mobile, otherwise 2.
- **Capture hook:** under `import.meta.env.DEV`, publish `window.__travelerView` in an effect, incrementing `rendered` and timing `renderMs` around `render`.

Leave a clearly sized empty panel where the inside view goes (Task 8).

- [ ] **Step 5: Register the chapter in `App.tsx`**

Lazy import, then add this entry after Light Cone Lab:

```ts
{
  id: 'traveler-view', chapter: 'Chapter 5', title: "The Traveler's View", subtitle: 'The Payoff',
  description: 'Fly the twin trip in 3D. Watch your past light cone sweep through spacetime from outside while you see the image it makes from inside the ship.',
  goal: 'See why what you see is not what is happening now.',
  takeaway: 'What you see lies on your past light cone. What is "now" depends on your frame.',
  color: colors.lightCone, icon: '◉', Component: TravelerView,
}
```

Change the hero line at `App.tsx:363` to `One story, five views of relativity`. Add a `continuityNote` branch for `traveler-view`: `` `Flying the same trip: β=${journeyState.beta.toFixed(2)}c · distance=${journeyState.tripDistance.toFixed(1)} ly` ``.

- [ ] **Step 6: Implement `scripts/stills.mjs`**

Usage: `npm run stills -- --base http://localhost:4200`. Launch with:

```js
chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal'] : ['--enable-unsafe-swiftshader'] })
```

Metal was verified on this machine. Without a flag, headless falls back to software rendering.

Scenarios: `default` (all six beats, 1440×900); `fast` (`beta=0.99&tripDistance=1`), `slow` (`beta=0.1&tripDistance=10`), `wide` (`accelFraction=0.45`), each at turnaround, news and reunion; `away` (`viewLook=away`) at coast and news; `mobile` (390×844) at departure and news.

For each scenario: load `?chapter=traveler-view&...`, read `beats` from `window.__travelerView`, and for each chosen beat go to the URL with `viewTau`, wait for `rendered >= 1`, screenshot to `.stills/<scenario>-<beat>.png`, and append the frame to `.stills/frames.json`.

Then run the checks, exiting non-zero on any failure:
1. Any `pageerror` or `console.error` during the run.
2. `frame.tau` within 0.01 of the requested τ.
3. Patch `history.replaceState` with a counter through `addInitScript`, click Play, wait 2 s. Expect 0 calls.
4. Click `Back` then `page.goBack()`, 10 times. Expect no console message containing `Too many active WebGL contexts`. Three's own "Context Lost" log on dispose is expected and must not fail the check.
5. With `HTMLCanvasElement.prototype.getContext` patched to return null, expect the fallback text visible.
6. `viewTau=abc` and `viewTau=9999` load without error.

Print average `renderMs` measured during check 3.

- [ ] **Step 7: Run all automated checks**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build && grep -l WebGLRenderer dist/assets/*.js`
Expected: all pass, and the `grep` output does **not** include an `index-*.js` file.

- [ ] **Step 8: Run stills and review the outside view**

Run: `npm run dev` in the background, then `npm run stills -- --base http://localhost:4200`.
Expected: exit 0. Read every outside-view tile against checklist items 1, 2, 4, 5, 6. Fix by changing numbers in `shots.ts`, `layout.ts` or the view, then re-run until clean.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore scripts src
git commit -m "feat(traveler-view): add chapter with outside spacetime view and frame review"
```

---

### Task 8: Inside view, then checkpoint

**Files:**
- Create: `src/experiences/traveler-view/InsideView.ts`
- Modify: `src/experiences/traveler-view/TravelerView.tsx`

**Interfaces:**
- Consumes: `seenFrom`, `dopplerColor`, `starDirections`, `latticeLines`, `beaconPositions`, `createStage`, `ScreenPoint`.
- Produces:

```ts
export interface InsideView {
  setTrip(trip: Trip): void;
  setLook(look: 'home' | 'away'): void;
  render(frame: ViewFrame): void;
  anchors(): { home: ScreenPoint };
  dispose(): void;
}
export function createInsideView(container: HTMLElement, trip: Trip, options: { maxPixelRatio: number }): InsideView;
```

- [ ] **Step 1: Implement `InsideView.ts`**

The scene is in the traveler's rest frame with the camera at the origin, FOV 100°, up +z, looking along −x for `home` and +x for `away`. On each `render`, build `observer = { t, x, v }` from the frame and loop over sources:

- **Lattice:** `LineSegments` with position `direction × distance`, vertex colour `dopplerColor(doppler)`.
- **Stars:** 1500 from `starDirections(1500, 7)`. Treat each as a source at 1e6 × direction, placed at `direction × 1000` in the scene, coloured by `dopplerColor`.
- **Beacons:** glowing sprites using the same mapping.
- **Home:** a sprite at `direction × max(distance, 0.05 * tripDistance)`. When `seenFrom` returns the zero direction, fall back to (−1, 0, 0). Real radius 0.06 × distance, so apparent size scales with `1 / appearance.distance`, with a minimum screen size so it stays visible. Colour from `dopplerColor`.

Use unlit materials and dynamic buffer attributes, with no allocations beyond `seenFrom`. There are no relativity formulas here: every number comes from `seenFrom`. Render on demand.

- [ ] **Step 2: Wire it into `TravelerView.tsx`**

Replace the empty panel. Render both views in the same effect, so they cannot disagree. Add a `Face away from home` toggle bound to `viewLook` through `onJourneyChange`, the home-clock label anchored to `anchors().home` (`Home clock: ${homeSeenT} yr`), and the verbatim caption from Global Constraints under the view.

- [ ] **Step 3: Run all automated checks**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 4: Run stills and do a full review**

Run: `npm run stills -- --base http://localhost:4200`
Expected: exit 0. Review every tile against the whole checklist, and capture `?stage=studio` for `default` as well. Fix and re-run until a full pass is clean.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(traveler-view): add the traveler's sight, linked to the outside view"
```

- [ ] **Step 6: CHECKPOINT: stop and show the user**

Give the user the dev URL, the stills folder, and two questions: does the linked view land, and which look to keep, `?stage=night` or `?stage=studio`? **Do not start Task 9 until they answer.** If the view doesn't land, stop here. The physics and URL work remain useful either way.

---

### Task 9: Apply the chosen look and add depth

**Files:**
- Modify: `src/experiences/traveler-view/layout.ts`, `src/experiences/traveler-view/stage.ts`, `src/experiences/traveler-view/OutsideView.ts`, `src/experiences/traveler-view/TravelerView.tsx`
- Test: `src/experiences/traveler-view/layout.test.ts`

**Interfaces:**
- Produces: in `layout.ts`, `export function qualityTier(input: { isMobile: boolean; devicePixelRatio: number }): 'low' | 'high'`.

- [ ] **Step 1: Write the failing test**

```ts
it('uses the low tier on mobile', () => {
  expect(qualityTier({ isMobile: true, devicePixelRatio: 3 })).toBe('low');
});
it('uses the high tier on desktop', () => {
  expect(qualityTier({ isMobile: false, devicePixelRatio: 2 })).toBe('high');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/experiences/traveler-view/layout.test.ts`
Expected: FAIL, `qualityTier` is not defined.

- [ ] **Step 3: Implement**

Delete the look that wasn't chosen, along with `StageLook` and the `?stage=` read. On the high tier, add the chosen look's depth through `EffectComposer`: `GTAOPass` for studio (give its normal material the same clipping planes, or the clipped cone ghosts) or `UnrealBloomPass` for night (keep surfaces below the threshold so detail survives). The low tier skips post-processing and shadows.

- [ ] **Step 4: Run all checks and measure**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run stills -- --base http://localhost:4200`
Expected: pass, with average `renderMs` under 16. If it's over budget, profile before lowering quality. Review tiles against checklist items 1, 3, 6.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(traveler-view): apply chosen look with depth on capable devices"
```

---

### Task 10: Final frame review and wrap-up

**Files:**
- Modify: `task_list.md`, plus any fixes the review finds.

- [ ] **Step 1: Run a clean full pass**

Run: `npm run stills -- --base http://localhost:4200`
Expected: exit 0. Read **every** tile against the whole checklist and compare `frames.json` to the hand check. Fix, re-run from the top, and stop only when a full pass finds nothing.

- [ ] **Step 2: Add Phase 8 to `task_list.md`**

Heading `## Phase 8: The Traveler's View (Completed)`, with bullets for the 3D chapter, the worldline fix, and the frame review.

- [ ] **Step 3: Run final verification**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build && grep -l WebGLRenderer dist/assets/*.js`
Expected: all pass, and no `index-*.js` in the `grep` output.

- [ ] **Step 4: Commit**

```bash
git add task_list.md src
git commit -m "docs: record the traveler view chapter"
```

- [ ] **Step 5: Ask the user to test on a real phone**

Headless stills cannot judge feel or frame rate on weak hardware, so say so plainly and ask them to try the chapter on a phone.
