import { MONO } from '../../rendering/theme.js';

export function RateMeter({ rate, color, height = 180 }) {
  const fillH = rate * (height - 20);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>dτ/dt</div>
      <div style={{
        width: 28, height,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}22`,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: fillH,
          background: `linear-gradient(to top, ${color}44, ${color}18)`,
          borderTop: `2px solid ${color}`,
          transition: 'height 0.08s ease-out',
        }} />
        <div style={{
          position: 'absolute', top: 10, left: 0, right: 0,
          borderTop: '1px dashed rgba(255,255,255,0.15)',
        }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 13, color, fontWeight: 600 }}>
        {rate.toFixed(3)}
      </div>
    </div>
  );
}
