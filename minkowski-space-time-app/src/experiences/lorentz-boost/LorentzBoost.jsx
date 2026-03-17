import { useEffect, useState } from 'react';
import { gamma, boostEvent } from '../../physics/lorentz.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useViewport } from '../../hooks/useViewport.js';
import { MONO, DISPLAY, colors } from '../../rendering/theme.js';
import { getBoostMissionStatus } from '../../logic/missions.js';
import { Panel } from '../../components/ui/Panel.jsx';
import { Slider } from '../../components/ui/Slider.jsx';
import { StoryCallout } from '../../components/ui/StoryCallout.jsx';
import { GuidedMissionPanel } from '../../components/ui/GuidedMissionPanel.jsx';
import { CanvasAnnotation } from '../../components/ui/CanvasAnnotation.jsx';

const RANGE = 6;

function getBoostStoryBeat(boostV, g) {
  const absV = Math.abs(boostV);
  const direction = boostV < 0 ? 'left' : 'right';

  if (absV < 0.01) {
    return {
      accent: colors.lightCone,
      badge: 'Frames aligned',
      title: 'At β = 0, the two coordinate systems sit on top of each other',
      body: 'This is the reference position. The primed axes coincide with x and t, so there is no relativity of simultaneity to inspect yet.',
      question: 'What should remain fixed when you start boosting?',
      answer: 'The light cone and the interval stay fixed. A boost changes the coordinate grid, not the causal structure of spacetime.',
    };
  }

  if (absV < 0.35) {
    return {
      accent: colors.gridBoosted,
      badge: `β ${boostV.toFixed(2)}c`,
      title: `The boosted frame is peeling ${direction}, but only slightly`,
      body: `With γ = ${g.toFixed(3)}, the tilt is gentle enough that the original and boosted grids still look closely related. This is where simultaneity starts to slip before intuition fully notices.`,
      question: 'What changes first as β moves away from zero?',
      answer: 'The axes and simultaneity slices begin to tilt. Time dilation and length contraction are already present because they come from that geometric reorientation.',
    };
  }

  if (absV < 0.75) {
    return {
      accent: colors.travelerAlt,
      badge: `γ ${g.toFixed(3)}`,
      title: 'Now the relativity of simultaneity is impossible to miss',
      body: `The t' = 0 line is no longer horizontal, so events that shared the same t coordinate in S no longer share the same t' coordinate in S'. The shifted grid is the mechanism behind the textbook effects.`,
      question: 'Why do time dilation and length contraction appear together?',
      answer: 'Because they are two readings of the same Lorentz transform. Once the axes tilt, both measurements change in lockstep.',
    };
  }

  return {
    accent: colors.lightCone,
    badge: `β ${boostV.toFixed(2)}c`,
    title: 'The boosted axes are crowding toward the light cone',
    body: `At this speed the primed grid is dramatically compressed, yet the light cone still refuses to budge. That visual stubbornness is the point: c stays invariant even when coordinates become extreme.`,
    question: 'What is the non-negotiable feature of every inertial frame?',
    answer: 'Every inertial observer draws the same light cone. Frames disagree about coordinates, but they agree on the speed-of-light boundary.',
  };
}

