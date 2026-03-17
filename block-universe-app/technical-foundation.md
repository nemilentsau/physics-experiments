# Technical Foundation

## Summary
This document bridges the vision and option plans to implementation. It defines the core data model, rendering strategy, coordinate systems, animation principles, mobile layout strategy, and accessibility baseline for the Block Universe app. All three product options (A, B, C) share this foundation.

This document does not repeat architectural choices already stated in the vision doc (React + Vite, standalone app, no code sharing with Minkowski in v1). It covers only the decisions the vision doc left unresolved.

---

## Core Data Types

All scene logic operates on a small set of plain objects. No classes. No OOP hierarchies. These types are the shared language between rendering, mission evaluation, URL serialization, and physics computations.

### SpacetimeEvent

A single point in 1+1 Minkowski spacetime.

```
SpacetimeEvent {
  id: string              // unique within the scene, stable across frames
  x: number               // spatial coordinate (light-years or natural units)
  t: number               // time coordinate in the lab/default frame
  label: string            // short display label ("A", "B", "supernova", etc.)
  group?: string           // optional grouping key for related events
}
```

Events are the atomic elements of every scene. They do not carry frame-dependent data — frame-dependent properties (boosted coordinates, simultaneity membership) are always computed, never stored on the event.

### Observer

An inertial observer defined by velocity. In v1, all observers are inertial (no acceleration worldlines for observers themselves).

```
Observer {
  id: string              // unique within the scene
  beta: number            // velocity as fraction of c, range (-1, 1) exclusive
  label: string            // display name ("You", "Observer B", etc.)
  color: string            // hex color for slice and axis rendering
  origin?: {x: number, t: number}  // optional worldline anchor, defaults to (0, 0)
}
```

### SimultaneitySlice

A constant-time surface for a given observer, computed from observer state. Never stored as primary state — always derived.

```
SimultaneitySlice {
  observerId: string       // which observer this slice belongs to
  tPrime: number           // the coordinate time value in the observer's frame
  angle: number            // tilt angle of the slice line in the lab frame (radians)
  events: string[]         // ids of events that fall on or near this slice (within tolerance)
}
```

### WorldLine

A timelike path through spacetime, representing a persistent object.

```
WorldLine {
  id: string
  label: string
  segments: WorldLineSegment[]
  color: string
  tubeWidth?: number       // if rendered as a worldtube, half-width in spatial units
}

WorldLineSegment {
  type: 'inertial' | 'accelerating'
  startEvent: {x: number, t: number}
  endEvent: {x: number, t: number}
  beta?: number             // velocity for inertial segments
  properTimeStart: number   // accumulated proper time at segment start
  properTimeEnd: number     // accumulated proper time at segment end
}
```

### WorldTubeCrossSection

The intersection of a simultaneity slice with a worldtube. Always derived, never primary state.

```
WorldTubeCrossSection {
  worldLineId: string
  observerId: string
  tPrime: number
  spatialPosition: number    // x-coordinate of the intersection
  spatialExtent: number      // width of the tube at the intersection
  properTimeAtCut: number    // proper time along the worldline at the slice intersection
}
```

### CausalRelation

Classification of the spacetime interval between two events.

```
CausalRelation {
  eventA: string            // id
  eventB: string            // id
  type: 'timelike' | 'spacelike' | 'lightlike'
  intervalSquared: number   // s² = Δx² - Δt²  (spacelike positive convention)
  temporalOrder: Map<string, 'A first' | 'B first' | 'simultaneous'>
    // keyed by observer id — shows how ordering changes across frames
}
```

### SceneState

The complete state of one chapter's interactive scene. This is what gets serialized to URLs and what the rendering layer consumes.

```
SceneState {
  events: SpacetimeEvent[]
  observers: Observer[]
  worldLines: WorldLine[]
  activeObserverId: string | null
  compareMode: boolean
  showLightCones: boolean
  showWorldTubes: boolean
  showSlices: boolean
  blockViewMode: boolean     // true = show full block, false = show current slice only
  selectedEventPair?: [string, string]
  sliceTValue?: number       // for manual slice positioning
}
```

### ChapterState

Top-level app state combining navigation with scene state.

