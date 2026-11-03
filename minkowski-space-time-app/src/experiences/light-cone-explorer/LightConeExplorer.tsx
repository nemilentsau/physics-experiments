import { useState, useCallback, useRef, useEffect } from 'react';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useViewport } from '../../hooks/useViewport.js';
import { causalRelation, intervalSquared } from '../../physics/lorentz.js';
import { isInCausalFuture, isInCausalPast } from '../../physics/spacetime.js';
import { getLightConeMissionStatus } from '../../logic/missions.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import {
  DEFAULT_LIGHT_CONE_SCENE,
  decodeLightConeScene,
  encodeLightConeScene,
  getNextLightConeLabel,
} from '../../state/shareableState.js';
import { Panel } from '../../components/ui/Panel.jsx';
import { StoryCallout } from '../../components/ui/StoryCallout.jsx';
import { GuidedMissionPanel } from '../../components/ui/GuidedMissionPanel.jsx';
import { CanvasAnnotation } from '../../components/ui/CanvasAnnotation.jsx';

const RANGE_X = 8;
const RANGE_T = 10;
const HIT_RADIUS = 0.3; // spacetime units

const RELATION_COLORS = {
  timelike: colors.timelike,
  spacelike: colors.spacelike,
  lightlike: colors.lightCone,
};

