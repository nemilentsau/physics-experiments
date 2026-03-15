import { useState } from 'react';
import { gamma, boostEvent } from '../../physics/lorentz.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import { Panel } from '../../components/ui/Panel.jsx';
import { Slider } from '../../components/ui/Slider.jsx';

const RANGE = 6;

export default function LorentzBoost() {
  const [boostV, setBoostV] = useState(0);
  const [showOriginalGrid, setShowOriginalGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showSimultaneity, setShowSimultaneity] = useState(true);

  const g = boostV !== 0 ? gamma(boostV) : 1;

  const canvasRef = useCanvas(
    (ctx, W, H) => {
      const m = { top: 30, bottom: 40, left: 50, right: 50 };
      const pW = W - m.left - m.right;
      const pH = H - m.top - m.bottom;
      const cx = m.left + pW / 2;
      const cy = m.top + pH / 2;

      const scale = Math.min(pW, pH) / (2 * RANGE);

      const toP = (x, t) => ({
        px: cx + x * scale,
        py: cy - t * scale,
      });

      // Background
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // Light cone (always at 45 degrees - THE invariant)
      ctx.strokeStyle = colors.lightCone + '55';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      const lcRange = RANGE;
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, st]) => {
        const p1 = toP(0, 0);
        const p2 = toP(sx * lcRange, st * lcRange);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Light cone fill
      ctx.fillStyle = `rgba(255,200,50,0.03)`;
      const origin = toP(0, 0);
      // Future
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(toP(-lcRange, lcRange).px, toP(-lcRange, lcRange).py);
      ctx.lineTo(toP(lcRange, lcRange).px, toP(lcRange, lcRange).py);
      ctx.closePath();
      ctx.fill();
      // Past
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(toP(-lcRange, -lcRange).px, toP(-lcRange, -lcRange).py);
      ctx.lineTo(toP(lcRange, -lcRange).px, toP(lcRange, -lcRange).py);
      ctx.closePath();
      ctx.fill();

      // Original grid (faded)
      if (showOriginalGrid) {
        ctx.strokeStyle = colors.gridOriginal;
        ctx.lineWidth = 0.5;
        for (let i = -RANGE; i <= RANGE; i++) {
          // Vertical (constant x)
          const p1 = toP(i, -RANGE);
          const p2 = toP(i, RANGE);
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
          // Horizontal (constant t)
          const p3 = toP(-RANGE, i);
          const p4 = toP(RANGE, i);
          ctx.beginPath(); ctx.moveTo(p3.px, p3.py); ctx.lineTo(p4.px, p4.py); ctx.stroke();
        }
      }

      // Boosted grid
      // In the boosted frame, lines of constant x' and constant t' map back to:
      // constant x': x = x'/γ + v*t (line with slope 1/v in x-t plane, passing through x'/γ at t=0... actually need inverse boost)
      // We draw the boosted coordinate axes and grid by transforming grid points

      if (boostV !== 0) {
        // Boosted t' axis (x' = 0): in lab frame, this is the worldline x = v*t
        ctx.strokeStyle = colors.gridBoosted;
        ctx.lineWidth = 2;
        const tAxisP1 = toP(-boostV * RANGE, -RANGE);
        const tAxisP2 = toP(boostV * RANGE, RANGE);
        ctx.beginPath(); ctx.moveTo(tAxisP1.px, tAxisP1.py); ctx.lineTo(tAxisP2.px, tAxisP2.py); ctx.stroke();

        // Boosted x' axis (t' = 0): in lab frame, this is t = v*x
        ctx.strokeStyle = colors.gridBoosted + 'cc';
        const xAxisP1 = toP(-RANGE, -boostV * RANGE);
        const xAxisP2 = toP(RANGE, boostV * RANGE);
        ctx.beginPath(); ctx.moveTo(xAxisP1.px, xAxisP1.py); ctx.lineTo(xAxisP2.px, xAxisP2.py); ctx.stroke();

        // Boosted grid lines
        ctx.lineWidth = 0.7;
        for (let i = -RANGE; i <= RANGE; i++) {
          if (i === 0) continue;

          // Lines of constant t' = i: in lab frame, parametrize by x' and inverse-boost
          ctx.strokeStyle = colors.gridBoosted + '30';
          const end1 = boostEvent(i, -RANGE * 1.5, -boostV);
          const end2 = boostEvent(i, RANGE * 1.5, -boostV);
          const pe1 = toP(end1.x, end1.t);
          const pe2 = toP(end2.x, end2.t);
          ctx.beginPath(); ctx.moveTo(pe1.px, pe1.py); ctx.lineTo(pe2.px, pe2.py); ctx.stroke();

          // Lines of constant x' = i: in lab frame, parametrize by t' and inverse-boost
          ctx.strokeStyle = colors.gridBoosted + '30';
          const end3 = boostEvent(-RANGE * 1.5, i, -boostV);
          const end4 = boostEvent(RANGE * 1.5, i, -boostV);
          const pe3 = toP(end3.x, end3.t);
          const pe4 = toP(end4.x, end4.t);
          ctx.beginPath(); ctx.moveTo(pe3.px, pe3.py); ctx.lineTo(pe4.px, pe4.py); ctx.stroke();
        }

        // Simultaneity line highlight (t' = 0 in boosted frame)
        if (showSimultaneity) {
          ctx.strokeStyle = colors.travelerAlt + '80';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 3]);
          ctx.beginPath(); ctx.moveTo(xAxisP1.px, xAxisP1.py); ctx.lineTo(xAxisP2.px, xAxisP2.py); ctx.stroke();
          ctx.setLineDash([]);

          // Label
          ctx.fillStyle = colors.travelerAlt + 'aa';
          ctx.font = `9px ${MONO}`;
          ctx.textAlign = 'left';
          const labelP = toP(RANGE * 0.7, boostV * RANGE * 0.7);
          ctx.fillText("t' = 0 (simultaneous in S')", labelP.px + 5, labelP.py - 5);
        }

        // Tick marks on boosted axes showing length contraction / time dilation
        if (showRulers) {
          for (let i = -RANGE + 1; i < RANGE; i++) {
            if (i === 0) continue;

            // Ticks on t' axis: events at (t', x') = (i, 0), inverse-boosted to lab frame
            const tTick = boostEvent(i, 0, -boostV);
            const tp = toP(tTick.x, tTick.t);
            ctx.fillStyle = colors.gridBoosted + 'cc';
            ctx.beginPath(); ctx.arc(tp.px, tp.py, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = colors.gridBoosted + '88';
            ctx.font = `8px ${MONO}`;
            ctx.textAlign = 'right';
            ctx.fillText(`t'=${i}`, tp.px - 6, tp.py + 3);

            // Ticks on x' axis: events at (t', x') = (0, i), inverse-boosted
            const xTick = boostEvent(0, i, -boostV);
            const xp = toP(xTick.x, xTick.t);
            ctx.fillStyle = colors.gridBoosted + 'cc';
            ctx.beginPath(); ctx.arc(xp.px, xp.py, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = colors.gridBoosted + '88';
            ctx.textAlign = 'left';
            ctx.fillText(`x'=${i}`, xp.px + 6, xp.py + 3);
          }
        }
      }

      // Lab frame axes (on top)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      const o = toP(0, 0);
      ctx.beginPath(); ctx.moveTo(o.px, toP(0, -RANGE).py); ctx.lineTo(o.px, toP(0, RANGE).py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toP(-RANGE, 0).px, o.py); ctx.lineTo(toP(RANGE, 0).px, o.py); ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('x', toP(RANGE, 0).px + 14, o.py + 4);
      ctx.fillText('t', o.px, toP(0, RANGE).py - 10);

      if (boostV !== 0) {
        ctx.fillStyle = colors.gridBoosted + 'cc';
        const tAxisEnd = toP(boostV * RANGE, RANGE);
        ctx.fillText("t'", tAxisEnd.px + 10, tAxisEnd.py);
        const xAxisEnd = toP(RANGE, boostV * RANGE);
        ctx.fillText("x'", xAxisEnd.px + 5, xAxisEnd.py - 8);
      }

      // Origin dot
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(o.px, o.py, 4, 0, Math.PI * 2); ctx.fill();

      // Light cone label
      ctx.fillStyle = colors.lightCone + '66';
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'left';
      const lcLabel = toP(RANGE * 0.8, RANGE * 0.8);
      ctx.fillText('c', lcLabel.px + 5, lcLabel.py);

      // Instruction
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('Drag the velocity slider to boost — the light cone stays fixed', W / 2, H - 8);
    },
    [boostV, showOriginalGrid, showRulers, showSimultaneity]
  );

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          Lorentz Boost Visualizer
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Coordinate Transforms · Relativity of Simultaneity · Invariant Light Cone
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap' }}>
        {/* Left */}
        <div style={{ flex: '0 0 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title="Boost Parameters">
            <Slider
              label={`β = ${boostV.toFixed(3)}c`}
              value={boostV} min={-0.9} max={0.9} step={0.01}
              onChange={setBoostV}
              color={colors.gridBoosted}
              suffix={boostV !== 0 ? ` γ = ${g.toFixed(3)}` : ''}
            />
            <div style={{ fontSize: 9, color: colors.textGhost, marginTop: 4 }}>
              Negative = boost left, Positive = boost right
            </div>

            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
              {[0, 0.3, 0.6, 0.8, 0.9].map(preset => (
                <button key={preset} onClick={() => setBoostV(preset)}
                  style={{
                    padding: '4px 8px',
                    background: Math.abs(boostV - preset) < 0.01 ? colors.gridBoosted + '25' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${Math.abs(boostV - preset) < 0.01 ? colors.gridBoosted + '55' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 4, color: colors.textDim, fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                  }}>
                  {preset}c
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Display">
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: colors.textDim, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showOriginalGrid} onChange={() => setShowOriginalGrid(!showOriginalGrid)} style={{ accentColor: '#888' }} />
              Original grid (S frame)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: colors.textDim, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showRulers} onChange={() => setShowRulers(!showRulers)} style={{ accentColor: colors.gridBoosted }} />
              Coordinate tick marks
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: colors.textDim, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showSimultaneity} onChange={() => setShowSimultaneity(!showSimultaneity)} style={{ accentColor: colors.travelerAlt }} />
              Simultaneity line (t'=0)
            </label>
          </Panel>

          {/* Key numbers */}
          <Panel title="Boost Effects">
            <div style={{ fontSize: 10, lineHeight: 2, color: colors.textDim }}>
              <div>
                Lorentz factor: <span style={{ color: '#fff', fontFamily: MONO }}>{g.toFixed(4)}</span>
              </div>
              <div>
                Time dilation: <span style={{ color: colors.home, fontFamily: MONO }}>{g.toFixed(3)}×</span>
              </div>
              <div>
                Length contraction: <span style={{ color: colors.traveler, fontFamily: MONO }}>{(1 / g).toFixed(3)}×</span>
              </div>
              <div>
                Axis tilt: <span style={{ color: colors.lightCone, fontFamily: MONO }}>{(Math.atan(Math.abs(boostV)) * 180 / Math.PI).toFixed(1)}°</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Center */}
        <div style={{ flex: 1, minWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.015)', border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 8,
          }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 560, display: 'block' }} />
          </div>

          <div style={{
            background: colors.panelBg, border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 14, fontSize: 10.5, lineHeight: 1.7, color: colors.textDim,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>What to notice:</span>{' '}
            As you increase β, the x' and t' axes both rotate toward the light cone — but the light cone itself <em>never moves</em>.
            This is the core of special relativity: the speed of light is the same in every reference frame.
            Events that were simultaneous in S (same t) are spread out in time in S' — this is the <em>relativity of simultaneity</em>.
            Length contraction and time dilation are both visible as the spacing between tick marks changes.
          </div>
        </div>

        {/* Right */}
        <div style={{ flex: '0 0 200px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title="The Boost Matrix">
            <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 2 }}>
              <div style={{ marginBottom: 4 }}>
                t' = γ(t − βx)
              </div>
              <div>
                x' = γ(x − βt)
              </div>
            </div>
            <div style={{ fontSize: 9.5, color: colors.textDim, marginTop: 12, lineHeight: 1.6 }}>
              <span style={{ color: colors.lightCone }}>Key insight:</span>{' '}
              Length contraction and time dilation are not separate effects — they are both
              consequences of the same hyperbolic rotation in spacetime.
            </div>
          </Panel>

          <Panel title="Invariant">
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.6 }}>
              s² = −Δt² + Δx²
            </div>
            <div style={{ fontSize: 9.5, color: colors.textGhost, marginTop: 6, textAlign: 'center' }}>
              Same value in every frame
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
