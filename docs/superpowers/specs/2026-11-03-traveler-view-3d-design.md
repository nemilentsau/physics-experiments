# The Traveler's View: 3D Twin Paradox Design

Status: written from the design conversation on 2026-11-03. The user asked to go straight to a plan, so this document has not had an independent review. "Your call" below marks decisions the user has not explicitly made.

## Intent

Add a 3D chapter to `minkowski-space-time-app` that shows the twin paradox from outside spacetime and from inside the ship, at the same time.

The inspiration is the method behind Elvar's teardown skill, not the skill itself: real numbers from one source, one input driving everything, the working part opened up, and nothing called finished until rendered frames have been reviewed. The user cares about that approach and does not need the skill installed.

The chapter earns its place by showing something the 2D chapters cannot: the difference between what is "now" in your frame (a tilted plane) and what you can see (your past light cone). What you see at any moment is exactly where your past light cone cuts through the world.

## What the viewer experiences

The left view is spacetime as an object: time is vertical, worldlines are tubes, the past light cone is a real gold cone, and "now" is a tilted plane. The right view is the traveler's actual sight: the sky bunches up ahead, colours shift, light beams forward, and straight lines curve.

One scrubber moves both. The sequence:

1. **Departure.** The outside camera is side-on, so the scene collapses into the familiar 2D diagram.
2. **Reveal.** The camera swings out and the two diagonal lines turn out to be a cone.
3. **Coast.** A gold dot marks the home moment you can see, and a white dot marks the home moment that is "now" for you. They disagree. The home clock looks slow and red.
4. **Turnaround.** The "now" plane swings across the home worldline. The gold dot keeps moving smoothly, because light arrives continuously. The home clock starts to look fast and blue.
5. **News arrives.** Home finally sees the turnaround, later than the traveler experienced it. This is the asymmetry that resolves the paradox.
6. **Reunion.** Both clocks are in one place and the age gap is a plain fact.

Hand check at 0.8c over 4 ly with a near-instant turnaround: home ages 10 years, the traveler about 6. The traveler sees the home clock at 1/3 rate, then 3× rate. At the turnaround, the home clock the traveler sees reads about 1 year, while "now" jumps from about 1.8 to about 8.2 years. Home sees the turnaround at about t = 9.

## Goals

- A new chapter with two linked 3D views driven by one input: the traveler's proper time τ.
- Every number and pose comes from tested code in `src/physics` and one pure frame function.
- Any moment can be reproduced from its URL.
- A repeatable frame review: stills at each story beat, checked against a written checklist.
- A checkpoint once both views are linked, so the user can judge the result before any polish.

## Non-goals

- Film export, generated sound, missions (for now).
- Rewriting the four 2D chapters.
- Moving objects other than the traveler. Everything else is at rest in the home frame.
- Sharing code with `block-universe-app`, though its docs defer true 3D to a v2 and this work could later serve it.
- General relativity, or real blackbody colour.

## Anti-goals: failures even if it technically works

- A visual effect that reads as physics but isn't.
- A readout that disagrees with the picture.
- Physics that lives in view code or shaders, where tests can't reach it.
- A beautiful scene that hides what the diagram is teaching.
- The 2D chapters getting slower because the main bundle now carries Three.js.

## Decisions

**From the user:** the twin paradox is the first subject; adopt the teardown method; design for approach rather than tool details; produce a plan.

**Your call (not yet confirmed by the user):**

- New Chapter 5, "The Traveler's View". The existing Twin Paradox chapter stays as the opening hook.
- Plain Three.js rather than React Three Fiber. The views are small imperative modules with `render(frame)`, which fits "one input, pure frame" and keeps dependencies down.
- All relativity runs in TypeScript, none in shaders. This is possible because everything except the traveler is at rest in the home frame: each vertex needs only the traveler's position and velocity.
- Reuse the existing `boostEvent` instead of adding general 4-vectors. Motion stays on one axis, so y and z pass through unchanged. This replaces the "extend to full 4-vectors" idea from the conversation.
- Fix `getTravelerState` first. It currently jumps at the end of the turnaround and misses reunion by 0.20 ly at default settings and 1.15 ly at `accelFraction` 0.45. The past-cone maths needs a continuous, closed worldline, and the fix also corrects the two 2D chapters that use it.
- The outside view drops one space dimension (z). Beacons at z = 0 appear in both views so the viewer can connect them.
- The inside camera always faces home, with a toggle to face away. Home is always in the −x direction, so no camera flip is needed at turnaround, and the sky changes smoothly from spread and red to bunched and blue.
- Doppler colour is a schematic ramp and is captioned as such on screen, since a true shift would leave the visible range.
- Try both a night and a light-studio look for the outside view, then keep one at the checkpoint.
- Headless stills use the real GPU on macOS (`--use-angle=metal`, verified on this machine) and fall back to `--enable-unsafe-swiftshader` elsewhere.

## Constraints

- Units are c = 1, and space and time share one scale, so cones are always at 45°.
- `beta` ranges over 0.1–0.99, `tripDistance` 1–10, `accelFraction` 0.01–0.45, all shared with the existing chapters through `JourneyState`.
- Must keep working on mobile, like the other chapters.
- Existing conventions: inline styles, `.ts` import extensions, pure logic with Vitest tests beside it, lazy-loaded chapters, URL state in `shareableState.ts`.
- `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` are clean today (8 tests) and must stay clean.

## Left to the builder

Materials, lighting and label placement within the plan's constraints; panel layout details; shot framing, tuned through the frame review.
