import { useState, useCallback, useEffect } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawEvent } from '../../canvas/layers.ts';
import { colors, MONO } from '../../theme.ts';
import { eventsOnSlice } from '../../physics/spacetime.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition } from '../../types.ts';
import { defaultState, presets } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8;
const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };

export default function WhoseNow({ chapterState, onStateChange }: ChapterProps) {
  const [beta, setBeta] = useState<number>(chapterState?.obs ?? 0);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'vary-and-inspect');
  const events = defaultState.events;

  useEffect(() => {
    onStateChange?.({ obs: beta, mission: activeMission, chapter: 'whose-now' });
  }, [beta, activeMission, onStateChange]);

  const sceneState = { ...defaultState, observers: [{ ...defaultState.observers[0]!, beta }] as const, showCompare };
  const status = evaluateMission(activeMission, sceneState);
  const onSlice = eventsOnSlice(events, beta, 4, 0.5);
  const onSliceLabels = onSlice.map(e => e.label).join(', ');

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawSliceLine(ctx, toP, beta, 4, RANGE_X, { color: colors.sliceGold, lineWidth: 2.5, glow: true, label: `now (v=${beta.toFixed(2)}c)` });
    if (showCompare && Math.abs(beta) > 0.01) {
      drawSliceLine(ctx, toP, 0, 4, RANGE_X, { color: colors.textDim, lineWidth: 1, glow: false, dash: [4, 4], label: 'rest now' });
    }
    events.forEach(event => {
      const isOnSlice = onSlice.some(e => e.id === event.id);
      drawEvent(ctx, toP, event, { color: isOnSlice ? colors.sliceGold : colors.eventCyan, size: isOnSlice ? 6 : 5, selected: isOnSlice });
    });
    if (onSlice.length > 0) {
      ctx.fillStyle = colors.sliceGold;
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = 'left';
      ctx.fillText(`On slice: ${onSliceLabels}`, MARGINS.left + 4, H - 10);
    }
  }, [beta, events, onSlice, onSliceLabels, showCompare]);

  const canvasRef = useCanvas(draw);
  const missionDefs: (MissionDefinition & { action?: () => void })[] = missions.map(m => ({
    ...m,
    action: m.id === 'vary-and-inspect' ? () => setBeta(0) :
            m.id === 'preset-extreme' ? () => setBeta(0.8) :
            m.id === 'compare-snapshot' ? () => setShowCompare(true) : undefined,
  }));

  return (
    <ChapterShell
      controls={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ObserverSlider label="Observer velocity" value={beta} onChange={setBeta} color={colors.observerA} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map(p => (
              <button key={p.name} onClick={() => setBeta(p.beta)}
                style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${colors.border}`,
                  background: Math.abs(beta - p.beta) < 0.01 ? `${colors.eventCyan}14` : 'rgba(255,255,255,0.03)',
                  color: Math.abs(beta - p.beta) < 0.01 ? '#fff' : colors.textDim, cursor: 'pointer', fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {p.name}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
            <input type="checkbox" checked={showCompare} onChange={() => setShowCompare(v => !v)} />
            Show rest-frame comparison
          </label>
        </div>
      }
      canvas={
        <>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <AriaLiveRegion message={`Velocity ${beta.toFixed(2)}c. On slice: ${onSliceLabels || 'none'}.`} />
        </>
      }
      mission={<GuidedMissionPanel accent={colors.eventCyan} missions={missionDefs} activeId={activeMission} onSelect={setActiveMission} status={status} />}
      callout={
        <CalloutPanel accent={colors.eventCyan} title="Simultaneous for whom?"
          body={`At v = ${beta.toFixed(2)}c, ${onSlice.length} of ${events.length} events sit on the present slice: ${onSliceLabels || 'none'}.`}
          question="Is there one correct answer to 'what is happening right now'?"
          answer="No. 'Now' depends on who is asking and how fast they are moving." />
      }
    />
  );
}
