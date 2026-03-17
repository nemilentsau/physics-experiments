import { useEffect, useState } from 'react';
import { boostEvent } from '../../physics/lorentz.js';
import { getTravelerState, integrateProperTime } from '../../physics/worldline.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useAnimationLoop } from '../../hooks/useAnimationLoop.js';
import { useViewport } from '../../hooks/useViewport.js';
import { getFrameMissionStatus } from '../../logic/missions.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import { Panel } from '../../components/ui/Panel.jsx';
import { Slider } from '../../components/ui/Slider.jsx';
import { StoryCallout } from '../../components/ui/StoryCallout.jsx';
import { GuidedMissionPanel } from '../../components/ui/GuidedMissionPanel.jsx';
import { CanvasAnnotation } from '../../components/ui/CanvasAnnotation.jsx';

function getReferenceFrameBeat({ currentT, tTotal, travState, tauTrav, velocity }) {
  if (currentT < tTotal * 0.04) {
    return {
      accent: colors.lightCone,
      badge: 'Departure',
      title: 'Both panels agree on the departure event',
      body: 'At the instant of launch there is no disagreement to explain: the twins share the same event, and the primed frame is only just beginning to separate from the home frame.',
      question: 'Where does the frame disagreement come from?',
      answer: 'Not from the events themselves. It comes from assigning different coordinates and different simultaneity slices to the same events.',
    };
  }

  if (travState.phase === 'turnaround') {
    return {
      accent: colors.travelerAlt,
      badge: 'Asymmetry exposed',
      title: 'This is the moment the paradox stops looking symmetric',
      body: `The right panel is not one eternal traveler frame. It is switching from one instantaneous rest frame to another, which is why the home twin's line appears to swing so sharply here.`,
      question: 'Why is the traveler not equivalent to the home twin?',
      answer: 'Because the traveler changes frames at turnaround. The home twin stays in one inertial frame while the traveler stitches two inertial descriptions together.',
    };
  }

  if (currentT > tTotal * 0.98) {
    return {
      accent: colors.home,
      badge: `τ_trav ${tauTrav.toFixed(2)} yr`,
      title: 'Reunion confirms that the two drawings were one physical story',
      body: `Both panels land on the same reunion event even though their coordinate labels looked different along the way. The traveler arrives back with less proper time because the path was different, not because one frame was more real.`,
      question: 'What do the two panels ultimately prove?',
      answer: 'They prove that coordinate disagreement is compatible with physical agreement. Everyone predicts the same reunion and the same age gap.',
    };
  }

  if (travState.phase === 'outbound') {
    return {
      accent: colors.traveler,
      badge: `S' β=${travState.v.toFixed(2)}c`,
      title: 'The same outbound trip already looks different in the rider frame',
      body: `In S the traveler moves away; in S' the traveler is momentarily at rest while Earth recedes. The event set is unchanged, but the coordinate grid has rotated enough to alter which distant moments count as now.`,
      question: 'Are the two panels showing different physics?',
      answer: 'No. They are showing the same events with different coordinate assignments, which is exactly what relativity says inertial observers should do.',
    };
  }

  return {
    accent: colors.home,
    badge: `β=${velocity.toFixed(2)}c`,
    title: 'On the return leg, the frame shift is carrying the explanation home',
    body: `After turnaround the traveler's instantaneous rest frame has the opposite sign, so Earth's worldline is re-read with a different simultaneity convention. That re-reading is where the apparent symmetry finally collapses.`,
    question: 'What should you compare between the two panels?',
    answer: 'Compare matching labeled events, not just line shapes. The event identity is shared even when the coordinates and slopes are not.',
  };
}

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

