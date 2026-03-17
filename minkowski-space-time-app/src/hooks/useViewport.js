import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getSnapshot() {
  if (typeof window === 'undefined') return 1440;
  return window.innerWidth;
}

export function useViewport() {
  const width = useSyncExternalStore(subscribe, getSnapshot, () => 1440);
  return {
    width,
    isMobile: width < 720,
    isTablet: width < 1080,
    isCompact: width < 900,
  };
}
