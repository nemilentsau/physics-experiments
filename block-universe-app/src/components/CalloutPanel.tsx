import { DISPLAY, MONO, colors } from '../theme.ts';
import type { ReactNode } from 'react';

interface CalloutPanelProps {
  label?: string;
  accent?: string;
  badge?: ReactNode;
  title: string;
  body: ReactNode;
  question?: string;
  answer?: string;
}

export function CalloutPanel({
  label = 'Live read',
  accent = colors.sliceGold,
  badge,
  title,
  body,
  question,
  answer,
}: CalloutPanelProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${accent}25`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: accent,
            fontFamily: MONO,
          }}
        >
          {label}
        </div>
        {badge && <div style={{ marginLeft: 'auto' }}>{badge}</div>}
      </div>

      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 10,
          lineHeight: 1.65,
          color: colors.text,
          marginBottom: question ? 12 : 0,
        }}
      >
        {body}
      </div>

      {question && (
        <div
          style={{
            borderTop: `1px solid ${accent}15`,
            paddingTop: 10,
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: accent,
              marginBottom: 4,
              fontFamily: MONO,
            }}
          >
            Think about it
          </div>
          <div
            style={{
              fontSize: 10,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.72)',
              fontStyle: 'italic',
            }}
          >
            {question}
          </div>
          {answer && (
            <div
              style={{
                fontSize: 9.5,
                lineHeight: 1.55,
                color: colors.textDim,
                marginTop: 6,
              }}
            >
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
