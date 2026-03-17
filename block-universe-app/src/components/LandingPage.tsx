import { useState } from 'react';
import { DISPLAY, MONO, colors } from '../theme.ts';
import type { ChapterDefinition } from '../types.ts';

interface LandingPageProps {
  chapters: readonly ChapterDefinition[];
  onSelect: (id: string) => void;
  isCompact: boolean;
  isMobile: boolean;
}

interface ChapterCardProps {
  chapter: ChapterDefinition;
  index: number;
  onSelect: (id: string) => void;
  hovered: boolean;
  onHover: (id: string | null) => void;
  isCompact: boolean;
}

function ChapterCard({
  chapter,
  index: _index,
  onSelect,
  hovered,
  onHover,
  isCompact,
}: ChapterCardProps) {
  return (
    <button
      onClick={() => onSelect(chapter.id)}
      onMouseEnter={() => onHover(chapter.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: isCompact ? '14px 16px' : '18px 20px',
        borderRadius: 16,
        border: `1px solid ${hovered ? chapter.color + '50' : colors.border}`,
        background: hovered
          ? `linear-gradient(180deg, ${chapter.color}08, ${chapter.color}03)`
          : 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: isCompact ? 18 : 22 }}>{chapter.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: chapter.color,
              fontFamily: MONO,
              marginBottom: 2,
            }}
          >
            {chapter.chapter}
          </div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: isCompact ? 14 : 16,
              fontWeight: 600,
              color: '#fff',
              lineHeight: 1.25,
            }}
          >
            {chapter.title}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 9.5,
          lineHeight: 1.55,
          color: colors.textDim,
        }}
      >
        {chapter.subtitle}
      </div>
      <div
        style={{
          fontSize: 9,
          lineHeight: 1.55,
          color: colors.textGhost,
        }}
      >
        {chapter.description}
      </div>
    </button>
  );
}

export function LandingPage({
  chapters,
  onSelect,
  isCompact,
  isMobile,
}: LandingPageProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: isMobile ? '24px 16px' : '48px 24px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 40 }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: isMobile ? 26 : 36,
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          The Block Universe
        </div>
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.7,
            color: colors.textDim,
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          An interactive exploration of spacetime, simultaneity, and the geometry of special
          relativity. Each chapter builds on the last.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isCompact ? '1fr' : '1fr 1fr',
          gap: 12,
        }}
      >
        {chapters.map((ch, i) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            index={i}
            onSelect={onSelect}
            hovered={hoveredId === ch.id}
            onHover={setHoveredId}
            isCompact={isCompact}
          />
        ))}
      </div>
    </div>
  );
}
