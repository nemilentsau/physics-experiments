import React from 'react';
import { colors } from '../../rendering/theme.ts';

export interface PanelProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
}

export function Panel({ title, children, style, titleStyle }: PanelProps) {
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
