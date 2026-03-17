import { useState, useCallback, useRef, useEffect } from 'react';
import type { SpacetimeCoord } from '../types.ts';

type ToSpacetimeFn = (px: number, py: number, W: number, H: number) => SpacetimeCoord;
type FindHitFn = (x: number, t: number) => number;
type OnDragFn = (index: number, x: number, t: number) => void;
type OnDragEndFn = (index: number) => void;

export function useDragInteraction(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  toSpacetimeFn: ToSpacetimeFn,
  findHit: FindHitFn,
  onDrag: OnDragFn,
  onDragEnd: OnDragEndFn | null,
): { dragging: number; hovering: number } {
  const [dragging, setDragging] = useState(-1);
  const [hovering, setHovering] = useState(-1);
  const dragRef = useRef(-1);

  const getCoords = useCallback((e: PointerEvent): SpacetimeCoord | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return toSpacetimeFn(px, py, canvas.clientWidth, canvas.clientHeight);
  }, [canvasRef, toSpacetimeFn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      const coords = getCoords(e);
      if (!coords) return;
      const hit = findHit(coords.x, coords.t);
      if (hit >= 0) {
        dragRef.current = hit;
        setDragging(hit);
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const coords = getCoords(e);
      if (!coords) return;
      if (dragRef.current >= 0) {
        onDrag(dragRef.current, coords.x, coords.t);
      } else {
        const hit = findHit(coords.x, coords.t);
        setHovering(hit);
        canvas.style.cursor = hit >= 0 ? 'grab' : 'crosshair';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragRef.current >= 0) {
        if (onDragEnd) onDragEnd(dragRef.current);
        canvas.releasePointerCapture(e.pointerId);
        dragRef.current = -1;
        setDragging(-1);
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [canvasRef, getCoords, findHit, onDrag, onDragEnd]);

  return { dragging, hovering };
}