export default function ReferenceFrames({ journeyState, onJourneyChange }) {
  const [velocity, setVelocity] = useState(journeyState?.beta ?? 0.6);
  const [tripDistance, setTripDistance] = useState(journeyState?.tripDistance ?? 4);
  const [activeMission, setActiveMission] = useState(journeyState?.frameMission ?? 'turnaround');
  const accelFraction = journeyState?.accelFraction ?? 0.08;
  const { progress: animProgress, isPlaying, play, reset, scrub } = useAnimationLoop(8000);
  const { isMobile, isTablet } = useViewport();

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
    }
  );

  // Traveler's instantaneous rest frame
  const travelerCanvasRef = useCanvas(
    (ctx, W, H) => {
      drawSpacetimeDiagram(ctx, W, H, {
        v, L, tOutbound, tTotal, accelDuration, currentT,
        boostVelocity: travState.v,
        frameLabel: `S' — Traveler Frame (β=${travState.v.toFixed(2)}c)`,
      });
    }
  );

  const tauTrav = integrateProperTime(currentT, v, tOutbound, accelDuration);
  const storyBeat = getReferenceFrameBeat({
    currentT,
    tTotal,
    travState,
    tauTrav,
    velocity,
  });
  const clampPercent = (value) => Math.max(8, Math.min(92, value));
  const frameMaxT = tTotal * 1.15;
  const frameMaxX = L * 2;
  const toFramePercent = (x, t, boostVelocity = 0) => {
    if (boostVelocity !== 0) {
      const boosted = boostEvent(t, x, boostVelocity);
      x = boosted.x;
      t = boosted.t;
    }

    return {
      left: clampPercent(50 + (x / frameMaxX) * 50),
      top: clampPercent(100 - (t / frameMaxT) * 100),
    };
  };
  const homeTurnAnnotation = toFramePercent(L, tOutbound);
  const travelerTurnAnnotation = toFramePercent(L, tOutbound, travState.v);
  const travelerCurrentAnnotation = toFramePercent(travState.x, currentT, travState.v);
  const travelerReunionAnnotation = toFramePercent(0, tTotal, travState.v);
  const frameShellStyle = {
    position: 'relative',
    maxWidth: 1320,
    margin: '0 auto',
    padding: '20px 18px 18px',
    borderRadius: 26,
    overflow: 'hidden',
    border: '1px solid rgba(0,229,204,0.12)',
    background: `
      linear-gradient(90deg, rgba(0,229,204,0.07), rgba(255,255,255,0.015) 48%, rgba(255,107,74,0.07)),
      linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))
    `,
  };
  const comparePanelStyle = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    boxShadow: '0 16px 32px rgba(0,0,0,0.18)',
  };
  const homeFrameStyle = {
    background: 'linear-gradient(180deg, rgba(0,229,204,0.09), rgba(255,255,255,0.014))',
    border: '1px solid rgba(0,229,204,0.18)',
    borderRadius: 18,
    padding: 10,
  };
  const travelerFrameStyle = {
    background: 'linear-gradient(180deg, rgba(255,107,74,0.10), rgba(255,255,255,0.014))',
    border: '1px solid rgba(255,107,74,0.18)',
    borderRadius: 18,
    padding: 10,
  };
  const compareTitleStyle = {
    color: 'rgba(255,255,255,0.34)',
    letterSpacing: '0.18em',
  };
  const frameCanvasHeight = isMobile ? 280 : isTablet ? 380 : 500;
  const frameMissionStatus = getFrameMissionStatus({
    missionId: activeMission,
    animProgress,
    travelerPhase: travState.phase,
  });
  const frameMissions = [
    {
      id: 'turnaround',
      title: 'Midpoint',
      summary: 'Load a clean comparison case and stop right at the turnaround band.',
      objective: 'Use the preset, then scrub to the midpoint of the trip where the frame change is easiest to inspect.',
      successText: 'Turnaround is the best frozen moment for seeing why the two panels are not symmetric descriptions.',
      action: () => {
        setVelocity(0.72);
        setTripDistance(5);
        reset();
      },
    },
    {
      id: 'flip',
      title: 'Frame Flip',
      summary: 'Push to a faster trip and catch the traveler frame while it is actively changing sign.',
      objective: 'Load the preset and scrub until the traveler enters the turnaround phase.',
      successText: 'The right panel is not one permanent frame. It is stitching together two instantaneous rest frames around the flip.',
      action: () => {
        setVelocity(0.82);
        setTripDistance(5);
        reset();
      },
    },
    {
      id: 'reunion',
      title: 'Reunion',
      summary: 'Run the comparison all the way home and verify that both panels predict the same ending.',
      objective: 'Use the preset and play or scrub to the reunion event.',
      successText: 'Coordinate disagreement vanishes at reunion because both panels must agree on the same final event and age gap.',
      action: () => {
        setVelocity(0.82);
        setTripDistance(6);
        reset();
      },
    },
  ];

  useEffect(() => {
    onJourneyChange?.({
      beta: velocity,
      tripDistance,
      frameMission: activeMission,
    });
  }, [activeMission, onJourneyChange, tripDistance, velocity]);

  return (
    <div style={frameShellStyle}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent 49.6%, rgba(255,255,255,0.05) 50%, transparent 50.4%)',
        pointerEvents: 'none',
      }}
      />
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 14 : 18, position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          Reference Frames
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Side-by-Side · Same Physics, Different Coordinates
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Controls row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
          <Panel title="Parameters" style={{ ...comparePanelStyle, flex: '1 1 300px' }} titleStyle={compareTitleStyle}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <Slider label={`β = ${velocity.toFixed(2)}c`} value={velocity} min={0.1} max={0.99} step={0.01} onChange={setVelocity} labelStyle={{ color: 'rgba(255,255,255,0.62)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <Slider label={`Distance: ${tripDistance.toFixed(1)} ly`} value={tripDistance} min={1} max={10} step={0.5} onChange={setTripDistance} labelStyle={{ color: 'rgba(255,255,255,0.62)' }} />
              </div>
            </div>
          </Panel>

          <Panel title="Timeline" style={{ ...comparePanelStyle, flex: '1 1 300px' }} titleStyle={compareTitleStyle}>
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

          <div style={{ flex: '1 1 280px', minWidth: isMobile ? 0 : 260 }}>
            <GuidedMissionPanel
              title="Guided Experiments"
              accent={colors.home}
              missions={frameMissions}
              activeId={activeMission}
              onSelect={setActiveMission}
              status={frameMissionStatus}
            />
          </div>
        </div>

        {/* Side-by-side diagrams */}
        <div style={{ position: 'relative', display: 'flex', gap: 16, alignItems: 'stretch', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{
            position: isMobile ? 'static' : 'absolute',
            left: isMobile ? undefined : '50%',
            top: isMobile ? undefined : 12,
            transform: isMobile ? 'none' : 'translateX(-50%)',
            margin: isMobile ? '0 auto 6px' : 0,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(7,7,12,0.86)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.52)',
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            zIndex: 2,
          }}>
            same events
          </div>
          <div style={{
            flex: 1,
            ...homeFrameStyle,
            position: 'relative',
          }}>
            <canvas ref={homeCanvasRef} style={{ width: '100%', height: frameCanvasHeight, display: 'block' }} />
            <CanvasAnnotation
              left={homeTurnAnnotation.left}
              top={homeTurnAnnotation.top}
              accent={colors.home}
              title="Turnaround in S"
              body="Left panel: one specific event at the far end of the trip."
              align={homeTurnAnnotation.left > 60 ? 'right' : 'left'}
              compact={isMobile}
            />
          </div>
          <div style={{
            flex: 1,
            ...travelerFrameStyle,
            position: 'relative',
          }}>
            <canvas ref={travelerCanvasRef} style={{ width: '100%', height: frameCanvasHeight, display: 'block' }} />
            {animProgress > 0.88 ? (
              <CanvasAnnotation
                left={travelerReunionAnnotation.left}
                top={travelerReunionAnnotation.top}
                accent={colors.traveler}
                title="Shared reunion"
                body="Different coordinates, same final event and same age gap."
                align={travelerReunionAnnotation.left > 60 ? 'right' : 'left'}
                compact={isMobile}
              />
            ) : (
              <CanvasAnnotation
                left={travelerTurnAnnotation.left}
                top={travelerTurnAnnotation.top}
                accent={colors.traveler}
                title="Same turnaround"
                body="Right panel: the same event has moved on the grid because the frame changed."
                align={travelerTurnAnnotation.left > 60 ? 'right' : 'left'}
                compact={isMobile}
              />
            )}
            {travState.phase === 'turnaround' && (
              <CanvasAnnotation
                left={travelerCurrentAnnotation.left}
                top={travelerCurrentAnnotation.top}
                accent={colors.travelerAlt}
                title="Frame switching"
                body="This instant-rest description is actively changing sign around the midpoint."
                align={travelerCurrentAnnotation.left > 60 ? 'right' : 'left'}
                compact={isMobile}
              />
            )}
          </div>
        </div>

        {/* Insight */}
        <div style={{ marginTop: 14 }}>
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
      </div>
    </div>
  );
}
