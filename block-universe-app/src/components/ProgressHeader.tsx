import { colors } from '../theme.ts';
import type { ChapterDefinition } from '../types.ts';

interface ProgressHeaderProps {
  chapters: readonly ChapterDefinition[];
  currentIndex: number;
}

export function ProgressHeader({ chapters, currentIndex }: ProgressHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
      {chapters.map((ch, i) => (
        <div
          key={ch.id}
          style={{
            flex: 1,
            minWidth: 0,
            height: 6,
            borderRadius: 999,
            background:
              i <= currentIndex ? (ch.color ?? colors.sliceGold) : 'rgba(255,255,255,0.06)',
            opacity: i === currentIndex ? 1 : 0.6,
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}