export default function LorentzBoost({ journeyState, onJourneyChange }) {
  const [boostV, setBoostV] = useState(journeyState?.boostBeta ?? journeyState?.beta ?? 0);
  const [showOriginalGrid, setShowOriginalGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showSimultaneity, setShowSimultaneity] = useState(true);
  const [activeMission, setActiveMission] = useState(journeyState?.boostMission ?? 'tilt');
  const { isMobile, isTablet } = useViewport();

  const g = boostV !== 0 ? gamma(boostV) : 1;
  const storyBeat = getBoostStoryBeat(boostV, g);
  const absBoost = Math.abs(boostV);
  const clampPercent = (value) => Math.max(8, Math.min(92, value));
  const toCanvasPercent = (x, t) => ({
    left: clampPercent(((x + RANGE) / (2 * RANGE)) * 100),
    top: clampPercent(((RANGE - t) / (2 * RANGE)) * 100),
  });
  const axisAnnotation = absBoost < 0.01
    ? toCanvasPercent(0, 0)
    : toCanvasPercent(boostV * RANGE * 0.68, RANGE * 0.68);
  const coneAnnotation = toCanvasPercent(RANGE * 0.78, RANGE * 0.78);
  const simultaneityAnnotation = toCanvasPercent(RANGE * 0.62, boostV * RANGE * 0.62);
  const techShellStyle = {
    position: 'relative',
    maxWidth: 1320,
    margin: '0 auto',
    padding: '20px 18px 18px',
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(0,229,204,0.14)',
    background: `
      linear-gradient(180deg, rgba(0,229,204,0.06), rgba(255,255,255,0.012)),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: 'auto, 120px 120px, 120px 120px',
  };
  const techPanelStyle = {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.22), rgba(255,255,255,0.015))',
    border: '1px solid rgba(0,229,204,0.16)',
    borderRadius: 10,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), 0 16px 30px rgba(0,0,0,0.2)',
  };
  const techPanelAltStyle = {
    ...techPanelStyle,
    border: '1px solid rgba(255,70,100,0.16)',
    background: 'linear-gradient(180deg, rgba(255,70,100,0.08), rgba(255,255,255,0.015))',
  };
  const techMatrixStyle = {
    ...techPanelStyle,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,229,204,0.035))',
  };
  const techCanvasFrameStyle = {
    background: `
      linear-gradient(180deg, rgba(0,229,204,0.10), rgba(255,255,255,0.012)),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: 'auto, 32px 32px, 32px 32px',
    border: '1px solid rgba(0,229,204,0.18)',
    borderRadius: 12,
    padding: 10,
    boxShadow: '0 20px 38px rgba(0,0,0,0.24)',
  };
  const techTitleStyle = {
    color: colors.gridBoosted,
    letterSpacing: '0.18em',
  };
  const boostCanvasHeight = isMobile ? 340 : isTablet ? 440 : 560;
  const boostMissionStatus = getBoostMissionStatus({
    missionId: activeMission,
    boostV,
    showSimultaneity,
  });
  const boostMissions = [
    {
      id: 'tilt',
      title: 'Tilt Axes',
      summary: 'Load a moderate boost and make the primed axes visibly peel away from x and t.',
      objective: 'Use the preset, then push β to about 0.6 so the two frames are clearly distinct.',
      successText: 'Once the axes separate, time dilation and length contraction stop looking like separate tricks.',
      action: () => {
        setBoostV(0.6);
        setShowOriginalGrid(true);
        setShowRulers(true);
        setShowSimultaneity(false);
      },
    },
    {
      id: 'simultaneity',
      title: 'Now-Slice',
      summary: 'Use the simultaneity line to make “same time in S′” visible.',
      objective: 'Load the preset, keep t′ = 0 visible, and push β beyond 0.75.',
      successText: 'The slanted t′ = 0 line is the cleanest picture of the relativity of simultaneity in this app.',
      action: () => {
        setBoostV(0.8);
        setShowOriginalGrid(true);
        setShowRulers(true);
        setShowSimultaneity(true);
      },
    },
    {
      id: 'reverse',
      title: 'Reverse',
      summary: 'Flip the experiment and watch the geometry lean the other way.',
      objective: 'Load a negative boost and compare the left-leaning primed axes with the right-leaning case.',
      successText: 'Changing the sign flips the frame orientation, not the invariant light cone.',
      action: () => {
        setBoostV(-0.65);
        setShowOriginalGrid(true);
        setShowRulers(true);
        setShowSimultaneity(true);
      },
    },
  ];

  useEffect(() => {
    onJourneyChange?.({
      boostBeta: boostV,
      boostMission: activeMission,
    });
  }, [activeMission, boostV, onJourneyChange]);

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
    }
  );

  return (
    <div style={techShellStyle}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at top right, rgba(255,70,100,0.10), transparent 22%)',
        pointerEvents: 'none',
      }}
      />
      <div style={{ textAlign: isMobile ? 'center' : 'left', marginBottom: isMobile ? 14 : 18, position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 400, color: '#fff', margin: 0, fontStyle: 'italic' }}>
          Lorentz Boost Visualizer
        </h1>
        <p style={{ fontSize: 9, color: colors.textFaint, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Coordinate Transforms · Relativity of Simultaneity · Invariant Light Cone
        </p>
      </div>

      <div style={{ display: 'flex', gap: isMobile ? 12 : 16, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {/* Left */}
        <div style={{ flex: isMobile ? '1 1 100%' : '0 0 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, order: isMobile ? 2 : 0 }}>
          <Panel title="Boost Parameters" style={techPanelStyle} titleStyle={techTitleStyle}>
            <Slider
              label={`β = ${boostV.toFixed(3)}c`}
              value={boostV} min={-0.9} max={0.9} step={0.01}
              onChange={setBoostV}
              color={colors.gridBoosted}
              suffix={boostV !== 0 ? ` γ = ${g.toFixed(3)}` : ''}
              labelStyle={{ color: 'rgba(255,255,255,0.66)' }}
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

          <Panel title="Display" style={techPanelAltStyle} titleStyle={{ ...techTitleStyle, color: colors.travelerAlt }}>
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

          <GuidedMissionPanel
            title="Guided Experiments"
            accent={colors.gridBoosted}
            missions={boostMissions}
            activeId={activeMission}
            onSelect={setActiveMission}
            status={boostMissionStatus}
          />

          {/* Key numbers */}
          <Panel title="Boost Effects" style={techMatrixStyle} titleStyle={techTitleStyle}>
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
        <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, order: 1 }}>
          <div style={techCanvasFrameStyle}>
            <canvas ref={canvasRef} style={{ width: '100%', height: boostCanvasHeight, display: 'block' }} />
            <CanvasAnnotation
              left={axisAnnotation.left}
              top={axisAnnotation.top}
              accent={absBoost < 0.01 ? colors.gridBoosted : colors.travelerAlt}
              title={absBoost < 0.01 ? 'Frames aligned' : 'Tilted axes'}
              body={absBoost < 0.01
                ? 'Start here, then drag beta and watch the primed axes peel away from x and t.'
                : `With beta = ${boostV.toFixed(2)}c, the primed frame leans ${boostV < 0 ? 'left' : 'right'} while keeping the same physics.`}
              align={axisAnnotation.left > 58 ? 'right' : 'left'}
              compact={isMobile}
            />
            {absBoost > 0.12 && showSimultaneity && (
              <CanvasAnnotation
                left={simultaneityAnnotation.left}
                top={simultaneityAnnotation.top}
                accent={colors.travelerAlt}
                title="Primed now-slice"
                body="Events on this line are simultaneous in S', even when they are not simultaneous in the lab frame."
                align="right"
                compact={isMobile}
              />
            )}
            <CanvasAnnotation
              left={coneAnnotation.left}
              top={coneAnnotation.top}
              accent={colors.lightCone}
              title="Invariant cone"
              body="The boost tilts coordinates, not the speed-of-light boundary."
              align="right"
              compact={isMobile}
            />
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

        {/* Right */}
        <div style={{ flex: isMobile ? '1 1 100%' : '0 0 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, order: isMobile ? 3 : 0 }}>
          <Panel title="The Boost Matrix" style={techMatrixStyle} titleStyle={techTitleStyle}>
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

          <Panel title="Invariant" style={techPanelAltStyle} titleStyle={{ ...techTitleStyle, color: colors.lightCone }}>
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
