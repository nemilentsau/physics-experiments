# Option A: General Audience Plan

## Summary
This document defines the first implementation direction for the standalone Block Universe app: a **general-audience, visual-first, high-clarity experience** that teaches why special relativity does not support a single universal present.

The app should feel like a conceptual companion to the Minkowski app, but it should have its own identity, pacing, and teaching goal. The purpose is not to argue abstract metaphysics. The purpose is to make one physical idea intuitive and difficult to forget:

> Different observers can carve spacetime into different "nows," and that does not mean reality is changing underneath them.

This version should be the first one built because it has the best balance of conceptual depth, visual payoff, and accessibility.

## Product Vision
The app should be a guided observatory-like experience for curious users who are interested in time, relativity, and the meaning of "now" but do not necessarily have formal physics training.

The user should leave with a stable mental model:
- there is no observer-independent universal present in special relativity
- simultaneity depends on the observer
- causality does not depend on the observer in the same way
- the block-universe picture is a natural geometric reading of spacetime
- objects and people are easier to understand as worldlines or worldtubes than as things existing only at a single moving present

This should feel like a visual story, not a technical manual and not a philosophy seminar.

## Audience
Primary audience:
- curious non-specialists
- science-interested learners
- people who have heard phrases like "block universe" or "relativity of simultaneity" but do not yet have an intuitive picture

Secondary audience:
- users who already went through the Minkowski app and want a deeper conceptual companion

The app should assume:
- no advanced math
- no prior comfort with Minkowski diagrams
- willingness to interact and explore if the UI is clear

## Learning Outcomes
By the end of the app, a first-time user should be able to explain:
- why "what exists right now" is not a universal physics question in SR
- how two observers can disagree about simultaneity without contradiction
- why causality stays intact even when simultaneity shifts
- how a worldline differs from a momentary snapshot
- why the block universe is a natural interpretation of the geometry they just explored

## Experience Principles
- Visual first: the idea should be seen before it is named.
- One idea per chapter: no chapter should try to teach two core concepts at equal weight.
- Fixed scene, changing slice: the user must repeatedly experience that the underlying spacetime stays put while the observer description changes.
- Causality guardrail: every place where "now" changes should also remind the user that causal structure remains stable.
- Plain-language copy: short sentences, concrete claims, minimal jargon.
- Controlled wonder: the experience should feel profound without becoming vague.

## Tone And Aesthetic Direction
The mood should be **luminous observatory**:
- dark background
- warm gold and amber slice planes
- pale cyan and white event markers
- soft layered glow
- gentle, intentional motion
- elegant serif display typography with precise mono labels

It should not look like a copy of the Minkowski app. The shared spirit is clarity, not duplication.

The memorable image of the app should be:
- one fixed spacetime scene
- several translucent present slices passing through it from different observer perspectives

## App Shell
The shell should follow the same high-level structure that worked in the Minkowski app:
- strong landing thesis
- guided chapter path
- chapter-by-chapter navigation
- direct chapter jumps
- progress header
- live callout panel
- embedded canvas annotations
- final sandbox chapter
- shareable URL state

The shell should frame the app as one argument:
1. your intuition says there is one shared present
2. relativity breaks that idea
3. causality survives
4. worldlines/worldtubes make the geometry easier to read
5. block universe emerges as a coherent picture

## Chapter Structure
The app should have 7 chapters.

Each chapter should contain:
- one main visualization
- one compact control panel
- one live teaching callout
- one or more in-canvas annotations
- 2-3 guided prompts or missions
- one explicit takeaway sentence
- one "up next" bridge into the next chapter

## Chapter 1: The Shock
### Goal
Break the user's assumption that distant simultaneity is universal.

### Main idea
Two distant events can be simultaneous for one observer and not for another.

### Visualization
A clean event field with two or three highlighted distant events and one visible "present" slice. When the observer changes, the slice tilts and the simultaneity labels update.