```
ChapterState {
  chapterId: string
  missionId: string | null
  sceneState: SceneState
  interpretationMode?: 'presentist' | 'growing-block' | 'eternalist'  // Option C only
}
```

---

## Physics Module

A pure-function module with zero rendering dependencies. Every function takes plain values and returns plain values. This module must be fully testable without a DOM.

### Core Functions

```
gamma(beta) → number
  Lorentz factor: 1 / sqrt(1 - beta²)

boostEvent(event, beta) → {x, t}
  Lorentz-transform an event to a frame moving at velocity beta.
  t' = γ(t - βx),  x' = γ(x - βt)

intervalSquared(eventA, eventB) → number
  s² = (Δx)² - (Δt)²
  Positive for spacelike, negative for timelike, zero for lightlike.

classifyRelation(eventA, eventB) → 'timelike' | 'spacelike' | 'lightlike'
  Uses intervalSquared with a small epsilon tolerance.

simultaneityAngle(beta) → number
  Angle (radians) of the t' = const line in the lab frame.
  angle = atan(beta)

eventsOnSlice(events, observer, tPrime, tolerance) → SpacetimeEvent[]
  Returns events whose boosted t-coordinate is within tolerance of tPrime.

temporalOrder(eventA, eventB, observer) → 'A first' | 'B first' | 'simultaneous'
  Boost both events, compare t' values.

sliceWorldLine(worldLine, observer, tPrime) → {x, properTime} | null
  Find where a simultaneity slice intersects a worldline.
  Returns the spatial coordinate and accumulated proper time at the intersection.

properTimeAlongSegment(segment, tStart, tEnd) → number
  Integrate sqrt(1 - v²) dt over an inertial segment, or numerically for accelerating ones.

lightConeBounds(event, t) → {xLeft, xRight} | null
  At lab-frame time t, where are the edges of event's future light cone?
  Returns null if t < event.t.

foliationFamily(observer, tMin, tMax, spacing) → SimultaneitySlice[]
  Generate a family of constant-time slices for the observer across a range.
```

### Design Rules

- All functions use the (+---) signature convention: s² = Δx² - Δt². This matches the Minkowski app.
- `beta` is always in (-1, 1) exclusive. Functions should clamp or reject values at the boundary.
- Coordinates use natural units where c = 1. Spatial and temporal axes have the same scale.
- No function in this module may reference React, canvas, DOM, or any rendering type.

---

## Rendering Strategy

### Decision: 2D Canvas

The app uses 2D Canvas (CanvasRenderingContext2D), not WebGL or Three.js.

**Rationale:**
- The Minkowski app proved that 2D canvas handles these diagrams well.
- All block-universe visualizations are projections of 1+1 spacetime (one space dimension + time). Even worldtubes are 2D ribbons, not 3D volumes.
- 2D canvas keeps the rendering code simple, debuggable, and fast to iterate.
- No shader pipeline, no GPU state management, no bundle size increase.
- Consistent text rendering with `fillText` — critical for an explanation-heavy app.

**What this means concretely:**
- Worldtubes are rendered as filled ribbons (two parallel worldline boundaries with fill between them), not 3D cylinders.
- Simultaneity slices are angled lines across the diagram, not 3D planes.
- "The block" in Chapter 6 is represented as a filled spacetime region with events and worldlines inside it, viewed from above — not a rotatable 3D object.
- Multiple observer foliations are overlapping sets of parallel lines at different angles.

If a future version requires true 3D (e.g., 2+1 spacetime), that would be a v2 rendering upgrade. v1 stays 2D.

### Canvas Hook: useCanvas

Adapted from the Minkowski pattern:

```
useCanvas(draw, deps) → canvasRef
  - Creates and manages a canvas element
  - Handles DPR (devicePixelRatio) scaling for sharp rendering on retina displays
  - Calls draw(ctx, width, height) whenever deps change
  - Returns a ref to attach to the <canvas> element
```

The draw function is the single rendering entry point per chapter. It receives a ready-to-use 2D context with DPR scaling already applied. Chapters never manage their own canvas lifecycle.

### Coordinate System

Every chapter canvas uses a consistent mapping between pixel space and spacetime coordinates.

