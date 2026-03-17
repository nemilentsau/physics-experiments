import { useState, useCallback, useEffect } from 'react';
import { useCanvas } from '../../canvas/useCanvas.ts';
import { toPixel, toSpacetime } from '../../canvas/coordinates.ts';
import { drawGrid, drawAxes, drawSliceLine, drawEvent, drawLightCone } from '../../canvas/layers.ts';
import { colors, MONO } from '../../theme.ts';
import { classifyRelation } from '../../physics/lorentz.ts';
import { useDragInteraction } from '../../canvas/useDragInteraction.ts';
import { useViewport } from '../../hooks/useViewport.ts';
import { ChapterShell } from '../../components/ChapterShell.tsx';
import { ObserverSlider } from '../../components/ObserverSlider.tsx';
import { GuidedMissionPanel } from '../../components/GuidedMissionPanel.tsx';
import { CalloutPanel } from '../../components/CalloutPanel.tsx';
import { AriaLiveRegion } from '../../components/AriaLiveRegion.tsx';
import type { ChapterProps, MissionDefinition, SpacetimeEvent, Observer } from '../../types.ts';
import { defaultState, presets } from './defaults.ts';
import type { LabPreset } from './defaults.ts';
import { missions, evaluateMission } from './missions.ts';

const RANGE_X = 8; const RANGE_T = 10;
const MARGINS = { top: 30, bottom: 40, left: 50, right: 30 };
const OBSERVER_COLORS: string[] = [colors.observerA, colors.observerB, colors.observerC, colors.observerD];
const RELATION_COLORS: Record<string, string> = { timelike: colors.timelike, spacelike: colors.spacelike, lightlike: colors.lightlike };