export default function LightConeExplorer({ journeyState, onJourneyChange }) {
  const initialEvents = decodeLightConeScene(journeyState?.lightConeScene ?? DEFAULT_LIGHT_CONE_SCENE);
  const initialSelected = initialEvents.find((event) => event.label === journeyState?.lightConeSelectedLabel) ?? null;
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState(initialSelected?.id ?? null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showAllCones, setShowAllCones] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [nextLabel, setNextLabel] = useState(getNextLightConeLabel(initialEvents));
  const [activeMission, setActiveMission] = useState(journeyState?.lightConeMission ?? 'boundary');
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const { isMobile, isTablet } = useViewport();
  const selected = events.find(e => e.id === selectedId);
  const hovered = events.find(e => e.id === hoveredId);
  const highlighted = selected || hovered;
  const focusRelations = highlighted
    ? events.filter(e => e.id !== highlighted.id).map(other => {
      const dt = other.t - highlighted.t;
      const dx = other.x - highlighted.x;
      const relation = causalRelation(dt, dx);
      return {
        relation,
        isFuture: isInCausalFuture(highlighted, other),
        isPast: isInCausalPast(highlighted, other),
      };
    })
    : [];
  const relationCounts = focusRelations.reduce((acc, rel) => {
    if (rel.relation === 'lightlike') acc.lightlike += 1;
    else if (rel.relation === 'spacelike') acc.spacelike += 1;
    else if (rel.isFuture) acc.future += 1;
    else if (rel.isPast) acc.past += 1;
    else acc.timelike += 1;
    return acc;
  }, { future: 0, past: 0, spacelike: 0, lightlike: 0, timelike: 0 });

  let storyBeat = {
    accent: colors.lightCone,
    badge: `${events.length} event${events.length === 1 ? '' : 's'}`,
    title: 'Hover an event to turn the diagram into a causal map',
    body: 'Each event is just a point until you choose a reference event. Hover or select one, then use its light cone to classify which other events are reachable, unreachable, or exactly on the boundary.',
    question: 'What changes when an event crosses the cone boundary?',
    answer: 'The interval changes sign. Timelike separation becomes spacelike or vice versa, which flips whether a causal signal is possible.',
  };

  if (events.length < 2) {
    storyBeat = {
      accent: colors.lightCone,
      badge: 'Need 2 events',
      title: 'One event by itself has no interval story yet',
      body: 'Place at least one more event on the diagram. Intervals, causal relations, and cone boundaries only become meaningful when you compare events.',
      question: 'Why is one point not enough?',
      answer: 'Because relativity asks about separations between events. The sign of s² belongs to a pair, not to a single isolated point.',
    };
  } else if (highlighted && relationCounts.lightlike > 0) {
    storyBeat = {
      accent: colors.lightCone,
      badge: `Event ${highlighted.label}`,
      title: 'You have an event sitting right on the causal frontier',
      body: `From ${highlighted.label}, ${relationCounts.lightlike} event${relationCounts.lightlike === 1 ? '' : 's'} lie exactly on the cone. Those are the events light can reach but anything slower cannot overtake.`,
      question: 'What is special about a lightlike separation?',
      answer: 'It is the exact boundary between causal access and causal exclusion. Light can connect the two events, but no slower signal can beat the cone.',
    };
  } else if (highlighted && relationCounts.spacelike === focusRelations.length) {
    storyBeat = {
      accent: colors.spacelike,
      badge: `Event ${highlighted.label}`,
      title: 'Everything else is outside this event’s cone',
      body: `Right now every other event is spacelike separated from ${highlighted.label}. No influence can travel between them without exceeding the speed of light.`,
      question: 'Can frame changes rescue a spacelike pair?',
      answer: 'No. Different frames may reorder spacelike events in time, but none can make a causal signal possible between them.',
    };
  } else if (highlighted && relationCounts.future + relationCounts.past > 0 && relationCounts.spacelike > 0) {
    storyBeat = {
      accent: colors.timelike,
      badge: `Event ${highlighted.label}`,
      title: 'The cone is splitting reachable events from unreachable ones',
      body: `${highlighted.label} has ${relationCounts.future} event${relationCounts.future === 1 ? '' : 's'} in its causal future, ${relationCounts.past} in its causal past, and ${relationCounts.spacelike} outside the cone. One anchor event is enough to partition spacetime.`,
      question: 'What does the cone really do?',
      answer: 'It divides spacetime into can affect, can be affected by, and cannot be connected regions. That partition is invariant across frames.',
    };
  } else if (highlighted) {
    storyBeat = {
      accent: colors.timelike,
      badge: `Event ${highlighted.label}`,
      title: 'This event is causally tied to everything you are comparing',
      body: `Every currently highlighted relation for ${highlighted.label} is timelike. That means all compared events lie inside the future or past cone, where a slower-than-light signal could in principle connect them.`,
      question: 'Does timelike separation guarantee influence happened?',
      answer: 'No. It only means influence is possible without breaking relativity. Whether a signal was actually sent is a separate physical story.',
    };
  }
  const labShellStyle = {
    position: 'relative',
    maxWidth: 1320,
    margin: '0 auto',
    padding: '20px 18px 18px',
    borderRadius: 26,
    overflow: 'hidden',
    border: '1px solid rgba(255,200,50,0.16)',
    background: `
      radial-gradient(circle at 10% 12%, rgba(255,200,50,0.16), transparent 22%),
      radial-gradient(circle at 92% 16%, rgba(255,107,74,0.10), transparent 22%),
      linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))
    `,
  };
  const labPanelStyle = {
    background: 'linear-gradient(180deg, rgba(255,200,50,0.08), rgba(255,255,255,0.014))',
    border: '1px solid rgba(255,200,50,0.14)',
    borderRadius: 18,
    boxShadow: '0 16px 32px rgba(0,0,0,0.18)',
  };
  const labPanelAltStyle = {
    ...labPanelStyle,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,107,74,0.04))',
    border: '1px solid rgba(255,255,255,0.08)',
  };
  const labCanvasStyle = {
    background: `
      radial-gradient(circle at top right, rgba(255,200,50,0.12), transparent 26%),
      linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))
    `,
    border: '1px solid rgba(255,200,50,0.18)',
    borderRadius: 24,
    padding: 10,
    boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
  };
  const labTitleStyle = {
    color: 'rgba(255,255,255,0.34)',
    letterSpacing: '0.18em',
  };
  const labCanvasHeight = isMobile ? 360 : isTablet ? 460 : 560;
  const loadMissionScene = (sceneEvents, anchorId) => {
    setEvents(sceneEvents);
    setSelectedId(anchorId);
    setHoveredId(null);
    setNextLabel(getNextLightConeLabel(sceneEvents));
  };
  const {
    eventB,
    eventC,
    boundaryComplete,
    acausalRelation,
    pastFutureComplete,
    status: labMissionStatus,
  } = getLightConeMissionStatus(events, activeMission);
  const labMissions = [
    {
      id: 'boundary',
      title: 'Boundary',
      summary: 'Turn A and B into a lightlike pair.',
      objective: 'Load the preset, select A, then drag B until the A↔B interval reaches s² ≈ 0.',
      successText: 'Lightlike pairs sit exactly on the cone: reachable by light, unreachable by anything slower.',
      action: () => loadMissionScene([
        { id: 'mission-a', x: 0, t: 2, label: 'A' },
        { id: 'mission-b', x: 2.5, t: 5, label: 'B' },
        { id: 'mission-c', x: -2, t: 7, label: 'C' },
      ], 'mission-a'),
    },
    {
      id: 'acausal',
      title: 'Acausal',
      summary: 'Kick one event cleanly outside A’s cone.',
      objective: 'Load the preset and drag C until the A↔C relation becomes spacelike.',
      successText: 'Spacelike separation is the hard no of relativity: frames can reorder the events, but none can create a signal path.',
      action: () => loadMissionScene([
        { id: 'mission-a', x: 0, t: 3, label: 'A' },
        { id: 'mission-b', x: 0.8, t: 6, label: 'B' },
        { id: 'mission-c', x: 1.2, t: 4.2, label: 'C' },
      ], 'mission-a'),
    },
    {
      id: 'past-future',
      title: 'Split Cone',
      summary: 'Make A own both a causal future and a causal past.',
      objective: 'Load the preset and drag C into A’s past cone while keeping B in A’s future cone.',
      successText: 'One anchor event partitions spacetime into past, future, and elsewhere all at once.',
      action: () => loadMissionScene([
        { id: 'mission-a', x: 0, t: 5, label: 'A' },
        { id: 'mission-b', x: 0.8, t: 6.4, label: 'B' },
        { id: 'mission-c', x: -2.2, t: 4.6, label: 'C' },
      ], 'mission-a'),
    },
  ];
  const clampPercent = (value) => Math.max(8, Math.min(92, value));

  // Coordinate transforms
  const toPixel = useCallback((x, t, W, H) => {
    const m = { top: 30, bottom: 40, left: 50, right: 30 };
    const pW = W - m.left - m.right;
    const pH = H - m.top - m.bottom;
    return {
      px: m.left + ((x + RANGE_X) / (2 * RANGE_X)) * pW,
      py: H - m.bottom - (t / RANGE_T) * pH,
    };
  }, []);
  const toCanvasPercent = (x, t) => ({
    left: clampPercent(((x + RANGE_X) / (2 * RANGE_X)) * 100),
    top: clampPercent(100 - (t / RANGE_T) * 100),
  });

  const toSpacetime = useCallback((px, py, W, H) => {
    const m = { top: 30, bottom: 40, left: 50, right: 30 };
    const pW = W - m.left - m.right;
    const pH = H - m.top - m.bottom;
    return {
      x: ((px - m.left) / pW) * 2 * RANGE_X - RANGE_X,
      t: ((H - m.bottom - py) / pH) * RANGE_T,
    };
  }, []);
  const hitRadius = isMobile ? 0.55 : isTablet ? 0.42 : HIT_RADIUS;

  // Find event near a spacetime point
  const findHit = useCallback((x, t) => {
    let closest = -1;
    let minDist = hitRadius;
    events.forEach((e, i) => {
      const d = Math.sqrt((e.x - x) ** 2 + (e.t - t) ** 2);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return closest;
  }, [events, hitRadius]);

  // Canvas pointer handlers
  const handleCanvasPointerDown = useCallback((e) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const coords = toSpacetime(px, py, W, H);

    const hitIdx = findHit(coords.x, coords.t);
    if (hitIdx >= 0) {
      e.preventDefault();
      dragRef.current = events[hitIdx].id;
      setIsDragging(true);
      setSelectedId(events[hitIdx].id);
      canvas.setPointerCapture?.(e.pointerId);
    } else {
      // Place new event
      if (coords.t >= 0 && coords.t <= RANGE_T && coords.x >= -RANGE_X && coords.x <= RANGE_X) {
        const newEvent = {
          id: Date.now(),
          x: Math.round(coords.x * 4) / 4,
          t: Math.round(coords.t * 4) / 4,
          label: nextLabel,
        };
        setEvents(prev => [...prev, newEvent]);
        setSelectedId(newEvent.id);
        setNextLabel(getNextLightConeLabel([...events, newEvent]));
      }
    }
  }, [events, findHit, toSpacetime, nextLabel]);

  const handleCanvasPointerMove = useCallback((e) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const coords = toSpacetime(px, py, W, H);

    if (dragRef.current !== null) {
      e.preventDefault();
      setEvents(prev => prev.map(ev =>
        ev.id === dragRef.current
          ? { ...ev, x: Math.max(-RANGE_X, Math.min(RANGE_X, coords.x)), t: Math.max(0, Math.min(RANGE_T, coords.t)) }
          : ev
      ));
    } else {
      const hitIdx = findHit(coords.x, coords.t);
      setHoveredId(hitIdx >= 0 ? events[hitIdx].id : null);
      if (!isMobile) {
        canvas.style.cursor = hitIdx >= 0 ? 'grab' : 'crosshair';
      }
    }
  }, [events, findHit, isMobile, toSpacetime]);

  const handleCanvasPointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
    setIsDragging(false);
    if (!isMobile) {
      e.currentTarget.style.cursor = 'crosshair';
    }
  }, [isMobile]);

  const handleCanvasPointerLeave = useCallback((e) => {
    if (dragRef.current === null) {
      setHoveredId(null);
      if (!isMobile) {
        e.currentTarget.style.cursor = 'crosshair';
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (isDragging) return;

    onJourneyChange?.({
      lightConeMission: activeMission,
      lightConeScene: encodeLightConeScene(events),
      lightConeSelectedLabel: selected?.label ?? null,
    });
  }, [activeMission, events, isDragging, onJourneyChange, selected]);

  const highlightedAnnotation = highlighted
    ? {
      ...toCanvasPercent(highlighted.x, highlighted.t),
      title: selected?.id === highlighted.id ? `Anchor ${highlighted.label}` : `Inspect ${highlighted.label}`,
      body: isMobile
        ? 'Tap and drag this event. Its cone classifies the rest of the diagram.'
        : 'Drag this event to watch the cone boundary and interval classes update live.',
    }
    : null;
  const missionFocusEvent = activeMission === 'boundary'
    ? eventB
    : activeMission === 'acausal'
      ? eventC
      : eventC ?? eventB;
  const missionAnnotation = missionFocusEvent
    ? {
      ...toCanvasPercent(missionFocusEvent.x, missionFocusEvent.t),
      title: activeMission === 'boundary'
        ? (boundaryComplete ? 'Boundary reached' : 'Aim for cone edge')
        : activeMission === 'acausal'
          ? (acausalRelation === 'spacelike' ? 'Outside the cone' : 'Push C outward')
          : (pastFutureComplete ? 'Past and future built' : 'Split the cone'),
      body: activeMission === 'boundary'
        ? (boundaryComplete
          ? 'A and B now sit on the lightlike boundary with s² close to zero.'
          : 'Drag B until the A↔B separation lands exactly on the cone.')
        : activeMission === 'acausal'
          ? (acausalRelation === 'spacelike'
            ? 'C is now causally unreachable from A in every inertial frame.'
            : 'Move C far enough from A that the interval turns spacelike.')
          : (pastFutureComplete
            ? 'A now anchors both a causal future and a causal past.'
            : 'Keep B in A’s future cone while dragging C into A’s past cone.'),
    }
    : null;

  // Compute all pairs
  const pairs = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const dt = events[j].t - events[i].t;
      const dx = events[j].x - events[i].x;
      const relation = causalRelation(dt, dx);
      const s2 = intervalSquared(dt, dx);
      pairs.push({ i, j, a: events[i], b: events[j], relation, s2 });
    }
  }

  // Canvas drawing
  const canvasRef = useCanvas(
    (ctx, W, H) => {
      const m = { top: 30, bottom: 40, left: 50, right: 30 };

      const toP = (x, t) => toPixel(x, t, W, H);

      // Background
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      for (let t = 0; t <= RANGE_T; t++) {
        const { py } = toP(0, t);
        ctx.beginPath(); ctx.moveTo(m.left, py); ctx.lineTo(W - m.right, py); ctx.stroke();
      }
      for (let x = -RANGE_X; x <= RANGE_X; x++) {
        const { px } = toP(x, 0);
        ctx.beginPath(); ctx.moveTo(px, m.top); ctx.lineTo(px, H - m.bottom); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = colors.axis;
      ctx.lineWidth = 1;
      const o = toP(0, 0);
      ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(toP(0, RANGE_T).px, toP(0, RANGE_T).py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toP(-RANGE_X, 0).px, o.py); ctx.lineTo(toP(RANGE_X, 0).px, o.py); ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'center';
      for (let t = 1; t <= RANGE_T; t++) {
        const p = toP(0, t);
        ctx.fillText(t, p.px - 20, p.py + 3);
      }
      for (let x = -RANGE_X; x <= RANGE_X; x += 2) {
        if (x === 0) continue;
        const p = toP(x, 0);
        ctx.fillText(x, p.px, p.py + 14);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('x (ly)', W / 2, H - 4);
      ctx.save();
      ctx.translate(10, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('t (yr)', 0, 0);
      ctx.restore();

      // Draw light cones for highlighted or all events
      const conesToDraw = showAllCones ? events : (highlighted ? [highlighted] : []);
      conesToDraw.forEach(ev => {
        const isHighlighted = highlighted && ev.id === highlighted.id;
        const alpha = isHighlighted ? 0.15 : 0.05;
        const lineAlpha = isHighlighted ? 0.4 : 0.12;

        // Future light cone (shaded region)
        const ep = toP(ev.x, ev.t);
        const futureLeft = toP(ev.x - (RANGE_T - ev.t), RANGE_T);
        const futureRight = toP(ev.x + (RANGE_T - ev.t), RANGE_T);

        ctx.fillStyle = `rgba(255,200,50,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(ep.px, ep.py);
        ctx.lineTo(futureLeft.px, futureLeft.py);
        ctx.lineTo(futureRight.px, futureRight.py);
        ctx.closePath();
        ctx.fill();

        // Past light cone
        const pastLeft = toP(ev.x - ev.t, 0);
        const pastRight = toP(ev.x + ev.t, 0);
        ctx.fillStyle = `rgba(255,200,50,${alpha * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(ep.px, ep.py);
        ctx.lineTo(pastLeft.px, pastLeft.py);
        ctx.lineTo(pastRight.px, pastRight.py);
        ctx.closePath();
        ctx.fill();

        // Light cone edges
        ctx.strokeStyle = `rgba(255,200,50,${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        // Future
        ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(futureLeft.px, futureLeft.py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(futureRight.px, futureRight.py); ctx.stroke();
        // Past
        ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(pastLeft.px, pastLeft.py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(pastRight.px, pastRight.py); ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw connections between pairs
      if (showConnections) {
        pairs.forEach(({ a, b, relation }) => {
          const pa = toP(a.x, a.t);
          const pb = toP(b.x, b.t);
          const col = RELATION_COLORS[relation];
          ctx.strokeStyle = col + '40';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(pa.px, pa.py);
          ctx.lineTo(pb.px, pb.py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Midpoint label
          const mx = (pa.px + pb.px) / 2;
          const my = (pa.py + pb.py) / 2;
          ctx.fillStyle = col + '88';
          ctx.font = `8px ${MONO}`;
          ctx.textAlign = 'center';
          ctx.fillText(relation.charAt(0).toUpperCase(), mx, my - 4);
        });
      }

      // Draw events
      events.forEach(ev => {
        const p = toP(ev.x, ev.t);
        const isSelected = selectedId === ev.id;
        const isHovered = hoveredId === ev.id;
        const size = isSelected ? 7 : isHovered ? 6 : 5;

        // Determine color based on relation to highlighted event
        let evColor = '#fff';
        if (highlighted && ev.id !== highlighted.id) {
          const dt = ev.t - highlighted.t;
          const dx = ev.x - highlighted.x;
          const rel = causalRelation(dt, dx);
          evColor = RELATION_COLORS[rel];
        } else if (ev.id === highlighted?.id) {
          evColor = colors.lightCone;
        }

        // Glow
        if (isSelected || isHovered) {
          ctx.shadowColor = evColor;
          ctx.shadowBlur = 12;
        }

        ctx.fillStyle = evColor;
        ctx.beginPath();
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ring for selected
        if (isSelected) {
          ctx.strokeStyle = evColor + '66';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.px, p.py, size + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `bold 11px ${MONO}`;
        ctx.textAlign = 'left';
        ctx.fillText(ev.label, p.px + size + 5, p.py + 4);
      });

      // Instructions
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('Click to place events · Drag to move · Hover to highlight causal structure', W / 2, H - m.bottom + 28);
    }
  );

  return (
    <div style={labShellStyle}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        maskImage: 'radial-gradient(circle at center, black, transparent 88%)',
        pointerEvents: 'none',
      }}
      />
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 14 : 18, position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          Light Cone Explorer
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Causality · Spacetime Intervals · Causal Structure
        </p>
      </div>

      <div style={{ display: 'flex', gap: isMobile ? 12 : 16, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {/* Left panel */}
        <div style={{ flex: isMobile ? '1 1 100%' : '0 0 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, order: isMobile ? 2 : 0 }}>
          <GuidedMissionPanel
            title="Guided Experiments"
            accent={colors.lightCone}
            missions={labMissions}
            activeId={activeMission}
            onSelect={setActiveMission}
            status={labMissionStatus}
          />

          <Panel title="Controls" style={labPanelStyle} titleStyle={labTitleStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: colors.textDim, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showAllCones} onChange={() => setShowAllCones(!showAllCones)} style={{ accentColor: colors.lightCone }} />
              Show all light cones
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: colors.textDim, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showConnections} onChange={() => setShowConnections(!showConnections)} style={{ accentColor: colors.lightCone }} />
              Show pair connections
            </label>
            <button
              onClick={() => { setEvents([]); setSelectedId(null); setNextLabel('A'); }}
              style={{
                width: '100%', padding: '8px 0', marginTop: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, color: colors.textDim, fontFamily: MONO, fontSize: 10, cursor: 'pointer',
              }}>
              Clear All Events
            </button>
          </Panel>

          {/* Event pairs table */}
          <Panel title="Event Pairs" style={labPanelAltStyle} titleStyle={labTitleStyle}>
            {pairs.length === 0 ? (
              <div style={{ fontSize: 10, color: colors.textGhost, fontStyle: 'italic' }}>
                Place 2+ events to see relationships
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {pairs.map(({ a, b, relation, s2 }, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: 10,
                  }}>
                    <span style={{ color: colors.textDim }}>{a.label}↔{b.label}</span>
                    <span style={{
                      color: RELATION_COLORS[relation],
                      fontSize: 9,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: RELATION_COLORS[relation] + '15',
                    }}>
                      {relation}
                    </span>
                    <span style={{ color: colors.textGhost, fontSize: 9, fontFamily: MONO }}>
                      s²={s2.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Legend */}
          <Panel title="Causal Relations" style={labPanelStyle} titleStyle={labTitleStyle}>
            <div style={{ fontSize: 10, lineHeight: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.timelike }} />
                <span style={{ color: colors.textDim }}>Timelike (s² &lt; 0) — causal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.spacelike }} />
                <span style={{ color: colors.textDim }}>Spacelike (s² &gt; 0) — no signal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.lightlike }} />
                <span style={{ color: colors.textDim }}>Lightlike (s² = 0) — on the cone</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Center: main diagram */}
        <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, order: 1 }}>
          <div style={labCanvasStyle}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: labCanvasHeight, display: 'block', touchAction: 'none' }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerLeave}
            />
            {highlightedAnnotation && (
              <CanvasAnnotation
                left={highlightedAnnotation.left}
                top={highlightedAnnotation.top}
                accent={colors.lightCone}
                title={highlightedAnnotation.title}
                body={highlightedAnnotation.body}
                align={highlightedAnnotation.left > 60 ? 'right' : 'left'}
                compact={isMobile}
              />
            )}
            {missionAnnotation && missionFocusEvent?.id !== highlighted?.id && (
              <CanvasAnnotation
                left={missionAnnotation.left}
                top={missionAnnotation.top}
                accent={activeMission === 'acausal' ? colors.spacelike : colors.lightCone}
                title={missionAnnotation.title}
                body={missionAnnotation.body}
                align={missionAnnotation.left > 60 ? 'right' : 'left'}
                compact={isMobile}
              />
            )}
            {isMobile && !highlighted && (
              <CanvasAnnotation
                left={16}
                top={88}
                accent={colors.lightCone}
                title="Touch mode"
                body="Tap a point to select it, drag to move it, or tap empty space to place a new event."
                align="left"
                compact
              />
            )}
          </div>

          <StoryCallout
            label="Live read"
            accent={storyBeat.accent}
            badge={storyBeat.badge}
            title={storyBeat.title}
            body={storyBeat.body}
            question={storyBeat.question}
            answer={storyBeat.answer}
          />
        </div>

        {/* Right: selected event info */}
        <div style={{ flex: isMobile ? '1 1 100%' : '0 0 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, order: isMobile ? 3 : 0 }}>
          <Panel title={selected ? `Event ${selected.label}` : 'Selected Event'} style={labPanelAltStyle} titleStyle={labTitleStyle}>
            {selected ? (
              <div>
                <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 8, lineHeight: 1.8 }}>
                  <div>x = <span style={{ color: '#fff', fontFamily: MONO }}>{selected.x.toFixed(2)}</span> ly</div>
                  <div>t = <span style={{ color: '#fff', fontFamily: MONO }}>{selected.t.toFixed(2)}</span> yr</div>
                </div>
                <div style={{ fontSize: 9, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 12, marginBottom: 6 }}>
                  Relations from {selected.label}
                </div>
                {events.filter(e => e.id !== selected.id).map(other => {
                  const dt = other.t - selected.t;
                  const dx = other.x - selected.x;
                  const rel = causalRelation(dt, dx);
                  const isFuture = isInCausalFuture(selected, other);
                  const isPast = isInCausalPast(selected, other);
                  const direction = isFuture ? '→ future' : isPast ? '→ past' : '× elsewhere';
                  return (
                    <div key={other.id} style={{
                      padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontSize: 10,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.textDim }}>{selected.label} → {other.label}</span>
                        <span style={{ color: RELATION_COLORS[rel], fontSize: 9 }}>{rel}</span>
                      </div>
                      <div style={{ color: colors.textGhost, fontSize: 9, marginTop: 2 }}>{direction}</div>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    const nextEvents = events.filter((event) => event.id !== selectedId);
                    setEvents(nextEvents);
                    setSelectedId(null);
                    setNextLabel(getNextLightConeLabel(nextEvents));
                  }}
                  style={{
                    width: '100%', padding: '6px 0', marginTop: 10,
                    background: 'rgba(255,70,74,0.08)', border: '1px solid rgba(255,70,74,0.2)',
                    borderRadius: 5, color: colors.traveler, fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                  }}>
                  Remove Event
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 10, color: colors.textGhost, fontStyle: 'italic' }}>
                Click an event to select it, or click empty space to place a new one.
              </div>
            )}
          </Panel>

          <Panel title="The Interval" style={labPanelStyle} titleStyle={labTitleStyle}>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.6 }}>
              s² = −Δt² + Δx²
            </div>
            <div style={{ fontSize: 9.5, color: colors.textDim, marginTop: 8, lineHeight: 1.6 }}>
              s² &lt; 0 → timelike (causal)
              <br />
              s² = 0 → lightlike (on the cone)
              <br />
              s² &gt; 0 → spacelike (acausal)
              <br />
              <span style={{ fontStyle: 'italic', color: colors.textGhost }}>
                The interval is invariant under Lorentz boosts.
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