**Spacetime coordinate space:**
- x-axis: spatial, horizontal, range [-RANGE_X, +RANGE_X]
- t-axis: temporal, vertical, increasing upward, range [0, RANGE_T]
- Origin at bottom-center of the plot area

**Pixel mapping functions:**

```
toPixel(x, t, canvasWidth, canvasHeight, margins) → {px, py}
  Maps spacetime coordinates to canvas pixel coordinates.
  Accounts for margins (axis labels, padding).
  t increases upward but py increases downward, so this inverts the y-axis.

toSpacetime(px, py, canvasWidth, canvasHeight, margins) → {x, t}
  Inverse of toPixel. Used for hit-testing and drag interactions.
```

These two functions must be exact inverses. Both live in a shared `coordinates.js` utility, not duplicated per chapter.

### Rendering Layers

Each chapter's draw function should render in this layer order (back to front):

1. **Background** — dark fill
2. **Grid** — faint coordinate lines for orientation
3. **Light cones** — translucent triangular regions from selected events
4. **Foliation / slice family** — faint parallel lines for observer foliations (Option B primarily)
5. **Worldlines / worldtubes** — colored paths and ribbons
6. **Active simultaneity slice(s)** — prominent angled line(s) with glow
7. **Events** — circles with labels
8. **Annotations** — in-canvas text callouts, relation labels, interval readouts
9. **Interaction hints** — hover highlights, drag indicators, selection rings

Layers must be drawn in this order so that interactive elements (events, slices) always appear above structural elements (grid, cones). Chapters may skip layers they don't use.

### Visual Language

**Events:** Filled circles (radius 5-7px), white or accent-colored, with short label text above or beside. Selected events get a ring highlight and a subtle shadow glow.

**Simultaneity slices:** Lines spanning the full diagram width, angled by `simultaneityAngle(beta)`. Each observer's slice uses that observer's assigned color. Active slices get a glow effect (canvas shadowBlur). In compare mode, two slices appear simultaneously.

**Light cones:** Translucent triangular fills extending from an event at 45-degree edges (since c = 1). Future cone extends upward, past cone extends downward. Use low-opacity fills so underlying structure remains visible.

**Worldlines:** Smooth paths rendered with `lineTo` in a `beginPath/stroke` block. Proper-time ticks rendered as small perpendicular marks with numeric labels.

**Worldtubes:** Two parallel worldline boundaries with a translucent fill between them. Slice intersections rendered as a highlighted horizontal bar across the tube width at the slice height.

**Foliation families (Option B):** Families of faint parallel lines, all at the same angle, spaced evenly. A second observer's foliation uses a different color and angle. The density slider controls line spacing.

**Interpretation overlays (Option C):** Same spacetime scene with different visual treatments:
- Presentist: only events on the active slice are fully opaque; everything else is dimmed.
- Growing block: events below the slice are opaque; events above are dimmed.
- Eternalist: all events equally opaque; no privileged slice emphasis.
The overlay changes opacity and emphasis, never event positions or spacetime structure.

---

## Interaction Model

### Pointer Events

All canvas interactions use the Pointer Events API (not separate mouse/touch handlers). This gives unified handling for mouse, touch, and pen input.

```
onPointerDown    — start drag or select
onPointerMove    — update drag or hover state
onPointerUp      — end drag
onPointerCancel  — abort drag
onPointerLeave   — clear hover state
```

All interactive canvases set `style={{ touchAction: 'none' }}` to prevent browser scroll/zoom interference.

### Drag Interaction Hook: useDragInteraction

Adapted from the Minkowski app's pattern:

```
useDragInteraction(canvasRef, config) → { dragging, hovering }

config {
  toSpacetime: (px, py) → {x, t}      // pixel-to-spacetime converter
  findHit: (x, t) → index | -1         // hit-test against draggable items
  onDrag: (index, x, t) → void         // called during drag with new spacetime coords
  onDragEnd: (index, x, t) → void      // called when drag completes
  clamp?: (x, t) → {x, t}             // optional bounds enforcement
}
```

This hook encapsulates:
- Hit detection with a reasonable touch target radius (minimum 20px equivalent in spacetime coords)
- Pointer capture for reliable drag tracking
- Cursor style management (crosshair default, grab on hover, grabbing during drag)
- Coordinate clamping to keep dragged items within scene bounds

