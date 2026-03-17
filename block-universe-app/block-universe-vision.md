# Block Universe Vision

## Summary
This document defines a new standalone app concept for the `physics-experiments` repo: a **Block Universe** experience built in the spirit of the Minkowski app, but focused more directly on the non-existence of universal time, observer-relative simultaneity, and the geometric meaning of a four-dimensional spacetime view.

The app should live as a **separate sibling project** at `/Users/andreinemilentsau/Projects/physics-experiments/block-universe-app`. It should reuse the successful interaction patterns of the Minkowski app, but not be coupled to it in v1. The new app should feel like a deeper conceptual companion, not a new chapter added into the existing product.

This vision includes **three distinct standalone product directions**:
- a general-audience version
- a physics-literate version
- a philosophy-forward version

All three share the same technical foundation and conceptual core, but differ in tone, pacing, chapter emphasis, and how much interpretive framing they expose. Only **one** should be built at a time. The default recommendation is to build the **general-audience version first**.

## Shared Product Core
The app's central claim is:

> Special relativity does not support a single observer-independent "now," and the block-universe interpretation is one natural geometric way to understand that.

Every version of the app must teach these ideas clearly:
- simultaneity is observer-relative
- there is no universal present slice spanning all of spacetime
- causality remains invariant even when temporal ordering for spacelike-separated events changes
- objects can be understood as extended 4D worldlines or worldtubes
- a "present moment" is best treated as an observer-dependent slice, not a universal moving frontier

The app must stay within **special relativity / flat spacetime** in v1:
- no cosmology
- no general relativity
- no speculative consciousness claims
- no unsupported metaphysical assertions presented as empirical physics

Interpretive framing is still allowed when clearly labeled. In practice, that means:
- Option A stays mostly physics-first with light interpretation
- Option B stays SR-only and technical, with at most a short non-core teaser that curved spacetime complicates time even further
- Option C may explicitly discuss the metaphysics of time, but only as an interpretation layer built on top of fixed SR geometry

The app should match the successful structural features of the Minkowski project:
- guided landing page and chapter flow
- chapter metadata: title, goal, takeaway, subtitle
- chapter progression controls and direct navigation
- live explanatory callouts
- in-canvas annotations
- guided missions or prompts
- shareable URL state
- lightweight unit tests for core logic

## Shared Technical Direction
Build the new app with the same stack and baseline conventions as the Minkowski app:
- React + Vite
- canvas-based visualizations where needed
- lightweight pure logic modules for mission evaluation and scene transforms
- URL serialization for chapter and scene state
- `build`, `lint`, and `test` scripts from day one

The new app should not share runtime code with `minkowski-space-time-app` in v1. Instead:
- copy or adapt proven patterns such as `useCanvas`, chapter shell, annotation components, and URL-state handling
- keep `block-universe-app` fully standalone
- allow future extraction of shared abstractions only after both apps stabilize

The public app structure should follow the same pattern as the Minkowski shell:
- chapter registry with `id`, `chapter`, `title`, `subtitle`, `description`, `goal`, `takeaway`, `color`, and `Component`
- pure scene state helpers
- pure mission evaluators
- pure URL-state parser/serializer
- chapter-specific canvas or scene modules

For interpretation-heavy variants, the app should preserve a fixed physics layer and vary only the explanatory or ontological overlay. Different interpretations must never change the underlying spacetime scene itself.

## Option A: Curious General Audience
### Positioning
This is the most accessible and most likely best first build. It should feel like a high-clarity visual story for thoughtful non-specialists.

### Experience Goal
A user with little or no formal relativity background should finish the app able to say:
- "Different observers can disagree about what is happening now."
- "That does not break causality."
- "The block universe is a way of understanding spacetime as a whole, not a claim that physics discovered a magical master timeline."

### Aesthetic Direction
Use a luminous, observatory-like style:
- dark atmospheric base
- warm gold, amber, copper, and pale cyan accents
- large thesis typography
- slow, deliberate animation
- slice planes and event markers that feel elegant and legible, not technical-first

The signature visual should be:
- one fixed 4D event scene
- multiple observer-dependent "present" slices cutting through it differently

### Chapter Plan
1. **The Shock**
   Introduce the challenge to everyday intuition: two distant events may look simultaneous to one observer and not to another.

2. **Whose Now?**
   A basic simultaneity explorer with one observer velocity slider and visible "now" slices.

3. **Same Reality, Different Slices**
   Keep the event set fixed while switching observers. Emphasize that the scene does not change; only the slicing changes.

4. **Causality Still Holds**
   Contrast simultaneity shifts with a stable light-cone structure so users do not confuse frame-relative "now" with causal contradiction.

5. **Worldlines And Worldtubes**
   Show objects not as things blinking in and out at moments, but as extended traces through spacetime.

6. **The Block View**
   Pull the ideas together into a clear visualization of a fixed spacetime whole plus observer-dependent cross-sections.

7. **Observer Lab**
   Sandbox mode where users place events and compare which are "now" for different observers.

### Required Interactions
- observer velocity slider
- visible simultaneity slice overlay
- two-observer comparison view
- toggle between "underlying block" and "current slice"
- worldtube cross-section view
- guided prompts such as "find two observers who disagree about which event is present"