### What the user does
- start from a default observer at rest
- move a single observer velocity slider
- watch a "same now" relationship disappear

### What the chapter teaches
The user's ordinary idea of one shared present does not survive even the simplest relativistic change of frame.

### Memorable moment
An annotation should explicitly call out:
"These events did not move. Only the observer's now-slice changed."

## Chapter 2: Whose Now?
### Goal
Turn the relativity of simultaneity into something the user can manipulate comfortably.

### Main idea
"Now" is not global; it is tied to an observer's frame.

### Visualization
A dedicated simultaneity-slice explorer with:
- one observer
- one velocity slider
- visible grid
- labeled events
- highlighted slice

### What the user does
- vary observer speed
- inspect which events fall on the same slice
- load a few presets that exaggerate the effect

### What the chapter teaches
The app should make "simultaneous for whom?" feel like the central question.

### Memorable moment
A side-by-side mini comparison of one event set under two different slice angles.

## Chapter 3: Same Reality, Different Slices
### Goal
Prevent the user from misreading observer-dependent time as observer-dependent reality.

### Main idea
The underlying spacetime event set is fixed; only the observer's slicing changes.

### Visualization
Two synchronized panels:
- left: observer A
- right: observer B

Both panels show the same labeled event set with different present slices.

### What the user does
- compare two observers at once
- toggle "show same events"
- hover matching event labels across both views

### What the chapter teaches
Different descriptions do not imply different worlds.

### Memorable moment
A shared annotation should connect the same event in both panels with text like:
"One event. Two valid descriptions."

## Chapter 4: Causality Still Holds
### Goal
Separate changing simultaneity from causal possibility.

### Main idea
Relativity changes simultaneity assignments, but not the causal structure set by light cones.

### Visualization
An event field with:
- light cones
- observer slices
- highlighted timelike, spacelike, and lightlike relations

### What the user does
- move the observer
- inspect event pairs
- see that some ordering changes while causal reachability does not

### What the chapter teaches
The absence of universal time does not mean "anything goes."

### Memorable moment
A prompt should ask the user to find an event pair whose temporal order can flip while the app keeps calling it spacelike and acausal.

## Chapter 5: Worldlines And Worldtubes
### Goal
Replace the user's snapshot-based intuition with a spacetime-based one.

### Main idea
Objects are better pictured as extended traces through spacetime than as things existing only at a single instant.

### Visualization
A worldline/worldtube scene showing:
- a stationary object
- a moving object
- a person or ship trace
- one observer slice intersecting those traces

### What the user does
- toggle between "moment view" and "worldline view"
- move the slice and see different cross-sections

### What the chapter teaches
What we call "the present state of an object" can be understood as a slice through a larger spacetime structure.

### Memorable moment
The app should visually reveal a full worldtube first, then cut it with a slice plane so the user sees the present as a cross-section rather than a moving spotlight.

## Chapter 6: The Block View
### Goal
Synthesize the earlier chapters into the block-universe picture.

### Main idea
If there is no universal present, then a fixed spacetime whole with observer-dependent slices becomes a natural way to think about the geometry.

### Visualization
A higher-level spacetime scene that combines:
- fixed event set
- worldlines/worldtubes
- multiple observer slices
- optional ghosted alternate slices

### What the user does
- compare one observer's now with another's
- toggle "underlying block" and "current slice"
- trigger a guided reveal from moment-thinking to block-thinking

### What the chapter teaches
The block universe is not a separate hidden mechanism. It is a coherent way of reading the structure already explored.

### Memorable moment
The app should fade the control noise away and leave a quiet final composition:
"Nothing new was added. Only the geometry was taken seriously."

## Chapter 7: Observer Lab
### Goal
Let the user test and reinforce the model on their own.

### Main idea
Once the user can manipulate events and observers directly, the lack of universal time becomes a usable intuition rather than a one-off surprise.

### Visualization
A sandbox with:
- event placement
- one or two observers
- slice overlays
- light-cone overlays
- relation classification