### Slider Controls

Observer velocity sliders are HTML range inputs, not canvas-drawn sliders. This gives correct accessibility semantics, keyboard support, and native mobile behavior for free.

```
<input type="range" min={-0.95} max={0.95} step={0.01} />
```

The slider range stops at +/- 0.95, not +/- 1.0, to avoid singularities at the speed of light.

### Observer Lab / Sandbox Interaction

The sandbox chapters (Chapter 7 in all options) support:
- **Click to place events** — pointer down on empty canvas area creates a new event at that spacetime coordinate.
- **Drag to move events** — pointer down on an existing event initiates a drag.
- **Select event pairs** — tap two events sequentially to classify their relation.
- **Observer velocity slider** — HTML range input, one per observer.
- **Add/remove observer** — button controls outside the canvas, max 4 observers in v1.

To manage sandbox complexity, the sandbox chapter provides:
- A fixed set of 5-6 scenario presets that load predefined event configurations.
- Free placement mode limited to a maximum of 8 user-placed events.
- Observer count capped at 4.

This scope cap keeps the sandbox usable without becoming an unbounded editor.

---

## Animation Principles

### Animation Hook: useAnimationLoop

Reuse the Minkowski pattern:

```
useAnimationLoop(duration) → { progress, isPlaying, play, pause, reset, scrub }

  progress: number      // 0 to 1, normalized time position
  isPlaying: boolean
  play: () → void       // start from current position or from 0
  pause: () → void
  reset: () → void      // set progress to 0, stop playing
  scrub: (value) → void // manually set progress, cancels animation
```

Internally uses `requestAnimationFrame` with `performance.now()` for smooth, vsync-aligned animation.

### What Animates

**Simultaneity slice tilt:** When the observer velocity slider moves, the slice angle updates immediately (no transition). Slider interaction should feel direct, not laggy. This is a reactive update, not an animation.

**Guided reveal sequences:** Chapters 1 and 6 use short scripted animations:
- Chapter 1 ("The Shock"): A staged reveal where the slice starts flat, then smoothly tilts as if the observer "starts moving." Duration: 2-3 seconds. Purpose: create the initial surprise moment before the user touches the slider.
- Chapter 6 ("The Block View"): A transition from single-slice view to full-block view where controls fade out and the complete spacetime structure is shown. Duration: 3-4 seconds.

These use `useAnimationLoop` with the `progress` value mapped to interpolation parameters.

**Worldline trace:** In Chapter 5, a worldline can be drawn progressively from past to future, like a pen tracing the object's path through spacetime. Uses `progress` to control how much of the path is visible.

**Event highlighting on mission completion:** When a mission evaluates to `complete`, the relevant events or relations pulse once (scale up then back to normal over 400ms). Use a one-shot CSS animation on an overlay element, not canvas animation, to keep canvas rendering simple.

### What Does Not Animate

- Event positions: events never fly between locations. They appear, disappear, or stay put.
- Light cones: always rendered fully and immediately.
- Grid lines: no transition when switching observers.
- Text callouts: appear and disappear, no fade transitions in v1.

### Transition Timing

All scripted animations use ease-out timing:

```
easeOut(t) = 1 - (1 - t)³
```

Applied as: `animatedValue = startValue + (endValue - startValue) * easeOut(progress)`

---

## Mobile Layout Strategy

### Breakpoints

Reuse the Minkowski viewport hook:

```
useViewport() → { width, isMobile, isTablet, isCompact }

  isMobile:  width < 720
  isTablet:  width < 1080
  isCompact: width < 900
```

### Layout Rules

**Desktop (>= 1080px):**
- Canvas and control panel side by side.
- Callout panel below or beside the canvas.
- Chapter 3 two-panel comparison renders as true side-by-side panels.

**Tablet (720-1079px):**
- Canvas full width, controls below.
- Callout panel below controls.
- Chapter 3 two panels stack vertically with a "swap observer" toggle instead of side-by-side.

