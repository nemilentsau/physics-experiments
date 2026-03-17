import type {
  SpacetimeEvent, WorldlinePoint, WorldTube, ToPixelFn, Margins,
  SliceLineOptions, EventDrawOptions, LightConeDrawOptions,
  WorldLineDrawOptions, WorldTubeDrawOptions,
} from '../types.ts';
import { MONO } from '../theme.ts';
import { colors } from '../theme.ts';
import { lightConeBounds } from '../physics/foliation.ts';

export function drawGrid(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  W: number, H: number, rangeX: number, rangeT: number, margins: Margins,
): void {
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let t = 0; t <= rangeT; t++) {
    const { py } = toP(0, t);
    ctx.beginPath();
    ctx.moveTo(margins.left, py);
    ctx.lineTo(W - margins.right, py);
    ctx.stroke();
  }
  for (let x = -rangeX; x <= rangeX; x++) {
    const { px } = toP(x, 0);
    ctx.beginPath();
    ctx.moveTo(px, margins.top);
    ctx.lineTo(px, H - margins.bottom);
    ctx.stroke();
  }
}

export function drawAxes(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  _W: number, _H: number, rangeX: number, rangeT: number, _margins: Margins,
): void {
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1;
  const o = toP(0, 0);
  const top = toP(0, rangeT);
  ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(top.px, top.py); ctx.stroke();
  const left = toP(-rangeX, 0);
  const right = toP(rangeX, 0);
  ctx.beginPath(); ctx.moveTo(left.px, o.py); ctx.lineTo(right.px, o.py); ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `9px ${MONO}`;
  ctx.textAlign = 'center';
  for (let t = 1; t <= rangeT; t++) {
    const p = toP(0, t);
    ctx.fillText(String(t), p.px - 20, p.py + 3);
  }
  for (let x = -rangeX; x <= rangeX; x++) {
    if (x === 0) continue;
    const p = toP(x, 0);
    ctx.fillText(String(x), p.px, p.py + 16);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = `10px ${MONO}`;
  ctx.fillText('x', toP(rangeX, 0).px + 12, o.py + 4);
  ctx.save();
  ctx.translate(toP(0, rangeT).px - 16, toP(0, rangeT).py);
  ctx.fillText('t', 0, 0);
  ctx.restore();
}

export function drawLightCone(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  event: SpacetimeEvent, rangeT: number,
  opts: LightConeDrawOptions = {},
): void {
  const { color = colors.lightCone, fillOpacity = 0.08, strokeOpacity = 0.35 } = opts;
  const ep = toP(event.x, event.t);

  const futureBounds = lightConeBounds(event, rangeT);
  const fl = toP(futureBounds.xLeft, rangeT);
  const fr = toP(futureBounds.xRight, rangeT);

  ctx.fillStyle = color + Math.round(fillOpacity * 255).toString(16).padStart(2, '0');
  ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(fl.px, fl.py); ctx.lineTo(fr.px, fr.py); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = color + Math.round(strokeOpacity * 255).toString(16).padStart(2, '0');
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(fl.px, fl.py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(fr.px, fr.py); ctx.stroke();

  const pastBounds = lightConeBounds(event, 0);
  const pl = toP(pastBounds.xLeft, 0);
  const pr = toP(pastBounds.xRight, 0);

  ctx.fillStyle = color + Math.round(fillOpacity * 0.5 * 255).toString(16).padStart(2, '0');
  ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(pl.px, pl.py); ctx.lineTo(pr.px, pr.py); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(pl.px, pl.py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ep.px, ep.py); ctx.lineTo(pr.px, pr.py); ctx.stroke();
  ctx.setLineDash([]);
}

export function drawSliceLine(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  beta: number, tPrime: number, rangeX: number,
  options: SliceLineOptions = {},
): void {
  const { color = colors.sliceGold, lineWidth = 2, glow = true, dash = null, label = null } = options;
  const g = 1 / Math.sqrt(1 - beta * beta);
  const intercept = g * tPrime;
  const left = toP(-rangeX, intercept + beta * (-rangeX));
  const right = toP(rangeX, intercept + beta * rangeX);

  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(left.px, left.py); ctx.lineTo(right.px, right.py); ctx.stroke();
  ctx.shadowBlur = 0;
  if (dash) ctx.setLineDash([]);

  if (label) {
    ctx.fillStyle = color;
    ctx.font = `9px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, right.px + 4, right.py - 4);
  }
}

export function drawEvent(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  event: SpacetimeEvent, opts: EventDrawOptions = {},
): void {
  const { color = colors.eventCyan, size = 5, selected = false, hovered = false, showLabel = true } = opts;
  const p = toP(event.x, event.t);
  const r = selected ? 7 : hovered ? 6 : size;

  if (selected || hovered) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  if (selected) {
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.px, p.py, r + 4, 0, Math.PI * 2); ctx.stroke();
  }

  if (showLabel && event.label) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `bold 11px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText(event.label, p.px + r + 5, p.py + 4);
  }
}

export function drawWorldLine(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  worldLine: readonly WorldlinePoint[], opts: WorldLineDrawOptions = {},
): void {
  if (worldLine.length < 2) return;
  const { color = colors.worldline, lineWidth = 2, dash = null } = opts;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  const start = toP(worldLine[0]!.x, worldLine[0]!.t);
  ctx.moveTo(start.px, start.py);
  for (let i = 1; i < worldLine.length; i++) {
    const p = toP(worldLine[i]!.x, worldLine[i]!.t);
    ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
}

export function drawWorldTube(
  ctx: CanvasRenderingContext2D, toP: ToPixelFn,
  tube: WorldTube, opts: WorldTubeDrawOptions = {},
): void {
  if (!tube.left || !tube.right || tube.left.length < 2) return;
  const { color = colors.worldtube, borderColor = colors.worldline, borderWidth = 1 } = opts;

  ctx.fillStyle = color;
  ctx.beginPath();
  const l0 = toP(tube.left[0]!.x, tube.left[0]!.t);
  ctx.moveTo(l0.px, l0.py);
  for (let i = 1; i < tube.left.length; i++) {
    const p = toP(tube.left[i]!.x, tube.left[i]!.t);
    ctx.lineTo(p.px, p.py);
  }
  for (let i = tube.right.length - 1; i >= 0; i--) {
    const p = toP(tube.right[i]!.x, tube.right[i]!.t);
    ctx.lineTo(p.px, p.py);
  }
  ctx.closePath();
  ctx.fill();

  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    const bl0 = toP(tube.left[0]!.x, tube.left[0]!.t);
    ctx.moveTo(bl0.px, bl0.py);
    for (let i = 1; i < tube.left.length; i++) {
      const p = toP(tube.left[i]!.x, tube.left[i]!.t);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.beginPath();
    const br0 = toP(tube.right[0]!.x, tube.right[0]!.t);
    ctx.moveTo(br0.px, br0.py);
    for (let i = 1; i < tube.right.length; i++) {
      const p = toP(tube.right[i]!.x, tube.right[i]!.t);
      ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }
}
