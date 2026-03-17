import { useState, useCallback, useEffect } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawEvent, drawLightCone } from '../../canvas/layers.ts';
import { colors, MONO } from '../../theme.ts';
import { classifyRelation } from '../../physics/lorentz.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition, SceneState } from '../../types.ts';
import { defaultState } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8;
const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };
const RELATION_COLORS: Record<string, string> = { timelike: colors.timelike, spacelike: colors.spacelike, lightlike: colors.lightlike };

export default function Causality({ chapterState, onStateChange }: ChapterProps) {
  const [beta, setBeta] = useState<number>(chapterState?.obs ?? 0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLightCones, setShowLightCones] = useState<boolean>(true);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'find-flip');
  const events = defaultState.events;

  useEffect(() => { onStateChange?.({ obs: beta, mission: activeMission, chapter: 'causality' }); }, [beta, activeMission, onStateChange]);

  const sceneState: SceneState = { ...defaultState, observers: [{ ...defaultState.observers[0]!, beta }], selectedEventId: selectedId };
  const status = evaluateMission(activeMission, sceneState);
  const selectedEvent = events.find(e => e.id === selectedId);

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    if (showLightCones && selectedEvent) drawLightCone(ctx, toP, selectedEvent, RANGE_T);
    drawSliceLine(ctx, toP, beta, 4, RANGE_X, { color: colors.sliceGold, lineWidth: 2, glow: true });
    events.forEach(event => {
      let evColor: string = colors.eventCyan;
      if (selectedEvent && event.id !== selectedId) { const rel = classifyRelation(selectedEvent, event); evColor = RELATION_COLORS[rel] ?? colors.eventCyan; }
      drawEvent(ctx, toP, event, { color: event.id === selectedId ? '#fff' : evColor, size: event.id === selectedId ? 7 : 5, selected: event.id === selectedId });
      if (selectedEvent && event.id !== selectedId) {
        const rel = classifyRelation(selectedEvent, event);
        const p = toP(event.x, event.t);
        ctx.fillStyle = (RELATION_COLORS[rel] ?? colors.eventCyan) + 'aa';
        ctx.font = `8px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(rel, p.px, p.py - 12);
      }
    });
    // Legend
    ctx.font = `8px ${MONO}`; ctx.textAlign = 'left';
    const legendY: number = H - 12;
    (['timelike', 'spacelike', 'lightlike'] as const).forEach((label, i) => {
      const col: string = RELATION_COLORS[label]!;
      const lx: number = MARGINS.left + i * 80;
      ctx.fillStyle = col; ctx.fillRect(lx, legendY - 4, 8, 8); ctx.fillText(label, lx + 12, legendY + 3);
    });
  }, [beta, events, selectedId, selectedEvent, showLightCones]);

  const canvasRef = useCanvas(draw);
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px: number = e.clientX - rect.left; const py: number = e.clientY - rect.top;
    const W: number = canvas.clientWidth; const H: number = canvas.clientHeight;
    for (const event of events) {
      const p = toPixel(event.x, event.t, W, H, RANGE_X, RANGE_T, MARGINS);
      if (Math.sqrt((px - p.px) ** 2 + (py - p.py) ** 2) < 15) { setSelectedId(event.id); return; }
    }
  }, [events, canvasRef]);

  const missionDefs: MissionDefinition[] = missions.map(m => ({
    ...m,
    action: m.id === 'find-flip' ? () => { setSelectedId('evt-A'); setBeta(0.6); } :
            m.id === 'causal-pair' ? () => setSelectedId('evt-A') :
            m.id === 'boundary-walk' ? () => setBeta(0) : undefined,
  }));

  return (
    <ChapterShell
      controls={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ObserverSlider label="Observer velocity" value={beta} onChange={setBeta} color={colors.observerA} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {events.map(ev => (
              <button key={ev.id} onClick={() => setSelectedId(ev.id)}
                style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${selectedId === ev.id ? colors.lightCone + '55' : colors.border}`,
                  background: selectedId === ev.id ? `${colors.lightCone}14` : 'rgba(255,255,255,0.03)',
                  color: selectedId === ev.id ? '#fff' : colors.textDim, cursor: 'pointer', fontSize: 9 }}>
                {ev.label}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
            <input type="checkbox" checked={showLightCones} onChange={() => setShowLightCones(v => !v)} />
            Show light cones
          </label>
        </div>
      }
      canvas={
        <>
          <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
          <AriaLiveRegion message={`Selected event: ${selectedEvent?.label ?? 'none'}. Velocity: ${beta.toFixed(2)}c.`} />
        </>
      }
      mission={<GuidedMissionPanel accent={colors.lightCone} missions={missionDefs} activeId={activeMission} onSelect={setActiveMission} status={status} />}
      callout={
        <CalloutPanel accent={colors.lightCone} title="Causality still holds"
          body="Simultaneity can change, but causally connected events keep their order. The light cone is the boundary."
          question="Can changing your velocity reverse cause and effect?"
          answer="Never for timelike pairs. Only spacelike pairs — which cannot be causally connected — can swap order." />
      }
    />
  );
}
