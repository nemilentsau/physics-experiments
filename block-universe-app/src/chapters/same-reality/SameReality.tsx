import { useState, useCallback, useEffect } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawEvent } from '../../canvas/layers.ts';
import { colors, MONO } from '../../theme.ts';
import { eventsOnSlice } from '../../physics/spacetime.ts';
import { useViewport } from '../../hooks/useViewport.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition } from '../../types.ts';
import { defaultState } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8;
const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };

export default function SameReality({ chapterState, onStateChange }: ChapterProps) {
  const { isMobile, isCompact } = useViewport();
  const [betaA, setBetaA] = useState<number>(chapterState?.obs ?? 0);
  const [betaB, setBetaB] = useState<number>(chapterState?.obs2 ?? 0.6);
  const [showSameEvents, setShowSameEvents] = useState<boolean>(true);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'find-shared-event');
  const events = defaultState.events;

  useEffect(() => {
    onStateChange?.({ obs: betaA, obs2: betaB, mission: activeMission, chapter: 'same-reality' });
  }, [betaA, betaB, activeMission, onStateChange]);

  const sceneState = { ...defaultState, observers: [{ ...defaultState.observers[0]!, beta: betaA }, { ...defaultState.observers[1]!, beta: betaB }] as const, showCompare: showSameEvents };
  const status = evaluateMission(activeMission, sceneState);

  const drawPanel = useCallback((observerBeta: number, observerColor: string, label: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawSliceLine(ctx, toP, observerBeta, 4.5, RANGE_X, { color: observerColor, lineWidth: 2.5, glow: true });
    const onSlice = eventsOnSlice(events, observerBeta, 4.5, 0.6);
    events.forEach(event => {
      const isOn = onSlice.some(e => e.id === event.id);
      drawEvent(ctx, toP, event, { color: isOn ? observerColor : colors.eventCyan, size: isOn ? 6 : 5, selected: isOn });
    });
    ctx.fillStyle = observerColor;
    ctx.font = `10px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, MARGINS.left + 4, MARGINS.top + 14);
  }, [events]);

  const canvasRefA = useCanvas(drawPanel(betaA, colors.observerA, `Observer A (v=${betaA.toFixed(2)}c)`));
  const canvasRefB = useCanvas(drawPanel(betaB, colors.observerB, `Observer B (v=${betaB.toFixed(2)}c)`));

  const missionDefs: (MissionDefinition & { action?: () => void })[] = missions.map(m => ({
    ...m,
    action: m.id === 'find-shared-event' ? () => { setBetaA(0); setBetaB(0.3); } :
            m.id === 'show-disagreement' ? () => { setBetaA(-0.3); setBetaB(0.6); } :
            m.id === 'toggle-reality' ? () => setShowSameEvents(true) : undefined,
  }));

  const canvasHeight = isMobile ? 280 : isCompact ? 340 : 400;

  return (
    <ChapterShell
      controls={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ObserverSlider label="Observer A" value={betaA} onChange={setBetaA} color={colors.observerA} />
          <ObserverSlider label="Observer B" value={betaB} onChange={setBetaB} color={colors.observerB} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
            <input type="checkbox" checked={showSameEvents} onChange={() => setShowSameEvents(v => !v)} />
            Highlight same events
          </label>
        </div>
      }
      canvas={
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100%', height: '100%', gap: 2 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <canvas ref={canvasRefA} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div style={{ width: isMobile ? '100%' : 2, height: isMobile ? 2 : '100%', background: colors.border }} />
          <div style={{ flex: 1, position: 'relative' }}>
            <canvas ref={canvasRefB} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <AriaLiveRegion message={`Observer A: v=${betaA.toFixed(2)}c. Observer B: v=${betaB.toFixed(2)}c.`} />
        </div>
      }
      canvasHeight={canvasHeight}
      mission={<GuidedMissionPanel accent={colors.observerB} missions={missionDefs} activeId={activeMission} onSelect={setActiveMission} status={status} />}
      callout={
        <CalloutPanel accent={colors.observerB} title="One event. Two valid descriptions."
          body="Both panels show the same events in the same spacetime. Only the present-slice differs."
          question="Does changing the observer change reality?" answer="No. The events are fixed. Only which events are called 'simultaneous' changes." />
      }
    />
  );
}
