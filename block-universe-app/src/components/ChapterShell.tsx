import type { ReactNode } from 'react';
import { useViewport } from '../hooks/useViewport.ts';
import { MONO, colors } from '../theme.ts';

interface ChapterShellProps {
  controls: ReactNode;
  canvas: ReactNode;
  callout?: ReactNode;
  mission?: ReactNode;
  annotations?: ReactNode;
  canvasHeight?: number;
}

export function ChapterShell({
  controls,
  canvas,
  callout,
  mission,
  annotations,
  canvasHeight,
}: ChapterShellProps) {
  const { isMobile, isCompact } = useViewport();

  const sidebarWidth = isCompact ? 260 : 300;

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: MONO }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: canvasHeight ?? 320,
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          {canvas}
          {annotations}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {controls}
        </div>
        {callout}
        {mission}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        fontFamily: MONO,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: canvasHeight ?? 420,
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          {canvas}
          {annotations}
        </div>
      </div>
      <div
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {controls}
        {callout}
        {mission}
      </div>
    </div>
  );
}
