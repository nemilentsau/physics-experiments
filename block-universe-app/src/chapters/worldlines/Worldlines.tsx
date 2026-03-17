import { useState, useCallback, useEffect, useRef } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawWorldLine, drawWorldTube } from '../../canvas/layers.ts';
import { colors, MONO } from '../../theme.ts';
import { buildInertialWorldline, buildWorldTube, sliceWorldLine } from '../../physics/worldline.ts';
import { useViewport } from '../../hooks/useViewport.ts';
import { useAnimationLoop, easeOut } from '../../hooks/useAnimationLoop.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AnnotationOverlay } from '../../components/AnnotationOverlay.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition, WorldlinePoint, WorldTube as WorldTubeType } from '../../types.ts';
import { defaultState } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8; const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };

export default function Worldlines({ chapterState, onStateChange }: ChapterProps) {
  const { isMobile } = useViewport();
  const [beta, setBeta] = useState<number>(chapterState?.obs ?? 0);
  const [sliceTPrime, setSliceTPrime] = useState<number>(1);
  const [showWorldtubes, setShowWorldtubes] = useState<boolean>(true);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'cross-section');
  const revealAnim = useAnimationLoop(3000);
  const hasPlayedRef = useRef<boolean>(false);

  useEffect(() => { if (!hasPlayedRef.current) { hasPlayedRef.current = true; revealAnim.play(); } }, []);

  useEffect(() => { onStateChange?.({ obs: beta, mission: activeMission, chapter: 'worldlines' }); }, [beta, activeMission, onStateChange]);

  const sceneState = { ...defaultState, observers: [{ ...defaultState.observers[0]!, beta }], sliceTPrime, showWorldtubes };
  const status = evaluateMission(activeMission, sceneState);

  const stationWL: WorldlinePoint[] = buildInertialWorldline(0, 0, RANGE_T, -2);
  const shipWL: WorldlinePoint[] = buildInertialWorldline(0.4, 0, RANGE_T, 0);
  const shipTube: WorldTubeType = buildWorldTube(buildInertialWorldline(0.4, 0, RANGE_T, 3), 0.8);
  const revealT: number = revealAnim.progress < 1 ? easeOut(revealAnim.progress) * RANGE_T : RANGE_T;

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);

    if (showWorldtubes) {
      const clippedTube: WorldTubeType = {
        left: shipTube.left.filter(p => p.t <= revealT),
        right: shipTube.right.filter(p => p.t <= revealT),
        center: shipTube.center.filter(p => p.t <= revealT),
      };
      drawWorldTube(ctx, toP, clippedTube, { color: 'rgba(141,216,224,0.10)', borderColor: colors.worldline });
    }

    const clippedStation: WorldlinePoint[] = stationWL.filter(p => p.t <= revealT);
    const clippedShip: WorldlinePoint[] = shipWL.filter(p => p.t <= revealT);
    drawWorldLine(ctx, toP, clippedStation, { color: colors.observerA, lineWidth: 2 });
    drawWorldLine(ctx, toP, clippedShip, { color: colors.observerB, lineWidth: 2 });

    if (clippedStation.length > 1) {
      const last = clippedStation[clippedStation.length - 1]!;
      const p = toP(last.x, last.t);
      ctx.fillStyle = colors.observerA; ctx.font = `9px ${MONO}`; ctx.textAlign = 'left'; ctx.fillText('Station', p.px + 8, p.py);
    }
    if (clippedShip.length > 1) {
      const last = clippedShip[clippedShip.length - 1]!;
      const p = toP(last.x, last.t);
      ctx.fillStyle = colors.observerB; ctx.font = `9px ${MONO}`; ctx.textAlign = 'left'; ctx.fillText('Ship', p.px + 8, p.py);
    }

    drawSliceLine(ctx, toP, beta, sliceTPrime, RANGE_X, { color: colors.sliceGold, lineWidth: 2, glow: true });

    const stationHit: WorldlinePoint | null = sliceWorldLine(stationWL, beta, sliceTPrime);
    const shipHit: WorldlinePoint | null = sliceWorldLine(shipWL, beta, sliceTPrime);
    [stationHit, shipHit].forEach(hit => {
      if (!hit) return;
      const p = toP(hit.x, hit.t);
      ctx.fillStyle = colors.sliceGold;
      ctx.beginPath(); ctx.arc(p.px, p.py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = colors.sliceGold; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
    });
  }, [beta, sliceTPrime, showWorldtubes, revealT, stationWL, shipWL, shipTube]);

  const canvasRef = useCanvas(draw);
  const missionDefs: MissionDefinition[] = missions.map(m => ({
    ...m,
    action: m.id === 'cross-section' ? () => setSliceTPrime(5) :
            m.id === 'toggle-views' ? () => setShowWorldtubes(true) :
            m.id === 'different-slices' ? () => setBeta(0.5) : undefined,
  }));

  return (
    <ChapterShell
      controls={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ObserverSlider label="Observer velocity" value={beta} onChange={setBeta} color={colors.observerA} />
          <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))', border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: colors.sliceGold, marginBottom: 8 }}>
              Slice position: t' = {sliceTPrime.toFixed(1)}
            </div>
            <input type="range" min={0} max={RANGE_T} step={0.1} value={sliceTPrime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSliceTPrime(Number(e.target.value))}
              style={{ width: '100%', accentColor: colors.sliceGold, cursor: 'pointer' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
            <input type="checkbox" checked={showWorldtubes} onChange={() => setShowWorldtubes(v => !v)} />
            Show worldtubes
          </label>
        </div>
      }
      canvas={
        <>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <AriaLiveRegion message={`Slice at t'=${sliceTPrime.toFixed(1)}. Velocity ${beta.toFixed(2)}c.`} />
        </>
      }
      annotations={
        showWorldtubes ? (
          <AnnotationOverlay left={75} top={50} accent={colors.worldline}
            title="Worldtube" body="The ship isn't a point — it extends through space and time." compact={isMobile} />
        ) : undefined
      }
      mission={<GuidedMissionPanel accent={colors.worldline} missions={missionDefs} activeId={activeMission} onSelect={setActiveMission} status={status} />}
      callout={
        <CalloutPanel accent={colors.worldline} title="Objects are worldlines"
          body="A worldline is not a trajectory through space. It is the complete existence of an object through spacetime. A slice through it is 'the object right now'."
          question="What is 'the ship right now'?"
          answer="It depends on the observer. Different slices produce different cross-sections of the same worldtube." />
      }
    />
  );
}
