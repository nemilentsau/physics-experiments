import { useState, useCallback, useRef, useEffect } from 'react';

// Canvas drag interaction: pixel coords ↔ spacetime coords
// toSpacetime(px, py, W, H) → {x, t}
// findHit(x, t, items) → index or -1
export function useDragInteraction(canvasRef, toSpacetime, findHit, onDrag, onDragEnd) {
  const [dragging, setDragging] = useState(-1);
  const [hovering, setHovering] = useState(-1);
  const dragRef = useRef(-1);

  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    return toSpacetime(px, py, W, H);
  }, [canvasRef, toSpacetime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e) => {
      const coords = getCoords(e);
      if (!coords) return;
      const hit = findHit(coords.x, coords.t);
      if (hit >= 0) {
        dragRef.current = hit;
        setDragging(hit);
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
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

    const handleMouseUp = () => {
      if (dragRef.current >= 0) {
        if (onDragEnd) onDragEnd(dragRef.current);
        dragRef.current = -1;
        setDragging(-1);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, getCoords, findHit, onDrag, onDragEnd]);

  return { dragging, hovering };
}
