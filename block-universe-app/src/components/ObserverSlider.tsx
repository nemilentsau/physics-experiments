import { MONO, colors } from '../theme.ts';
import { gamma } from '../physics/lorentz.ts';

interface ObserverSliderProps {
  label?: string;
  value?: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  showGamma?: boolean;
}

export function ObserverSlider({
  label = 'Observer',
  value = 0,
  onChange,
  min = -0.95,
  max = 0.95,
  step = 0.01,
  color = colors.observerA,
  showGamma = true,
}: ObserverSliderProps) {
  const g = gamma(value);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color,
          }}
        >
          {label}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#fff' }}>
          v = {value.toFixed(2)}c
          {showGamma && (
            <span style={{ color: colors.textDim, marginLeft: 6 }}>
              {'\u03b3'} = {g.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 8,
          color: colors.textGhost,
          marginTop: 4,
        }}
      >
        <span>{min}c</span>
        <span>rest</span>
        <span>{max}c</span>
      </div>
    </div>
  );
}
