import { useState, useCallback, useEffect } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawEvent, drawWorldLine, drawWorldTube } from '../../canvas/layers.ts';
import { colors } from '../../theme.ts';
import { buildInertialWorldline, buildWorldTube } from '../../physics/worldline.ts';
import { foliationFamily } from '../../physics/foliation.ts';
import { useViewport } from '../../hooks/useViewport.ts';
import { useAnimationLoop, easeOut } from '../../hooks/useAnimationLoop.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AnnotationOverlay } from '../../components/AnnotationOverlay.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition, WorldlinePoint, WorldTube as WorldTubeType, FoliationSlice } from '../../types.ts';
import { defaultState } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8; const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };

export default function BlockView({ chapterState, onStateChange }: ChapterProps) {
  const { isMobile } = useViewport();
  const [betaA, setBetaA] = useState<number>(chapterState?.obs ?? 0);
  const [betaB, setBetaB] = useState<number>(chapterState?.obs2 ?? 0.5);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [blockView, setBlockView] = useState<boolean>(false);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'compare-slices');
  const revealAnim = useAnimationLoop(3500);

  useEffect(() => { onStateChange?.({ obs: betaA, obs2: betaB, mission: activeMission, chapter: 'block-view' }); }, [betaA, betaB, activeMission, onStateChange]);

  const sceneState = { ...defaultState, showCompare, blockView };
  const status = evaluateMission(activeMission, sceneState);
  const events = defaultState.events;
  const objectWL: WorldlinePoint[] = buildInertialWorldline(0.2, 0, RANGE_T, -1);
  const bodyTube: WorldTubeType = buildWorldTube(buildInertialWorldline(0.15, 0, RANGE_T, 2), 0.6);

  const handleBlockReveal = (): void => { setBlockView(true); revealAnim.play(); };

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    const blockAlpha: number = blockView ? (revealAnim.progress < 1 ? easeOut(revealAnim.progress) : 1) : 0;

    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);

    if (blockAlpha > 0) {
      const tl = toP(-RANGE_X, RANGE_T); const br = toP(RANGE_X, 0);
      ctx.fillStyle = `rgba(230,184,79,${(0.04 * blockAlpha).toFixed(3)})`;
      ctx.fillRect(tl.px, tl.py, br.px - tl.px, br.py - tl.py);
      const foliationA: FoliationSlice[] = foliationFamily(betaA, 0, RANGE_T, 2);
      foliationA.forEach(s => { drawSliceLine(ctx, toP, s.beta, s.tPrime, RANGE_X, { color: colors.observerA, lineWidth: 0.5, glow: false, dash: [2, 4] }); });
      if (showCompare) {
        const foliationB: FoliationSlice[] = foliationFamily(betaB, 0, RANGE_T, 2);
        foliationB.forEach(s => { drawSliceLine(ctx, toP, s.beta, s.tPrime, RANGE_X, { color: colors.observerB, lineWidth: 0.5, glow: false, dash: [2, 4] }); });
      }
    }

    drawWorldTube(ctx, toP, bodyTube, { color: 'rgba(141,216,224,0.08)', borderColor: colors.worldline });
    drawWorldLine(ctx, toP, objectWL, { color: colors.worldline, lineWidth: 2 });
    drawSliceLine(ctx, toP, betaA, 5, RANGE_X, { color: colors.observerA, lineWidth: 2.5, glow: !blockView, label: `A (v=${betaA.toFixed(2)}c)` });
    if (showCompare) {
      drawSliceLine(ctx, toP, betaB, 5, RANGE_X, { color: colors.observerB, lineWidth: 2, glow: !blockView, dash: [6, 3], label: `B (v=${betaB.toFixed(2)}c)` });
    }
    events.forEach(event => { drawEvent(ctx, toP, event, { color: colors.eventCyan, size: 6 }); });
  }, [betaA, betaB, showCompare, blockView, revealAnim.progress, events, objectWL, bodyTube]);

  const canvasRef = useCanvas(draw);
  const missionDefs: MissionDefinition[] = missions.map(m => ({
    ...m,
    action: m.id === 'compare-slices' ? () => setShowCompare(true) :
            m.id === 'block-reveal' ? handleBlockReveal :
            m.id === 'fade-to-block' ? () => setBlockView(true) : undefined,
  }));

  return (
    <ChapterShell
      controls={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ObserverSlider label="Observer A" value={betaA} onChange={setBetaA} color={colors.observerA} />
          <ObserverSlider label="Observer B" value={betaB} onChange={setBetaB} color={colors.observerB} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
            <input type="checkbox" checked={showCompare} onChange={() => setShowCompare(v => !v)} />
            Compare observers
          </label>
          <button onClick={handleBlockReveal}
            style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${blockView ? colors.sliceAmber + '55' : colors.border}`,
              background: blockView ? `${colors.sliceAmber}14` : 'rgba(255,255,255,0.03)',
              color: blockView ? '#fff' : colors.textDim, cursor: 'pointer', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {blockView ? 'Block view active' : 'Reveal block view'}
          </button>
        </div>
      }
      canvas={
        <>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <AriaLiveRegion message={`Block view ${blockView ? 'active' : 'off'}. Observer A: ${betaA.toFixed(2)}c. Observer B: ${betaB.toFixed(2)}c.`} />
        </>
      }
      annotations={
        blockView ? (
          <AnnotationOverlay left={50} top={12} accent={colors.sliceAmber}
            title="The block" body="Nothing new was added. Only the geometry was taken seriously." compact={isMobile} />
        ) : undefined
      }
      mission={<GuidedMissionPanel accent={colors.sliceAmber} missions={missionDefs} activeId={activeMission} onSelect={setActiveMission} status={status} />}
      callout={
        <CalloutPanel accent={colors.sliceAmber} title="The block universe"
          body={blockView
            ? 'All events, all worldlines, all slices — always present. The block universe is not a claim about physics. It is the geometry taken seriously.'
            : 'Two observers, same spacetime, different present slices. The block view shows what is always there.'}
          question="What does the block universe add to physics?"
          answer="Nothing. It takes the existing geometry of special relativity and refuses to privilege one simultaneity slice over another." />
      }
    />
  );
}