**Mobile (< 720px):**
- Canvas full width, reduced height (320px vs 440px desktop).
- Controls in a compact horizontal strip below canvas.
- Callout panel collapses into an expandable drawer.
- Chapter 3: single panel with an observer toggle button. No side-by-side on mobile.
- Sandbox chapter (Ch 7): preset selector only. Free event placement disabled on mobile — touch targets are too small for reliable spacetime coordinate placement on a phone-width canvas.

### Canvas Sizing

```
canvasHeight:
  mobile:  320px
  tablet:  390px
  desktop: 440px

canvasWidth:
  always 100% of container width
```

The coordinate mapping functions (`toPixel`, `toSpacetime`) accept canvas dimensions as parameters, so they adapt automatically.

### Touch Target Minimums

All interactive elements (events, slice drag handles) must have a minimum touch target of 44x44px equivalent in screen space. For events rendered as 6px circles on canvas, the hit-test radius in `findHit` must be at least 22px regardless of the visual radius.

### Hover States on Touch

Hover-dependent features (cursor changes, tooltip previews) degrade gracefully on touch:
- No hover-only information. Everything visible on hover must also be accessible via tap or always visible.
- Tap-and-hold (300ms) on a canvas event shows a tooltip-equivalent overlay. Release dismisses it.

---

## Accessibility Baseline

### Color

No information should be conveyed by color alone. Every color-coded element must also have a secondary differentiator:

- **Observer slices:** Different colors AND different dash patterns (solid, dashed, dotted).
- **Causal relations:** Different colors AND text labels ("timelike", "spacelike", "lightlike").
- **Interpretation overlays (Option C):** Different colors AND icon markers or text tags.

The color palette should be tested against deuteranopia and protanopia simulations. Recommended approach: use a blue/orange primary pair (distinguishable in all common color vision types) rather than red/green.

### Canvas Accessibility

Canvas elements are inherently inaccessible to screen readers. Mitigation strategy:

- Each canvas has a companion `aria-live="polite"` region that announces state changes in text form.
- When the observer velocity changes: announce "Observer velocity: 0.6c. Events A and B are simultaneous. Event C is in the future."
- When a mission completes: announce the success text.
- When an event is selected: announce its coordinates and relations to other events.

This does not make the visual experience fully accessible, but it makes the conceptual content available to screen reader users.

### Keyboard Navigation

- Slider controls are native HTML inputs — already keyboard accessible.
- Canvas event selection: support Tab to cycle through events, Enter to select, arrow keys to nudge position in sandbox mode.
- Chapter navigation: support left/right arrow keys for previous/next chapter.

### Reduced Motion

Respect `prefers-reduced-motion`:

```
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

When active:
- Skip all scripted reveal animations. Show the final state immediately.
- Disable worldline progressive drawing. Show the full worldline immediately.
- Keep slider reactivity (this is user-initiated, not decorative animation).

---

## URL Serialization

### Format

URL state is encoded in query parameters. Only non-default values are serialized to keep URLs short.

```
?ch=the-shock&m=find-disagreement&obs=0.6&obs2=0.3&cmp=1&lc=1&wt=0&bv=0&events=A:0,3|B:2,7|C:-1,5
```

### Parameter Map

| Key      | Type     | Description                           | Default         |
|----------|----------|---------------------------------------|-----------------|
| ch       | string   | Chapter id                            | first chapter   |
| m        | string   | Active mission id                     | null            |
| obs      | number   | Primary observer beta                 | 0               |
| obs2     | number   | Second observer beta (compare mode)   | null            |
| cmp      | 0/1      | Compare mode                          | 0               |
| lc       | 0/1      | Show light cones                      | 0               |
| wt       | 0/1      | Show worldtubes                       | 0               |
| sl       | 0/1      | Show slices                           | 1               |
| bv       | 0/1      | Block view mode                       | 0               |
| events   | string   | Encoded event positions               | chapter default |
| interp   | string   | Interpretation mode (Option C only)   | eternalist      |
| pair     | string   | Selected event pair ("A,B")           | null            |
| st       | number   | Manual slice t-value                  | null            |

### Event Encoding

Same format as the Minkowski app:

```
A:0,3|B:2,7|C:-1,5
```

Format: `LABEL:x,t` separated by `|`. Values rounded to one decimal. Labels are sorted alphabetically for canonical URLs.

### Serialization Functions

```
serializeChapterState(chapterState) → string
  Converts ChapterState to a query string. Omits default values.

