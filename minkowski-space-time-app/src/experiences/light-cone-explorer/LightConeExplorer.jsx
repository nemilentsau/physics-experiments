import { useState, useCallback, useRef } from 'react';
import { useCanvas } from '../../hooks/useCanvas.js';
import { causalRelation, intervalSquared } from '../../physics/lorentz.js';
import { isInCausalFuture, isInCausalPast } from '../../physics/spacetime.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import { Panel } from '../../components/ui/Panel.jsx';

const RANGE_X = 8;
const RANGE_T = 10;
const HIT_RADIUS = 0.3; // spacetime units

const RELATION_COLORS = {
  timelike: colors.timelike,
  spacelike: colors.spacelike,
  lightlike: colors.lightCone,
};

export default function LightConeExplorer() {
  const [events, setEvents] = useState([
    { id: 1, x: 0, t: 3, label: 'A' },
    { id: 2, x: 2, t: 7, label: 'B' },
    { id: 3, x: -3, t: 5, label: 'C' },
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showAllCones, setShowAllCones] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [nextLabel, setNextLabel] = useState('D');
  const dragRef = useRef(null);
  const canvasContainerRef = useRef(null);

  const selected = events.find(e => e.id === selectedId);
  const hovered = events.find(e => e.id === hoveredId);
  const highlighted = selected || hovered;

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

  const toSpacetime = useCallback((px, py, W, H) => {
    const m = { top: 30, bottom: 40, left: 50, right: 30 };
    const pW = W - m.left - m.right;
    const pH = H - m.top - m.bottom;
    return {
      x: ((px - m.left) / pW) * 2 * RANGE_X - RANGE_X,
      t: ((H - m.bottom - py) / pH) * RANGE_T,
    };
  }, []);

  // Find event near a spacetime point
  const findHit = useCallback((x, t) => {
    let closest = -1;
    let minDist = HIT_RADIUS;
    events.forEach((e, i) => {
      const d = Math.sqrt((e.x - x) ** 2 + (e.t - t) ** 2);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return closest;
  }, [events]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const coords = toSpacetime(px, py, W, H);

    const hitIdx = findHit(coords.x, coords.t);
    if (hitIdx >= 0) {
      dragRef.current = events[hitIdx].id;
      setSelectedId(events[hitIdx].id);
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
        setNextLabel(prev => String.fromCharCode(prev.charCodeAt(0) + 1));
      }
    }
  }, [events, findHit, toSpacetime, nextLabel]);

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const coords = toSpacetime(px, py, W, H);

    if (dragRef.current !== null) {
      setEvents(prev => prev.map(ev =>
        ev.id === dragRef.current
          ? { ...ev, x: Math.max(-RANGE_X, Math.min(RANGE_X, coords.x)), t: Math.max(0, Math.min(RANGE_T, coords.t)) }
          : ev
      ));
    } else {
      const hitIdx = findHit(coords.x, coords.t);
      setHoveredId(hitIdx >= 0 ? events[hitIdx].id : null);
      canvas.style.cursor = hitIdx >= 0 ? 'grab' : 'crosshair';
    }
  }, [events, findHit, toSpacetime]);

  const handleCanvasMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

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
      const pW = W - m.left - m.right;
      const pH = H - m.top - m.bottom;

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
    },
    [events, selectedId, hoveredId, highlighted, showAllCones, showConnections, pairs]
  );

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          Light Cone Explorer
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Causality · Spacetime Intervals · Causal Structure
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap' }}>
        {/* Left panel */}
        <div style={{ flex: '0 0 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title="Controls">
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
          <Panel title="Event Pairs">
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
          <Panel title="Causal Relations">
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
        <div style={{ flex: 1, minWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.015)', border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 8,
          }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 560, display: 'block' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Insight */}
          <div style={{
            background: colors.panelBg, border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 14, fontSize: 10.5, lineHeight: 1.7, color: colors.textDim,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>What to explore:</span>{' '}
            Drag an event across another's light cone boundary. Watch the pair label flip from "timelike" to "spacelike."
            Timelike-separated events <em>can</em> be causally connected — a signal can travel between them.
            Spacelike-separated events <em>cannot</em> influence each other — no signal, not even light, can bridge the gap.
            The light cone (s²=0) is the boundary of causality itself.
          </div>
        </div>

        {/* Right: selected event info */}
        <div style={{ flex: '0 0 200px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title={selected ? `Event ${selected.label}` : 'Selected Event'}>
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
                    setEvents(prev => prev.filter(e => e.id !== selectedId));
                    setSelectedId(null);
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

          <Panel title="The Interval">
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
