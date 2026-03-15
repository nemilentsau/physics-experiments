import { useRef, useEffect } from 'react';
import { DISPLAY } from '../../rendering/theme.js';

export function ProperTimeClock({ tau, maxTau, color, label, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    // Clock face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = color + '33';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.strokeStyle = color + '15';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Tick marks
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const inner = i % 3 === 0 ? r - 12 : r - 7;
      const outer = r - 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = i % 3 === 0 ? color + '80' : color + '30';
      ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Hand
    const frac = tau / Math.max(maxTau, 0.01);
    const angle = frac * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (r - 18), cy + Math.sin(angle) * (r - 18));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [tau, maxTau, color, size]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div style={{ fontSize: 10, color: color + '99', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 26, color, marginTop: 2, fontWeight: 600 }}>
        {tau.toFixed(2)}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>years elapsed</div>
    </div>
  );
}
