import { useSyncExternalStore } from 'react';
import type { ViewportInfo } from '../types.ts';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getSnapshot(): number {
  if (typeof window === 'undefined') return 1440;
  return window.innerWidth;
}

export function useViewport(): ViewportInfo {
  const width = useSyncExternalStore(subscribe, getSnapshot, () => 1440);
  return { width, isMobile: width < 720, isTablet: width < 1080, isCompact: width < 900 };
}
