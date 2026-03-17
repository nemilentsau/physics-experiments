import { useRef, useEffect } from 'react';

type DrawFn = (ctx: CanvasRenderingContext2D, W: number, H: number) => void;

export function useCanvas(draw: DrawFn): React.RefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      draw(ctx, W, H);
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return ref;
}
