import { useState, useRef, useCallback, useEffect } from 'react';
import type { AnimationLoopResult } from '../types.ts';

export function useAnimationLoop(duration = 6000): AnimationLoopResult {
  const [progress, setProgress] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number | null>(null);

  const play = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    setIsPlaying(true);
    setProgress(0);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setProgress(p);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
      else setIsPlaying(false);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [duration]);

  const pause = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
    setProgress(1.0);
  }, []);

  const scrub = useCallback((value: number) => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
    setProgress(value);
  }, []);

  useEffect(() => {
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, []);

  return { progress, isPlaying, play, pause, reset, scrub };
}

export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t) * (1 - t);
}