deserializeChapterState(queryString, chapterDefaults) → ChapterState
  Parses query string back to ChapterState. Fills missing values from chapterDefaults.
  Clamps all numeric values to valid ranges.
```

Round-trip invariant: `deserialize(serialize(state))` must produce a state equivalent to the input. This invariant must be covered by unit tests.

---

## Mission System

### Mission Definition

Each chapter defines its missions as a static array:

```
Mission {
  id: string               // URL-safe identifier
  title: string            // short display title
  summary: string          // one-sentence description shown in mission panel
  objective: string        // what the user should do
  successText: string      // shown on completion
  preset?: () → SceneState // optional preset that loads initial conditions for the mission
}
```

### Mission Evaluation

Each chapter provides a pure evaluation function:

```
evaluateMission(missionId, sceneState) → MissionStatus

MissionStatus {
  complete: boolean
  label: string            // short progress hint ("Move observer past 0.5c")
  detail: string           // longer guidance text
}
```

Evaluation functions are pure: they take the current scene state and return a status. No side effects, no DOM access, no React hooks. This makes them fully testable.

### Evaluation Frequency

Mission status is re-evaluated on every scene state change (slider move, event drag, toggle change). Since evaluation functions are pure and operate on small data sets, this is cheap.

### Mission UI

The mission panel is an HTML component outside the canvas:
- Tab bar showing mission titles for the current chapter.
- Active mission shows objective, live status badge, and optional "Load Preset" button.
- On completion: success text appears, "Next Mission" button becomes available.

---

## Chapter Registry

### Structure

```
ChapterDefinition {
  id: string                        // URL-safe, e.g. "the-shock"
  chapter: string                   // display label, e.g. "Chapter 1"
  title: string                     // e.g. "The Shock"
  subtitle: string                  // e.g. "Breaking the assumption"
  description: string               // one-paragraph summary
  goal: string                      // what the user should learn
  takeaway: string                  // one-sentence summary of the lesson
  color: string                     // chapter accent color
  Component: React.LazyComponent    // lazy-loaded chapter component
  defaultSceneState: SceneState     // initial scene state for this chapter
  missions: Mission[]               // guided missions for this chapter
  evaluateMission: (id, state) → MissionStatus
}
```

### Registry

The chapter registry is a single ordered array. Chapter order in the array defines the navigation sequence. No separate routing configuration.

```
const chapters: ChapterDefinition[] = [
  theShock,
  whoseNow,
  sameRealityDifferentSlices,
  causalityStillHolds,
  worldlinesAndWorldtubes,
  theBlockView,
  observerLab,
];
```

---

## Testing Strategy

### What Must Be Tested

**Physics module (unit tests, highest priority):**
- `boostEvent` round-trip: boost by +beta then -beta returns the original event (within float tolerance).
- `intervalSquared` is invariant: same value before and after a boost.
- `classifyRelation` correctness for known timelike, spacelike, and lightlike pairs.
- `eventsOnSlice` returns correct events for known configurations.
- `temporalOrder` matches expected results and flips correctly for spacelike pairs under boost.
- `foliationFamily` produces slices at the correct angles and spacing.
- `sliceWorldLine` returns correct intersection points.
- `properTimeAlongSegment` matches analytic results for inertial segments.

**URL serialization (unit tests, high priority):**
- Round-trip: `deserialize(serialize(state))` equals original state.
- Default omission: default values produce an empty or minimal query string.
- Clamping: out-of-range values in the URL are clamped to valid ranges.
- Malformed input: garbage query strings produce valid default state, not crashes.

**Mission evaluation (unit tests, high priority):**
- Each mission evaluates to `complete: false` on the default scene state.
- Each mission evaluates to `complete: true` on a known solution state.
- Edge cases near completion thresholds are handled without flicker.

**Coordinate mapping (unit tests, medium priority):**
- `toSpacetime(toPixel(x, t))` returns the original (x, t) within tolerance.
- Boundary values (edges of the plot area) map correctly.

**Scene state (unit tests, medium priority):**
- Adding/removing events produces correct state.
- Adding/removing observers produces correct state.
- Compare mode toggling preserves observer state.

### What Does Not Need Tests In v1

- Visual rendering output (canvas pixel assertions are brittle and low-value).
- Component rendering (no snapshot tests).
- Animation timing (tested manually).
- CSS/layout responsiveness (tested manually across devices).

### Test Runner

Vitest, matching the Minkowski app. All test files colocated with source: `physics.test.js` next to `physics.js`.

---

## Project Structure

```
block-universe-app/
  index.html
  vite.config.js
  package.json
  vitest.config.js
  src/
    main.jsx                          // entry point
    App.jsx                           // shell, chapter registry, navigation
    theme.js                          // colors, typography constants
    chapters/
      registry.js                     // ordered chapter array
      the-shock/
        TheShock.jsx                  // chapter component
        missions.js                   // mission definitions + evaluator
        defaults.js                   // default scene state
      whose-now/
        ...
      same-reality/
        ...
      causality/
        ...
      worldlines/
        ...
      block-view/
        ...
      observer-lab/
        ...
    physics/
      lorentz.js                      // gamma, boostEvent, intervalSquared
      lorentz.test.js
      spacetime.js                    // classifyRelation, eventsOnSlice, temporalOrder
      spacetime.test.js
      worldline.js                    // sliceWorldLine, properTimeAlongSegment
      worldline.test.js
      foliation.js                    // foliationFamily, simultaneityAngle
      foliation.test.js
    canvas/
      useCanvas.js                    // canvas lifecycle hook
      coordinates.js                  // toPixel, toSpacetime
      coordinates.test.js
      useDragInteraction.js           // pointer event drag handling
      layers.js                       // shared drawing helpers (drawEvent, drawSlice, drawLightCone, drawWorldLine, drawGrid)
    state/
      sceneState.js                   // SceneState creation and manipulation helpers
      shareableState.js               // URL serialize/deserialize
      shareableState.test.js
    hooks/
      useViewport.js                  // responsive breakpoints
      useAnimationLoop.js             // animation progress hook
    components/
      ChapterShell.jsx                // shared chapter layout (canvas + controls + callout)
      GuidedMissionPanel.jsx          // mission tabs, status, presets
      ObserverSlider.jsx              // velocity slider with label and readout
      CalloutPanel.jsx                // live teaching text
      AnnotationOverlay.jsx           // in-canvas text callouts (HTML overlay positioned over canvas)
      ProgressHeader.jsx              // chapter progress bar
      LandingPage.jsx                 // app entry / thesis page
      AriaLiveRegion.jsx              // screen reader announcements for canvas state
