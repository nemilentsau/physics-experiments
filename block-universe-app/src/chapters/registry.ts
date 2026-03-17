import { lazy } from 'react';
import type { ChapterDefinition } from '../types.ts';
import { colors } from '../theme.ts';

const TheShock = lazy(() => import('./the-shock/TheShock.tsx'));
const WhoseNow = lazy(() => import('./whose-now/WhoseNow.tsx'));
const SameReality = lazy(() => import('./same-reality/SameReality.tsx'));
const Causality = lazy(() => import('./causality/Causality.tsx'));
const Worldlines = lazy(() => import('./worldlines/Worldlines.tsx'));
const BlockView = lazy(() => import('./block-view/BlockView.tsx'));
const ObserverLab = lazy(() => import('./observer-lab/ObserverLab.tsx'));

export const chapters: ChapterDefinition[] = [
  {
    id: 'the-shock', chapter: 'Chapter 1', title: 'The Shock', subtitle: 'Break the assumption',
    description: 'Distant simultaneity is not universal. Move the slider and watch the present tilt.',
    goal: 'See that changing velocity changes which events are simultaneous.',
    takeaway: 'There is no single "now" shared by all observers.',
    color: colors.sliceGold, icon: '\u26A1', Component: TheShock,
  },
  {
    id: 'whose-now', chapter: 'Chapter 2', title: 'Whose Now?', subtitle: 'Explore the slice',
    description: 'A dedicated slice explorer. One observer, one slice, many events. Which ones are "now"?',
    goal: 'Make "simultaneous for whom?" feel central.',
    takeaway: '"Now" is always relative to an observer\'s velocity.',
    color: colors.eventCyan, icon: '\u2300', Component: WhoseNow,
  },
  {
    id: 'same-reality', chapter: 'Chapter 3', title: 'Same Reality, Different Slices', subtitle: 'Compare observers',
    description: 'Two observers, same events, different present slices. The underlying reality doesn\'t change.',
    goal: 'Prevent misreading observer-dependent time as observer-dependent reality.',
    takeaway: 'One event. Two valid descriptions.',
    color: colors.observerB, icon: '\u29C9', Component: SameReality,
  },
  {
    id: 'causality', chapter: 'Chapter 4', title: 'Causality Still Holds', subtitle: 'The guardrail',
    description: 'Simultaneity can change, but cause and effect cannot be reversed for causally connected events.',
    goal: 'Separate changing simultaneity from causal possibility.',
    takeaway: 'The light cone is the boundary of influence, and it never tilts.',
    color: colors.lightCone, icon: '\u25C7', Component: Causality,
  },
  {
    id: 'worldlines', chapter: 'Chapter 5', title: 'Worldlines And Worldtubes', subtitle: 'The reframe',
    description: 'Replace snapshot-based intuition with spacetime paths. An object isn\'t just where it is now.',
    goal: 'See objects as extended through time, not frozen in a moment.',
    takeaway: 'A worldline is the complete history and future of an object.',
    color: colors.worldline, icon: '\u2502', Component: Worldlines,
  },
  {
    id: 'block-view', chapter: 'Chapter 6', title: 'The Block View', subtitle: 'The synthesis',
    description: 'Combine everything: events, worldlines, multiple slices. The block universe is the geometry taken seriously.',
    goal: 'Synthesize all chapters into the block-universe picture.',
    takeaway: 'Nothing new was added. Only the geometry was taken seriously.',
    color: colors.sliceAmber, icon: '\u25A3', Component: BlockView,
  },
  {
    id: 'observer-lab', chapter: 'Chapter 7', title: 'Observer Lab', subtitle: 'The sandbox',
    description: 'Full sandbox. Place events, add observers, classify pairs, overlay slices and light cones. Test the model.',
    goal: 'Let you test and reinforce the block-universe model freely.',
    takeaway: 'You now own the geometry.',
    color: colors.observerC, icon: '\u2234', Component: ObserverLab,
  },
];