export default function ObserverLab({ chapterState, onStateChange }: ChapterProps) {
  const { isMobile } = useViewport();
  const [events, setEvents] = useState<SpacetimeEvent[]>([...defaultState.events]);
  const [observers, setObservers] = useState<Observer[]>([...defaultState.observers]);
  const [showLightCones, setShowLightCones] = useState<boolean>(false);
  const [showSlices, setShowSlices] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState<string>(chapterState?.mission ?? 'simultaneous-for-whom');

  useEffect(() => {
    onStateChange?.({ chapter: 'observer-lab', mission: activeMission, obs: observers[0]?.beta ?? 0, obs2: observers[1]?.beta ?? null, events: events.length > 0 ? events : null });
  }, [events, observers, activeMission, onStateChange]);

  const sceneState = { events, observers, showLightCones, showSlices };
  const status = evaluateMission(activeMission, sceneState);
  const selectedEvent = events.find(e => e.id === selectedId);

  const toSpacetimeFn = useCallback((px: number, py: number, W: number, H: number) =>
    toSpacetime(px, py, W, H, RANGE_X, RANGE_T, MARGINS), []);
  const findHit = useCallback((x: number, t: number): number => {
    const hitRadius = 0.5;
    for (let i = 0; i < events.length; i++) {
      const dx: number = events[i]!.x - x; const dt: number = events[i]!.t - t;
      if (Math.sqrt(dx * dx + dt * dt) < hitRadius) return i;
    }
    return -1;
  }, [events]);
  const onDrag = useCallback((index: number, x: number, t: number) => {
    setEvents(prev => prev.map((e, i) => i === index ? { ...e, x: Math.max(-RANGE_X, Math.min(RANGE_X, x)), t: Math.max(0, Math.min(RANGE_T, t)) } : e));
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const toP = (x: number, t: number) => toPixel(x, t, W, H, RANGE_X, RANGE_T, MARGINS);
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);
    drawAxes(ctx, toP, W, H, RANGE_X, RANGE_T, MARGINS);

    if (showLightCones && selectedEvent) drawLightCone(ctx, toP, selectedEvent, RANGE_T);

    if (showSlices) {
      observers.forEach((obs, i) => {
        drawSliceLine(ctx, toP, obs.beta, 5, RANGE_X, {
          color: OBSERVER_COLORS[i % OBSERVER_COLORS.length]!, lineWidth: 2, glow: i === 0,
          dash: i > 0 ? [6, 3] : null, label: `${obs.label} (v=${obs.beta.toFixed(2)}c)`,
        });
      });
    }

    events.forEach(event => {
      let evColor: string = colors.eventCyan;
      if (selectedEvent && event.id !== selectedId) {
        const rel = classifyRelation(selectedEvent, event);
        evColor = RELATION_COLORS[rel] ?? colors.eventCyan;
      }
      drawEvent(ctx, toP, event, { color: event.id === selectedId ? '#fff' : evColor, size: event.id === selectedId ? 7 : 5, selected: event.id === selectedId });
      if (selectedEvent && event.id !== selectedId) {
        const rel = classifyRelation(selectedEvent, event);
        const p = toP(event.x, event.t);
        ctx.fillStyle = (RELATION_COLORS[rel] ?? colors.eventCyan) + 'aa';
        ctx.font = `8px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(rel, p.px, p.py - 12);
      }
    });

    ctx.fillStyle = colors.textGhost; ctx.font = `9px ${MONO}`; ctx.textAlign = 'right';
    ctx.fillText(`${events.length}/8 events`, W - MARGINS.right - 4, H - 8);
  }, [events, observers, showLightCones, showSlices, selectedId, selectedEvent]);

  const canvasRef = useCanvas(draw);
  const { dragging } = useDragInteraction(canvasRef, toSpacetimeFn, findHit, onDrag, null);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging >= 0) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px: number = e.clientX - rect.left; const py: number = e.clientY - rect.top;
    const W: number = canvas.clientWidth; const H: number = canvas.clientHeight;

    for (const event of events) {
      const p = toPixel(event.x, event.t, W, H, RANGE_X, RANGE_T, MARGINS);
      if (Math.sqrt((px - p.px) ** 2 + (py - p.py) ** 2) < 15) {
        setSelectedId(prev => prev === event.id ? null : event.id);
        return;
      }
    }

    if (!isMobile && events.length < 8) {
      const coords = toSpacetime(px, py, W, H, RANGE_X, RANGE_T, MARGINS);
      if (coords.x >= -RANGE_X && coords.x <= RANGE_X && coords.t >= 0 && coords.t <= RANGE_T) {
        const label: string = String.fromCharCode(65 + events.length);
        const newEvent: SpacetimeEvent = { id: `evt-${label}-${Date.now()}`, x: Math.round(coords.x * 10) / 10, t: Math.round(coords.t * 10) / 10, label };
        setEvents(prev => [...prev, newEvent]);
      }
    }
  }, [events, canvasRef, dragging, isMobile]);

  const addObserver = (): void => {
    if (observers.length >= 4) return;
    const idx: number = observers.length;
    setObservers(prev => [...prev, { id: `obs-${idx}`, beta: 0, label: `Observer ${idx + 1}`, color: OBSERVER_COLORS[idx % OBSERVER_COLORS.length]! }]);
  };
  const removeObserver = (index: number): void => {
    if (observers.length <= 1) return;
    setObservers(prev => prev.filter((_, i) => i !== index));
  };
  const loadPreset = (preset: LabPreset): void => { setEvents(preset.events); setObservers(preset.observers); setSelectedId(null); };

  const missionDefs: MissionDefinition[] = missions.map(m => ({
    ...m,
    action: m.id === 'simultaneous-for-whom' ? () => loadPreset(presets[2]!) :
            m.id === 'causal-sandbox' ? () => loadPreset(presets[3]!) :
            m.id === 'share-scenario' ? () => {} : undefined,
  }));

  return (
    <ChapterShell
      controls={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {observers.map((obs, i) => (
            <div key={obs.id} style={{ position: 'relative' }}>
              <ObserverSlider label={obs.label} value={obs.beta}
                onChange={(v: number) => setObservers(prev => prev.map((o, j) => j === i ? { ...o, beta: v } : o))}
                color={OBSERVER_COLORS[i % OBSERVER_COLORS.length]!} />
              {observers.length > 1 && (
                <button onClick={() => removeObserver(i)}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: colors.textGhost, cursor: 'pointer', fontSize: 12, padding: 2 }}>
                  {'\u00d7'}
                </button>
              )}
            </div>
          ))}
          {observers.length < 4 && (
            <button onClick={addObserver}
              style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)', color: colors.textDim, cursor: 'pointer', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              + Add observer
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
              <input type="checkbox" checked={showSlices} onChange={() => setShowSlices(v => !v)} /> Show slices
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: colors.textDim, cursor: 'pointer' }}>
              <input type="checkbox" checked={showLightCones} onChange={() => setShowLightCones(v => !v)} /> Show light cones
            </label>
          </div>
          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', color: colors.textGhost, marginTop: 4 }}>Presets</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map(p => (
              <button key={p.name} onClick={() => loadPreset(p)}
                style={{ padding: '5px 8px', borderRadius: 999, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)', color: colors.textDim, cursor: 'pointer', fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {p.name}
              </button>
            ))}
          </div>
          {events.length > 0 && (
            <button onClick={() => { setEvents([]); setSelectedId(null); }}
              style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)', color: colors.textDim, cursor: 'pointer', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Clear events
            </button>
          )}
        </div>
      }
      canvas={
        <>
          <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
          <AriaLiveRegion message={`${events.length} events. ${observers.length} observers. Selected: ${selectedEvent?.label ?? 'none'}.`} />
        </>
      }
      mission={<GuidedMissionPanel accent={colors.observerC} missions={missionDefs} activeId={activeMission} onSelect={setActiveMission} status={status} />}
      callout={
        <CalloutPanel accent={colors.observerC} title="Observer Lab"
          body={isMobile ? 'Use presets to load scenarios. Adjust observer velocities to explore.' : 'Click the canvas to place events (up to 8). Drag to reposition. Add up to 4 observers.'}
          question="Can you construct a scenario that proves the point?"
          answer="Place two spacelike-separated events and two observers. Watch them disagree about which came first." />
      }
    />
  );
}
