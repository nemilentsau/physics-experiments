import { useState, useCallback, useEffect, useRef } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawEvent } from '../../canvas/layers.ts';
import { colors, MONO } from '../../theme.ts';
import { eventsOnSlice, simultaneityAngle } from '../../physics/spacetime.ts';
import { useViewport } from '../../hooks/useViewport.ts';
import { useAnimationLoop, easeOut } from '../../hooks/useAnimationLoop.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AnnotationOverlay } from '../../components/AnnotationOverlay.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition } from '../../types.ts';
import { defaultState } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8;
const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };

export default function TheShock({ chapterState, onStateChange }: ChapterProps) {
  const { isMobile } = useViewport();
  const [beta, setBeta] = useState<number>(chapterState?.obs ?? 0);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'find-disagreement');
  const events = defaultState.events;
  const introAnim = useAnimationLoop(2500);
  const hasPlayedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      introAnim.play();
    }
  }, []);

  const introTarget = 0.5;
  const introBeta = introAnim.progress < 1
    ? (introAnim.progress < 0.5
        ? easeOut(introAnim.progress * 2) * introTarget
        : easeOut((1 - introAnim.progress) * 2) * introTarget)
    : 0;
  const effectiveBeta = introAnim.progress < 1 ? introBeta : beta;

  useEffect(() => {
    onStateChange?.({ obs: beta, mission: activeMission, chapter: 'the-shock' });
  }, [beta, activeMission, onStateChange]);

  const sceneState = { ...defaultState, observers: [{ ...defaultState.observers[0]!, beta: effectiveBeta }] as const };
  const status = evaluateMission(activeMission, sceneState);
  const onSlice = eventsOnSlice(events, effectiveBeta, 5, 0.3);
  const onSliceLabels = onSlice.map(e => e.label).join(', ');

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawSliceLine(ctx, toP, effectiveBeta, 5, RANGE_X, {
      color: colors.sliceGold, lineWidth: 2.5, glow: true,
      label: effectiveBeta === 0 ? 'now' : `now (v=${effectiveBeta.toFixed(2)}c)`,
    });
    events.forEach(event => {
      const isOnSlice = onSlice.some(e => e.id === event.id);
      drawEvent(ctx, toP, event, { color: isOnSlice ? colors.sliceGold : colors.eventCyan, size: isOnSlice ? 6 : 5, selected: isOnSlice });
    });
    if (Math.abs(effectiveBeta) > 0.01) {
      const angle = simultaneityAngle(effectiveBeta);
      const deg = (angle * 180 / Math.PI).toFixed(1);
      ctx.fillStyle = colors.textDim;
      ctx.font = `9px ${MONO}`;
      ctx.textAlign = 'right';
      ctx.fillText(`tilt: ${deg}\u00B0`, W - MARGINS.right - 4, MARGINS.top + 14);
    }
  }, [effectiveBeta, events, onSlice]);

  const canvasRef = useCanvas(draw);

  const missionDefs: (MissionDefinition & { action?: () => void })[] = missions.map(m => ({
    ...m,
    action: m.id === 'find-disagreement' ? () => setBeta(0) :
            m.id === 'extreme-tilt' ? () => setBeta(0.8) :
            m.id === 'return-to-rest' ? () => setBeta(0) : undefined,
  }));

  const annotPos = { left: 72, top: 18 };

  return (
    <ChapterShell
      controls={
        <ObserverSlider label="Your velocity" value={introAnim.progress < 1 ? effectiveBeta : beta}
          onChange={(v: number) => { if (introAnim.isPlaying) introAnim.reset(); setBeta(v); }} color={colors.observerA} />
      }
      canvas={
        <>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <AriaLiveRegion message={`Observer velocity ${effectiveBeta.toFixed(2)}c. Events on slice: ${onSliceLabels || 'none'}.`} />
        </>
      }
      annotations={
        Math.abs(effectiveBeta) > 0.1 ? (
          <AnnotationOverlay left={annotPos.left} top={annotPos.top} accent={colors.sliceGold}
            title="Key insight" body="These events did not move. Only the observer's now-slice changed." compact={isMobile} />
        ) : undefined
      }
      mission={
        <GuidedMissionPanel accent={colors.sliceGold} missions={missionDefs} activeId={activeMission}
          onSelect={setActiveMission} status={status} />
      }
      callout={
        <CalloutPanel accent={colors.sliceGold} title="The present is not universal"
          body={
            Math.abs(effectiveBeta) < 0.02
              ? 'At rest, all three events sit on the same horizontal now-slice. They are simultaneous.'
              : `At v = ${effectiveBeta.toFixed(2)}c, the now-slice tilts. ${
                  onSlice.length < events.length
                    ? (onSlice.length === 0
                        ? 'No events remain on the slice.'
                        : `Only ${onSliceLabels} remain${onSlice.length === 1 ? 's' : ''} on the slice.`)
                    : 'All events are still on the slice, but barely.'
                }`
          }
          question="Can two observers disagree about which events are happening right now?"
          answer="Yes. If the events are spacelike-separated, different observers will slice through them differently."
        />
      }
    />
  );
}
