import { colors } from '../../rendering/theme.js';

export function Panel({ title, children, style, titleStyle }) {
  return (
    <div style={{
      background: colors.panelBg,
      border: `1px solid ${colors.border}`,
      borderRadius: 6,
      padding: 14,
      ...style,
    }}>
      {title && (
        <div style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: colors.textFaint,
          marginBottom: 10,
          ...titleStyle,
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
