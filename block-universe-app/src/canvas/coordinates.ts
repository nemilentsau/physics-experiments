import type { PixelCoord, SpacetimeCoord, Margins } from '../types.ts';

const DEFAULT_MARGINS: Margins = { top: 30, bottom: 40, left: 50, right: 30 };

export function toPixel(
  x: number, t: number, W: number, H: number,
  rangeX = 8, rangeT = 10, margins: Margins = DEFAULT_MARGINS,
): PixelCoord {
  const pW = W - margins.left - margins.right;
  const pH = H - margins.top - margins.bottom;
  return {
    px: margins.left + ((x + rangeX) / (2 * rangeX)) * pW,
    py: H - margins.bottom - (t / rangeT) * pH,
  };
}

export function toSpacetime(
  px: number, py: number, W: number, H: number,
  rangeX = 8, rangeT = 10, margins: Margins = DEFAULT_MARGINS,
): SpacetimeCoord {
  const pW = W - margins.left - margins.right;
  const pH = H - margins.top - margins.bottom;
  return {
    x: ((px - margins.left) / pW) * 2 * rangeX - rangeX,
    t: ((H - margins.bottom - py) / pH) * rangeT,
  };
}

function clampPercent(value: number): number {
  return Math.max(4, Math.min(96, value));
}

export function toCanvasPercent(
  x: number, t: number, rangeX = 8, rangeT = 10,
): { left: number; top: number } {
  return {
    left: clampPercent(((x + rangeX) / (2 * rangeX)) * 100),
    top: clampPercent(100 - (t / rangeT) * 100),
  };
}
