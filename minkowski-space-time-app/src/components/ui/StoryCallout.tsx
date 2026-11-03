import { DISPLAY, MONO, colors } from '../../rendering/theme.js';

export function StoryCallout({
  label = 'Live read',
  accent = colors.lightCone,
  badge,
  title,
  body,
  question,
  answer,
}) {
  return (
    <div style={{
      background: `
        radial-gradient(circle at top right, ${accent}16, transparent 32%),
        linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))
      `,
      border: `1px solid ${accent}30`,
      borderRadius: 18,
      padding: 16,
      boxShadow: `0 14px 34px ${accent}10`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0, flex: '1 1 360px' }}>
          <div style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: accent,
            marginBottom: 8,
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: 24,
            color: '#fff',
            fontStyle: 'italic',
            lineHeight: 1.1,
            marginBottom: 10,
          }}>
            {title}
          </div>
        </div>

        {badge && (
          <div style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: `1px solid ${accent}35`,
            background: `${accent}14`,
            color: '#fff',
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {badge}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.7)' }}>
        {body}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        marginTop: 16,
      }}>
        <div style={{
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 14,
          background: 'rgba(7,7,12,0.36)',
          padding: 12,
        }}>
          <div style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: colors.textGhost,
            marginBottom: 6,
          }}>
            Central question
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.7, color: '#f3eee7' }}>
            {question}
          </div>
        </div>

        <div style={{
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 14,
          background: 'rgba(7,7,12,0.36)',
          padding: 12,
        }}>
          <div style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: colors.textGhost,
            marginBottom: 6,
          }}>
            Clear answer
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.7, color: colors.textDim }}>
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}
