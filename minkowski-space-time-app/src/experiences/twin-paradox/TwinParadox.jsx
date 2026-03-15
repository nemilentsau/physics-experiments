import { useState, useRef, useEffect, useCallback } from 'react';
import { gamma, dtaudt } from '../../physics/lorentz.js';
import { getTravelerState, integrateProperTime } from '../../physics/worldline.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useAnimationLoop } from '../../hooks/useAnimationLoop.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import { Panel } from '../../components/ui/Panel.jsx';
import { Slider } from '../../components/ui/Slider.jsx';
import { Toggle } from '../../components/ui/Toggle.jsx';
import { ProperTimeClock } from './ProperTimeClock.jsx';
import { RateMeter } from './RateMeter.jsx';

export default function TwinParadox() {
  const [velocity, setVelocity] = useState(0.6);
  const [tripDistance, setTripDistance] = useState(4);
  const [accelFraction, setAccelFraction] = useState(0.08);
  const [showSimult, setShowSimult] = useState(true);
  const [showLightCones, setShowLightCones] = useState(false);
  const [showTicks, setShowTicks] = useState(true);
  const { progress: animProgress, isPlaying, play, reset, scrub } = useAnimationLoop(6000);

  const v = velocity;
  const L = tripDistance;
  const g = gamma(v);
  const tOutbound = L / v;
  const tTotal = 2 * tOutbound;
  const accelDuration = accelFraction * tOutbound;

  const currentT = animProgress * tTotal;
  const travState = getTravelerState(currentT, v, tOutbound, accelDuration, L);
  const travSpeed = Math.abs(travState.v);
  const currentRate = dtaudt(travSpeed);
  const tauTravCurrent = integrateProperTime(currentT, v, tOutbound, accelDuration);
  const tauHomeCurrent = currentT;
  const tauTravTotal = integrateProperTime(tTotal, v, tOutbound, accelDuration);

  const timeDiff = tTotal - tauTravTotal;
  const pctLess = ((timeDiff / tTotal) * 100).toFixed(1);
  const phaseLabel = travState.phase === 'outbound' ? 'Outbound coast' :
    travState.phase === 'turnaround' ? 'Turnaround' :
    travState.phase === 'return' ? 'Return coast' : '—';
  const phaseColor = travState.phase === 'turnaround' ? colors.travelerAlt : colors.traveler;

  // ── Main spacetime diagram ──
  const mainCanvasRef = useCanvas(
    (ctx, W, H) => {
      const m = { top: 30, bottom: 40, left: 50, right: 30 };
      const pW = W - m.left - m.right;
      const pH = H - m.top - m.bottom;
      const maxT = tTotal * 1.12;
      const maxX = L * 1.5;

      const toP = (x, t) => ({
        px: m.left + pW / 2 + (x / maxX) * (pW / 2),
        py: H - m.bottom - (t / maxT) * pH,
      });

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      for (let t = 0; t <= maxT; t += 1) {
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

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'center';
      for (let t = 1; t <= Math.floor(maxT); t++) {
        const p = toP(0, t);
        ctx.fillText(t, p.px - 16, p.py + 3);
      }
      for (let x = -Math.floor(maxX); x <= Math.floor(maxX); x++) {
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

      // Light cones
      if (showLightCones) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255,200,50,0.1)';
        ctx.lineWidth = 0.8;
        [1, -1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(o.px, o.py);
          const e = toP(s * maxT, maxT);
          ctx.lineTo(e.px, e.py);
          ctx.stroke();
        });
        const tp = toP(L, tOutbound);
        [1, -1].forEach((s) => {
          ctx.beginPath(); ctx.moveTo(tp.px, tp.py);
          ctx.lineTo(toP(L + s * maxT, tOutbound + maxT).px, toP(L + s * maxT, tOutbound + maxT).py);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tp.px, tp.py);
          ctx.lineTo(toP(L + s * tOutbound, 0).px, toP(L + s * tOutbound, 0).py);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      // Turnaround region
      const tA1 = tOutbound - accelDuration;
      const tA2 = tOutbound + accelDuration;
      ctx.fillStyle = colors.turnaround;
      ctx.beginPath();
      ctx.moveTo(toP(-maxX, tA1).px, toP(-maxX, tA1).py);
      ctx.lineTo(toP(maxX, tA1).px, toP(maxX, tA1).py);
      ctx.lineTo(toP(maxX, tA2).px, toP(maxX, tA2).py);
      ctx.lineTo(toP(-maxX, tA2).px, toP(-maxX, tA2).py);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colors.turnaroundText;
      ctx.font = `8px ${MONO}`;
      ctx.textAlign = 'right';
      ctx.fillText('turnaround', W - m.right - 4, toP(0, tOutbound).py - 2);

      // Simultaneity lines
      if (showSimult) {
        const nLines = 10;
        for (let i = 1; i <= nLines; i++) {
          const tSim = (i / (nLines + 1)) * tTotal;
          if (tSim > currentT) continue;
          const st = getTravelerState(tSim, v, tOutbound, accelDuration, L);
          const lv = st.v;
          const sx = st.x;
          const x1 = -maxX;
          const t1c = tSim + lv * (x1 - sx);
          const x2 = maxX;
          const t2c = tSim + lv * (x2 - sx);
          const p1 = toP(x1, t1c);
          const p2 = toP(x2, t2c);
          const nearTurn = st.phase === 'turnaround';
          ctx.strokeStyle = nearTurn ? 'rgba(255,70,100,0.5)' : 'rgba(255,107,74,0.18)';
          ctx.lineWidth = nearTurn ? 1.2 : 0.7;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Home twin worldline
      const homeEndT = Math.min(currentT, tTotal);
      ctx.strokeStyle = colors.home;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = colors.home;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(o.px, o.py);
      ctx.lineTo(toP(0, homeEndT).px, toP(0, homeEndT).py);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Home proper time ticks
      if (showTicks) {
        for (let tau = 1; tau <= Math.floor(tTotal); tau++) {
          if (tau > currentT) break;
          const p = toP(0, tau);
          ctx.fillStyle = colors.home + 'aa';
          ctx.beginPath();
          ctx.arc(p.px - 6, p.py, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colors.home + '55';
          ctx.font = `8px ${MONO}`;
          ctx.textAlign = 'right';
          ctx.fillText(`τ=${tau}`, p.px - 12, p.py + 3);
        }
      }

      // Traveling twin worldline
      ctx.strokeStyle = colors.traveler;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = colors.traveler;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(o.px, o.py);
      const steps = 400;
      for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * tTotal;
        if (t > currentT) break;
        const st = getTravelerState(t, v, tOutbound, accelDuration, L);
        const p = toP(st.x, t);
        ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Traveler proper time ticks
      if (showTicks) {
        const totalTauTrav = integrateProperTime(tTotal, v, tOutbound, accelDuration);
        for (let tau = 1; tau <= Math.floor(totalTauTrav); tau++) {
          let lo = 0, hi = tTotal;
          for (let iter = 0; iter < 40; iter++) {
            const mid = (lo + hi) / 2;
            if (integrateProperTime(mid, v, tOutbound, accelDuration) < tau) lo = mid;
            else hi = mid;
          }
          const tCoord = (lo + hi) / 2;
          if (tCoord > currentT) break;
          const st = getTravelerState(tCoord, v, tOutbound, accelDuration, L);
          const p = toP(st.x, tCoord);
          ctx.fillStyle = colors.traveler + 'aa';
          ctx.beginPath();
          ctx.arc(p.px + 6, p.py, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = colors.traveler + '55';
          ctx.font = `8px ${MONO}`;
          ctx.textAlign = 'left';
          ctx.fillText(`τ=${tau}`, p.px + 12, p.py + 3);
        }
      }

      // Current position dots
      if (animProgress > 0 && animProgress < 1) {
        const hp = toP(0, currentT);
        ctx.fillStyle = colors.home;
        ctx.shadowColor = colors.home;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(hp.px, hp.py, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        const tp2 = toP(travState.x, currentT);
        ctx.fillStyle = colors.traveler;
        ctx.shadowColor = colors.traveler;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(tp2.px, tp2.py, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Event dots
      const drawEvt = (x, t, col, lbl, ox, oy) => {
        if (t > currentT && t > 0) return;
        const p = toP(x, t);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.px, p.py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `9px ${MONO}`;
        ctx.textAlign = 'left';
        ctx.fillText(lbl, p.px + ox, p.py + oy);
      };
      drawEvt(0, 0, '#fff', 'departure', 8, 12);
      drawEvt(L, tOutbound, colors.traveler, 'turnaround', 8, -6);
      drawEvt(0, tTotal, '#fff', 'reunion', 8, -6);
    },
    [velocity, tripDistance, accelFraction, animProgress, showSimult, showLightCones, showTicks, currentT]
  );

  // ── dτ/dt rate chart ──
  const rateCanvasRef = useCanvas(
    (ctx, W, H) => {
      const m = { top: 14, bottom: 24, left: 32, right: 8 };
      const pW = W - m.left - m.right;
      const pH = H - m.top - m.bottom;

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      const toP = (t, r) => ({
        px: m.left + (t / tTotal) * pW,
        py: H - m.bottom - r * pH,
      });

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      [0.25, 0.5, 0.75, 1.0].forEach((r) => {
        const p = toP(0, r);
        ctx.beginPath(); ctx.moveTo(m.left, p.py); ctx.lineTo(W - m.right, p.py); ctx.stroke();
      });

      // Reference line at 1.0
      ctx.strokeStyle = colors.home + '33';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      const ref = toP(0, 1);
      ctx.beginPath(); ctx.moveTo(m.left, ref.py); ctx.lineTo(W - m.right, ref.py); ctx.stroke();
      ctx.setLineDash([]);

      // Turnaround shading
      const tA1 = tOutbound - accelDuration;
      const tA2 = tOutbound + accelDuration;
      const p1 = toP(tA1, 0);
      const p2 = toP(tA2, 0);
      ctx.fillStyle = 'rgba(255,70,100,0.06)';
      ctx.fillRect(p1.px, m.top, p2.px - p1.px, pH);

      // Rate curve
      ctx.strokeStyle = colors.traveler;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const steps = 300;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tTotal;
        if (t > currentT) break;
        const st = getTravelerState(t, v, tOutbound, accelDuration, L);
        const rate = Math.sqrt(1 - st.v * st.v);
        const p = toP(t, rate);
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();

      // Fill under curve (lost time)
      if (currentT > 0) {
        const endT = Math.min(currentT, tTotal);
        ctx.beginPath();
        const pStart = toP(0, 1);
        ctx.moveTo(pStart.px, pStart.py);
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * tTotal;
          if (t > endT) break;
          const st = getTravelerState(t, v, tOutbound, accelDuration, L);
          const rate = Math.sqrt(1 - st.v * st.v);
          const p = toP(t, rate);
          ctx.lineTo(p.px, p.py);
        }
        ctx.lineTo(toP(endT, 1).px, toP(endT, 1).py);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,107,74,0.08)';
        ctx.fill();
      }

      // Axes
      ctx.strokeStyle = colors.axis;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(m.left, H - m.bottom); ctx.lineTo(W - m.right, H - m.bottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.left, m.top); ctx.lineTo(m.left, H - m.bottom); ctx.stroke();

      // Labels
      ctx.fillStyle = colors.textFaint;
      ctx.font = `8px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('t (coordinate)', W / 2, H - 4);
      ctx.textAlign = 'right';
      ctx.fillText('1.0', m.left - 4, ref.py + 3);
      ctx.fillText('0', m.left - 4, H - m.bottom + 3);

      // Current marker
      if (animProgress > 0 && animProgress < 1) {
        const cp = toP(currentT, currentRate);
        ctx.fillStyle = colors.traveler;
        ctx.shadowColor = colors.traveler;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cp.px, cp.py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    },
    [velocity, tripDistance, accelFraction, animProgress, currentT]
  );

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          The Twin Paradox
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Proper Time · Simultaneity · Path Geometry
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap' }}>
        {/* Left: Controls + Clocks */}
        <div style={{ flex: '0 0 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title="Parameters">
            <Slider
              label={`β = ${velocity.toFixed(2)}c`}
              value={velocity} min={0.1} max={0.99} step={0.01}
              onChange={setVelocity}
              suffix={` γ = ${g.toFixed(3)}`}
            />
            <Slider
              label={`Distance: ${tripDistance.toFixed(1)} ly`}
              value={tripDistance} min={1} max={10} step={0.5}
              onChange={setTripDistance}
            />
            <Slider
              label={`Accel. phase: ${(accelFraction * 100).toFixed(0)}% of leg`}
              value={accelFraction} min={0.01} max={0.45} step={0.01}
              onChange={setAccelFraction}
              color={colors.travelerAlt}
            />

            {/* Timeline scrubber */}
            <div style={{ marginTop: 4, marginBottom: 8 }}>
              <label style={{ fontSize: 9, color: colors.textFaint, display: 'block', marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Timeline
              </label>
              <input
                type="range"
                min={0} max={1} step={0.002}
                value={animProgress}
                onChange={(e) => scrub(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: colors.lightCone }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: colors.textGhost, marginTop: 2 }}>
                <span>t = 0</span>
                <span>t = {currentT.toFixed(1)} yr</span>
                <span>t = {tTotal.toFixed(1)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={play} disabled={isPlaying}
                style={{
                  flex: 1, padding: '8px 0',
                  background: isPlaying ? 'rgba(255,255,255,0.03)' : 'rgba(255,107,74,0.12)',
                  border: `1px solid ${isPlaying ? 'rgba(255,255,255,0.05)' : 'rgba(255,107,74,0.25)'}`,
                  borderRadius: 5, color: isPlaying ? 'rgba(255,255,255,0.2)' : colors.traveler,
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', cursor: isPlaying ? 'default' : 'pointer',
                  textTransform: 'uppercase',
                }}>
                {isPlaying ? '…' : '▶ Launch'}
              </button>
              <button onClick={reset}
                style={{
                  padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5,
                  color: colors.textDim, fontFamily: MONO, fontSize: 10, cursor: 'pointer',
                }}>
                ↺
              </button>
            </div>
          </Panel>

          <Panel>
            <Toggle label="Simultaneity lines" checked={showSimult} onChange={setShowSimult} />
            <Toggle label="Light cones" checked={showLightCones} onChange={setShowLightCones} />
            <Toggle label="Proper time ticks (τ)" checked={showTicks} onChange={setShowTicks} />
          </Panel>

          <Panel title="Proper Time Clocks">
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'flex-start' }}>
              <ProperTimeClock tau={tauHomeCurrent} maxTau={tTotal} color={colors.home} label="Home" size={100} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                <RateMeter rate={1} color={colors.home} height={60} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                <RateMeter rate={currentRate} color={colors.traveler} height={60} />
              </div>
              <ProperTimeClock tau={tauTravCurrent} maxTau={tTotal} color={colors.traveler} label="Traveler" size={100} />
            </div>
          </Panel>

          <Panel>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Phase</div>
              <div style={{ fontSize: 13, color: phaseColor, fontWeight: 500, marginTop: 4 }}>{phaseLabel}</div>
              <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4 }}>|v| = {travSpeed.toFixed(3)}c</div>
            </div>
          </Panel>
        </div>

        {/* Center: Spacetime Diagram */}
        <div style={{ flex: 1, minWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.015)', border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 8, position: 'relative',
          }}>
            <canvas ref={mainCanvasRef} style={{ width: '100%', height: 440, display: 'block' }} />
            {/* Legend */}
            <div style={{
              position: 'absolute', top: 12, right: 14, background: 'rgba(7,7,12,0.88)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '6px 10px', fontSize: 9,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <div style={{ width: 14, height: 2, background: colors.home, borderRadius: 1 }} />
                <span style={{ color: colors.textDim }}>Home (geodesic, dr=0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <div style={{ width: 14, height: 2, background: colors.traveler, borderRadius: 1 }} />
                <span style={{ color: colors.textDim }}>Traveler (dr≠0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 14, height: 0, borderTop: '1px dashed rgba(255,70,100,0.6)' }} />
                <span style={{ color: colors.textDim }}>Simultaneity</span>
              </div>
            </div>
          </div>

          {/* dτ/dt Rate Chart */}
          <div style={{
            background: 'rgba(255,255,255,0.015)', border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 8,
          }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: colors.textDim, marginBottom: 4, paddingLeft: 4 }}>
              dτ/dt — Proper Time Accumulation Rate
              <span style={{ color: colors.textGhost, marginLeft: 8 }}>shaded area = lost time</span>
            </div>
            <canvas ref={rateCanvasRef} style={{ width: '100%', height: 130, display: 'block' }} />
          </div>

          {/* Insight */}
          <div style={{
            background: colors.panelBg, border: `1px solid ${colors.border}`,
            borderRadius: 6, padding: 14, fontSize: 10.5, lineHeight: 1.7, color: colors.textDim,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>What the dτ/dt chart shows:</span>{' '}
            the shaded region between the 1.0 line and the curve is the total lost proper time. Notice it accumulates <em>continuously</em> during
            coasting — not just at turnaround. The turnaround dip is sharper but brief. Drag the accel fraction
            from 1% to 45%: the dip reshapes but the total shaded area barely changes.
            The time difference comes from having dr≠0 at every instant, not from any special turnaround physics.
          </div>
        </div>

        {/* Right: Results */}
        <div style={{ flex: '0 0 200px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel title="τ Accumulated">
            {/* Home bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: colors.home }}>Home</span>
                <span style={{ color: colors.home }}>{tauHomeCurrent.toFixed(2)} yr</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(tauHomeCurrent / tTotal) * 100}%`,
                  background: `linear-gradient(90deg, ${colors.home}44, ${colors.home}88)`,
                  borderRadius: 3, transition: 'width 0.05s',
                }} />
              </div>
            </div>
            {/* Traveler bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: colors.traveler }}>Traveler</span>
                <span style={{ color: colors.traveler }}>{tauTravCurrent.toFixed(2)} yr</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(tauTravCurrent / tTotal) * 100}%`,
                  background: `linear-gradient(90deg, ${colors.traveler}44, ${colors.traveler}88)`,
                  borderRadius: 3, transition: 'width 0.05s',
                }} />
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: 8, textAlign: 'center', marginTop: 6,
            }}>
              <div style={{ fontSize: 9, color: colors.textDim, marginBottom: 2 }}>Difference</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 20, color: '#fff' }}>
                {(tauHomeCurrent - tauTravCurrent).toFixed(2)} yr
              </div>
            </div>
          </Panel>

          <Panel title="At Reunion">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{
                flex: 1, background: 'rgba(0,229,204,0.05)', border: '1px solid rgba(0,229,204,0.15)',
                borderRadius: 5, padding: 8, textAlign: 'center',
              }}>
                <div style={{ fontSize: 8, color: colors.home + '99', textTransform: 'uppercase' }}>Home</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, color: colors.home, marginTop: 2 }}>{tTotal.toFixed(2)}</div>
              </div>
              <div style={{
                flex: 1, background: 'rgba(255,107,74,0.05)', border: '1px solid rgba(255,107,74,0.15)',
                borderRadius: 5, padding: 8, textAlign: 'center',
              }}>
                <div style={{ fontSize: 8, color: colors.traveler + '99', textTransform: 'uppercase' }}>Traveler</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, color: colors.traveler, marginTop: 2 }}>{tauTravTotal.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: colors.textDim }}>
              Traveler aged <span style={{ color: colors.traveler }}>{pctLess}%</span> less
            </div>
          </Panel>

          <Panel title="The Metric">
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.6 }}>
              dτ² = dt² − dr²
            </div>
            <div style={{ fontSize: 9.5, color: colors.textDim, marginTop: 8, lineHeight: 1.6 }}>
              Home: dr=0 → dτ=dt
              <br />
              Traveler: dr≠0 → dτ&lt;dt
              <br />
              <span style={{ fontStyle: 'italic', color: colors.textGhost }}>
                Every instant with spatial motion costs proper time.
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
