import { useState } from 'react';
import { gamma, boostEvent } from '../../physics/lorentz.js';
import { getTravelerState, integrateProperTime } from '../../physics/worldline.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useAnimationLoop } from '../../hooks/useAnimationLoop.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import { Panel } from '../../components/ui/Panel.jsx';
import { Slider } from '../../components/ui/Slider.jsx';

function drawSpacetimeDiagram(ctx, W, H, params) {
  const { v, L, tOutbound, tTotal, accelDuration, currentT, boostVelocity, frameLabel } = params;
  const m = { top: 30, bottom: 30, left: 40, right: 20 };
  const pW = W - m.left - m.right;
  const pH = H - m.top - m.bottom;
  const maxT = tTotal * 1.15;
  const maxX = L * 2;

  const toP = (x, t) => ({
    px: m.left + pW / 2 + (x / maxX) * (pW / 2),
    py: H - m.bottom - (t / maxT) * pH,
  });

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 0.5;
  for (let t = 0; t <= maxT; t++) {
    const { py } = toP(0, t);
    ctx.beginPath(); ctx.moveTo(m.left, py); ctx.lineTo(W - m.right, py); ctx.stroke();
  }
  for (let x = -Math.floor(maxX); x <= Math.floor(maxX); x++) {
    const { px } = toP(x, 0);
    ctx.beginPath(); ctx.moveTo(px, m.top); ctx.lineTo(px, H - m.bottom); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1;
  const o = toP(0, 0);
  ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(toP(0, maxT).px, toP(0, maxT).py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toP(-maxX, 0).px, o.py); ctx.lineTo(toP(maxX, 0).px, o.py); ctx.stroke();

  // Frame label
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `bold 11px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText(frameLabel, m.left + 4, m.top + 14);

  // Generate worldline points in lab frame, then optionally boost
  const steps = 400;
  const homePoints = [];
  const travPoints = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tTotal;
    if (t > currentT) break;
    const st = getTravelerState(t, v, tOutbound, accelDuration, L);

    let homeX = 0, homeT = t;
    let travX = st.x, travT = t;

    if (boostVelocity !== 0) {
      // Boost both worldlines
      const bHome = boostEvent(t, 0, boostVelocity);
      homeX = bHome.x; homeT = bHome.t;
      const bTrav = boostEvent(t, st.x, boostVelocity);
      travX = bTrav.x; travT = bTrav.t;
    }

    homePoints.push({ x: homeX, t: homeT });
    travPoints.push({ x: travX, t: travT });
  }

  // Draw home worldline
  if (homePoints.length > 1) {
    ctx.strokeStyle = colors.home;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = colors.home;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(toP(homePoints[0].x, homePoints[0].t).px, toP(homePoints[0].x, homePoints[0].t).py);
    homePoints.forEach(p => {
      const pp = toP(p.x, p.t);
      ctx.lineTo(pp.px, pp.py);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw traveler worldline
  if (travPoints.length > 1) {
    ctx.strokeStyle = colors.traveler;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = colors.traveler;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(toP(travPoints[0].x, travPoints[0].t).px, toP(travPoints[0].x, travPoints[0].t).py);
    travPoints.forEach(p => {
      const pp = toP(p.x, p.t);
      ctx.lineTo(pp.px, pp.py);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Current position dots
  if (homePoints.length > 0 && currentT < tTotal) {
    const lastHome = homePoints[homePoints.length - 1];
    const hp = toP(lastHome.x, lastHome.t);
    ctx.fillStyle = colors.home;
    ctx.shadowColor = colors.home;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(hp.px, hp.py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (travPoints.length > 0 && currentT < tTotal) {
    const lastTrav = travPoints[travPoints.length - 1];
    const tp = toP(lastTrav.x, lastTrav.t);
    ctx.fillStyle = colors.traveler;
    ctx.shadowColor = colors.traveler;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(tp.px, tp.py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Event labels
  const drawEvt = (x, t, col, lbl) => {
    if (boostVelocity !== 0) {
      const b = boostEvent(t, x, boostVelocity);
      x = b.x; t = b.t;
    }
    const p = toP(x, t);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(p.px, p.py, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `8px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText(lbl, p.px + 6, p.py + 3);
  };
  drawEvt(0, 0, '#fff', 'depart');
  drawEvt(L, tOutbound, colors.traveler, 'turn');
  drawEvt(0, tTotal, '#fff', 'reunite');
}