## Option B: Physics-Literate Deep Dive
### Positioning
This version assumes the user is already comfortable with Minkowski diagrams and wants a denser, more geometric treatment.

### Experience Goal
A physics-literate user should finish able to say:
- "The absence of universal time is a direct consequence of frame-dependent simultaneity."
- "A block-universe reading is geometrically natural in SR."
- "Proper time remains locally meaningful even though global simultaneity is not absolute."

This version should stay fully within flat spacetime in its core chapters. If needed, it may end with a short, clearly marked note that curved spacetime complicates global time even further, but GR is not part of the main app argument.

### Aesthetic Direction
Use a technical lab-manual style:
- cooler palette
- sharper grid systems
- denser overlays and axis treatments
- explicit equations where helpful
- restrained but precise motion

The signature visual should be:
- multiple observer foliations shown over the same Minkowski scene

### Chapter Plan
1. **Relativity Of Simultaneity**
   Start from the standard relativity result and make it the centerpiece.

2. **Foliations Of Spacetime**
   Show observers as families of constant-time slices, not just a single `t' = 0` line.

3. **Spacelike Reordering**
   Demonstrate changing temporal order for spacelike-separated events across frames.

4. **Proper Time vs Coordinate Time**
   Clarify what remains invariant and locally measurable.

5. **Worldtubes And Extended Objects**
   Move from event diagrams to 4D geometry of persistent objects.

6. **Block Universe As Geometric Reading**
   Present eternalism as the cleanest geometric interpretation of the structure already shown.

7. **Advanced Slice Lab**
   Multi-observer lab with quantitative readouts and technical tasks.

### Required Interactions
- 2-4 observer overlay mode
- spacelike pair reorder tracker
- readouts for `Δt`, `Δx`, `s²`, simultaneity class, and proper-time values
- foliation-family display mode
- mission prompts phrased as technical checks rather than beginner exercises

## Option C: Philosophy-Forward Version
### Positioning
This version is built for users who want the physics and the metaphysical implications discussed together, but with a strict separation between physics claims and interpretive claims.

### Experience Goal
A reflective user should finish able to say:
- "Relativity puts pressure on a universal present."
- "Presentism, growing block, and eternalism are interpretations, not interchangeable physics results."
- "Block universe is philosophically powerful, but it must be separated from claims about determinism or free will."

This version should explicitly include the metaphysics of time, but only in a bounded way:
- presentism
- growing block theory
- eternalism / block universe
- becoming vs tenseless existence

It should not expand into consciousness theories, theology, cosmology, or broad reality metaphysics.

### Aesthetic Direction
Use an editorial / exhibition style:
- more text-forward layouts
- bold typographic hierarchy
- slower pacing
- cleaner gallery framing
- fewer controls per screen, more interpretive staging

The signature visual should be:
- the same spacetime scene interpreted through multiple ontology overlays

### Chapter Plan
1. **What Is The Present?**
   Start from ordinary intuition before introducing relativity.

2. **Relativity And The Collapse Of Universal Now**
   Use the minimum required SR to show why a global present is not observer-independent.

3. **Three Views Of Time**
   Presentism, growing block, and eternalism on top of the same spacetime structure.

4. **Why The Block Universe Feels Strange**
   Contrast tenseless description with lived sequential experience.

5. **Block Universe Is Not Determinism**
   Separate ontology, predictability, and free-will claims.

6. **Local Becoming Without Global Time**
   Preserve what remains meaningful: causality, proper time, records, and perspective.

7. **Interpretation Studio**
   Let users toggle interpretive overlays while keeping the underlying physics fixed.

### Required Interactions
- interpretation toggle that changes commentary and overlays, not physics
- explicit claim tags such as `empirical`, `geometric`, and `interpretive`
- side-by-side "physics says" vs "interpretation adds" framing
- guided prompts about which claims survive across interpretations

## Recommended First Build
Build **Option A** first.

Reason:
- it is closest in spirit to the existing Minkowski app
- it has the best clarity-to-effort ratio
- it establishes the reusable block-universe scaffold cleanly
- it gives the best chance of producing a strong, memorable standalone app quickly
- Option B and Option C can later be derived by changing chapter density, overlays, and explanatory framing on top of the same technical architecture

## Implementation Defaults
- App path: `/Users/andreinemilentsau/Projects/physics-experiments/block-universe-app`
- Project type: standalone React + Vite app
- Initial chapter count: 7 chapters in every variant
- URL state must encode at least: current chapter, current mission, observer/slice settings, and chapter scene seed
- Touch/mobile support is required from the start
- Mission logic and scene transforms must be testable without rendering
- The existing Minkowski app remains unchanged in v1 except for optional future linking outside this scope

## Acceptance Criteria
The chosen variant is complete when:
- a first-time user can explain why SR does not support a universal present
- the app clearly distinguishes changing simultaneity from unchanged causality
- at least one chapter shows the same fixed event set under multiple observer slicings
- at least one chapter shows worldlines/worldtubes rather than isolated moments
- the app has a guided shell, in-scene callouts, shareable URL state, and working tests
- `build`, `lint`, and `test` all pass for the new standalone app

## Assumptions
- Only one option will be implemented at a time.
- The first implementation should remain within special relativity and geometric interpretation.
- No shared package extraction from the Minkowski app is required in v1.
- Future work may add cross-links or a multi-app landing page, but that is out of scope for this vision document.