### What the user does
- place events
- assign observer velocities
- ask "simultaneous for whom?"
- save/share scenarios by URL

### What the chapter teaches
The user should leave with confidence, not just awe.

## Recurring Interaction Systems
The app should reuse the same four systems across chapters:
- **Event field**
  A fixed set of spacetime points with labels.
- **Observer slice system**
  One or more present slices generated from observer state.
- **Causal structure layer**
  Light cones and relation classification.
- **Worldline/worldtube system**
  Persistent traces through spacetime for objects.

Repetition is important. The user should feel that each chapter is building on the same underlying world rather than introducing a brand-new toy.

## Controls And Inputs
The main controls should be small in number and highly legible:
- observer velocity slider
- compare-observer toggle
- preset selector
- show/hide slice overlays
- show/hide light cones
- block vs slice mode toggle
- guided mission selector

Controls should avoid over-precision. Touch interactions should be forgiving.

## Guided Missions
Each chapter should include 2-3 small goals that direct the eye. Examples:
- "Find a speed where these two events stop being simultaneous."
- "Switch to compare mode and find one event that both observers agree exists, but not at the same now."
- "Identify a pair whose order changes but whose causal status does not."
- "Move the slice until it cuts the ship worldtube at the marked cross-section."

Mission completion should trigger:
- a concise payoff statement
- an optional suggestion for the next mission
- stronger annotation emphasis inside the scene

## Copy Style
Copy should be:
- short
- declarative
- non-pretentious
- physically grounded

Avoid:
- long philosophical digressions
- heavy metaphysical language
- overuse of technical terms before the user has seen the concept visually

Preferred phrasing:
- "These are the same events."
- "The observer changed, not the underlying spacetime."
- "Different now-slices do not change what can cause what."
- "The present is a slice, not a universal border."

## Content Boundaries
This version should **not** try to cover:
- general relativity
- cosmological time
- quantum mechanics
- free will
- determinism as a main topic
- presentism vs eternalism as a debate chapter

Those can exist later in other versions, but Option A should remain disciplined.

## Technical Direction
The app should still be structured for serious quality even though it is concept-first:
- standalone React + Vite app
- shared app shell pattern similar to Minkowski
- canvas-based rendering for the core scenes
- pure scene-state helpers
- pure mission evaluators
- URL share state for chapter and scenario
- tests for logic and state round-tripping

The new app should stay independent of the Minkowski app in v1. Reuse patterns, not live code sharing.

## URL State
The URL should encode at least:
- active chapter
- active mission
- observer velocity or velocities
- selected preset or scene seed
- compare mode where applicable
- sandbox event state

This should make it easy to share a specific "no universal now" setup.

## Acceptance Criteria
Option A is successful when:
- a first-time user can explain why special relativity does not support one universal present
- the user can distinguish simultaneity from causality
- the app includes at least one chapter where the same fixed event set is shown under multiple observer slices
- the app includes at least one chapter where objects are presented as worldlines or worldtubes
- the app has a guided shell, embedded annotations, live callouts, and a final sandbox
- mobile and desktop both feel intentional
- the chosen scenes are shareable via URL

## Non-Goals
- no app scaffolding in this document
- no implementation details below the architectural level
- no code-sharing refactor with the Minkowski app
- no heavy philosophical comparison framework
- no attempt to answer every metaphysical question raised by the block universe

## Recommended Build Sequence
When implementation starts, the chapters should be built in this order:
1. The Shock
2. Whose Now?
3. Same Reality, Different Slices
4. Causality Still Holds
5. Worldlines And Worldtubes
6. The Block View
7. Observer Lab

This order preserves the teaching arc:
- surprise
- manipulation
- comparison
- guardrail
- reframe
- synthesis
- self-testing

## Final Position
Option A should be memorable because it makes a deep idea feel visually obvious.

The user should not finish thinking:
"That was an interesting philosophical opinion."

They should finish thinking:
"I can now see why physics does not give us one universal present."
