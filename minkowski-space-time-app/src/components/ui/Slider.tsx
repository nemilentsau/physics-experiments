import React from 'react';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  color?: string;
  suffix?: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  color = '#ff6b4a',
  suffix = '',
  labelStyle,
  style,
}: SliderProps) {
  return (
    <div style={{ marginBottom: 10, ...style }}>
      <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2, ...labelStyle }}>
        {label}{suffix}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
    </div>
  );
}
