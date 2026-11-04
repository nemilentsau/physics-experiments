import { useState, useRef, useCallback, useEffect } from 'react';

// Animation hook with play/pause/scrub support
export function useAnimationLoop(duration: number = 6000) {
  const [progress, setProgress] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number | null>(null);

  const play = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
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
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
    setProgress(1.0);
  }, []);

  const scrub = useCallback((value: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
    setProgress(value);
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return { progress, isPlaying, play, pause, reset, scrub };
}