```

---

## Build Sequence Adjustment

Based on complexity analysis, the recommended implementation order within Option A is:

### Phase 1: Foundation (build once, used by all chapters)
1. Physics module with full tests
2. Canvas utilities (useCanvas, coordinates, useDragInteraction, shared drawing helpers)
3. URL serialization with full tests
4. App shell (chapter registry, navigation, progress header, landing page)
5. Shared components (ChapterShell, ObserverSlider, CalloutPanel, GuidedMissionPanel)

### Phase 2: Core chapters (one at a time, in order)
6. Chapter 1: The Shock
7. Chapter 2: Whose Now?
8. Chapter 3: Same Reality, Different Slices
9. Chapter 4: Causality Still Holds
10. Chapter 5: Worldlines And Worldtubes
11. Chapter 6: The Block View

### Phase 3: Sandbox (separate phase, higher complexity)
12. Chapter 7: Observer Lab

The sandbox chapter is estimated at 2-3x the effort of a guided chapter because it requires free event placement, multi-observer management, dynamic URL state for arbitrary configurations, and more complex hit-testing. Separating it into its own phase prevents it from blocking the core teaching experience.

---

## Assumptions And Constraints

- All spacetime is 1+1 dimensional (one spatial + one temporal). No 2+1 or 3+1 rendering in v1.
- All observers are inertial. No accelerating observer frames.
- Maximum 4 observers per scene.
- Maximum 8 user-placed events in sandbox mode, plus chapter-defined events.
- No server component. The app is fully static and client-side.
- No analytics or telemetry in v1.
- No internationalization in v1. English only.
- Minimum browser support: last 2 versions of Chrome, Firefox, Safari, Edge. No IE11.
