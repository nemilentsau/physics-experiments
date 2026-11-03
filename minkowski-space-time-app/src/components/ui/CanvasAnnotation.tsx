export function CanvasAnnotation({
  left,
  top,
  accent,
  title,
  body,
  align = 'left',
  compact = false,
}) {
  return (
    <div style={{
      position: 'absolute',
      left: `${left}%`,
      top: `${top}%`,
      transform: `translate(${align === 'right' ? '-100%' : '-10%'}, -50%)`,
      pointerEvents: 'none',
      zIndex: 3,
      maxWidth: compact ? 160 : 210,
    }}>
      <div style={{
        width: compact ? 10 : 12,
        height: compact ? 10 : 12,
        borderRadius: '50%',
        background: accent,
        boxShadow: `0 0 0 6px ${accent}22`,
        marginLeft: align === 'right' ? 'auto' : 0,
        marginBottom: 8,
      }}
      />
      <div style={{
        borderRadius: 14,
        border: `1px solid ${accent}35`,
        background: 'rgba(7,7,12,0.84)',
        backdropFilter: 'blur(8px)',
        padding: compact ? '8px 10px' : '10px 12px',
        textAlign: align,
      }}>
        <div style={{
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: accent,
          marginBottom: 4,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: compact ? 9 : 9.5,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.72)',
        }}>
          {body}
        </div>
      </div>
    </div>
  );
}