export default function ReferenceFrames() {
  const [velocity, setVelocity] = useState(0.6);
  const [tripDistance, setTripDistance] = useState(4);
  const [accelFraction, setAccelFraction] = useState(0.08);
  const { progress: animProgress, isPlaying, play, reset, scrub } = useAnimationLoop(8000);

  const v = velocity;
  const L = tripDistance;
  const tOutbound = L / v;
  const tTotal = 2 * tOutbound;
  const accelDuration = accelFraction * tOutbound;
  const currentT = animProgress * tTotal;

  // Get traveler's current velocity for the "ride along" boost
  const travState = getTravelerState(currentT, v, tOutbound, accelDuration, L);

  // Home frame (no boost)
  const homeCanvasRef = useCanvas(
    (ctx, W, H) => {
      drawSpacetimeDiagram(ctx, W, H, {
        v, L, tOutbound, tTotal, accelDuration, currentT,
        boostVelocity: 0,
        frameLabel: "S — Home Frame",
      });
    },
    [velocity, tripDistance, accelFraction, animProgress, currentT]
  );

  // Traveler's instantaneous rest frame
  const homeCanvasRef2 = useCanvas(
    (ctx, W, H) => {
      drawSpacetimeDiagram(ctx, W, H, {
        v, L, tOutbound, tTotal, accelDuration, currentT,
        boostVelocity: travState.v,
        frameLabel: `S' — Traveler Frame (β=${travState.v.toFixed(2)}c)`,
      });
    },
    [velocity, tripDistance, accelFraction, animProgress, currentT, travState.v]
  );

  const tauTrav = integrateProperTime(currentT, v, tOutbound, accelDuration);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          Reference Frames
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Side-by-Side · Same Physics, Different Coordinates
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Controls row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
          <Panel title="Parameters" style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <Slider label={`β = ${velocity.toFixed(2)}c`} value={velocity} min={0.1} max={0.95} step={0.01} onChange={setVelocity} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <Slider label={`Distance: ${tripDistance.toFixed(1)} ly`} value={tripDistance} min={1} max={8} step={0.5} onChange={setTripDistance} />
              </div>
            </div>
          </Panel>

          <Panel title="Timeline" style={{ flex: '1 1 300px' }}>
            <input
              type="range" min={0} max={1} step={0.002}
              value={animProgress}
              onChange={(e) => scrub(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: colors.lightCone }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 9, color: colors.textGhost }}>t = {currentT.toFixed(1)} yr</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={play} disabled={isPlaying}
                  style={{
                    padding: '6px 14px',
                    background: isPlaying ? 'rgba(255,255,255,0.03)' : 'rgba(255,107,74,0.12)',
                    border: `1px solid ${isPlaying ? 'rgba(255,255,255,0.05)' : 'rgba(255,107,74,0.25)'}`,
                    borderRadius: 4, color: isPlaying ? 'rgba(255,255,255,0.2)' : colors.traveler,
                    fontFamily: MONO, fontSize: 10, cursor: isPlaying ? 'default' : 'pointer',
                  }}>
                  {isPlaying ? '…' : '▶ Play'}
                </button>
                <button onClick={reset}
                  style={{
                    padding: '6px 10px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
                    color: colors.textDim, fontFamily: MONO, fontSize: 10, cursor: 'pointer',
                  }}>
                  ↺
                </button>
              </div>
              <div style={{ fontSize: 9, color: colors.textGhost, textAlign: 'right' }}>
                <span style={{ color: colors.home }}>τ_home={currentT.toFixed(1)}</span>{' '}
                <span style={{ color: colors.traveler }}>τ_trav={tauTrav.toFixed(1)}</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Side-by-side diagrams */}
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.015)', border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 8,
          }}>
            <canvas ref={homeCanvasRef} style={{ width: '100%', height: 500, display: 'block' }} />
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.015)', border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 8,
          }}>
            <canvas ref={homeCanvasRef2} style={{ width: '100%', height: 500, display: 'block' }} />
          </div>
        </div>

        {/* Insight */}
        <div style={{
          background: colors.panelBg, border: `1px solid ${colors.border}`,
          borderRadius: 6, padding: 14, fontSize: 10.5, lineHeight: 1.7, color: colors.textDim, marginTop: 14,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>What to watch:</span>{' '}
          Both panels show the <em>same</em> physical events — just drawn in different coordinate systems.
          In the home frame (left), the traveler departs and returns. In the traveler's instantaneous frame (right),
          Earth recedes and returns. During turnaround, watch the right panel carefully: the traveler's boost velocity
          flips sign, causing the home twin's worldline to swing dramatically. This is where the "lost time" becomes
          visually obvious — the home twin's worldline stretches while the traveler's frame transitions.
        </div>
      </div>
    </div>
  );
}
