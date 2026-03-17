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
}) {
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
