export const CANVAS_RESOLUTION_SCALES = [1, 0.5, 0.25] as const

export type CanvasResolutionScale = (typeof CANVAS_RESOLUTION_SCALES)[number]

export type CanvasResolutionSize = {
  scale: CanvasResolutionScale
  logicalWidth: number
  logicalHeight: number
  pixelWidth: number
  pixelHeight: number
}

export const DEFAULT_CANVAS_RESOLUTION_SCALE: CanvasResolutionScale = 1

export function clampCanvasResolutionScale(
  scale: number | undefined,
): CanvasResolutionScale {
  if (scale == null || !Number.isFinite(scale)) return DEFAULT_CANVAS_RESOLUTION_SCALE

  return CANVAS_RESOLUTION_SCALES.reduce((closest, candidate) =>
    Math.abs(candidate - scale) < Math.abs(closest - scale) ? candidate : closest,
  )
}

export function resolveCanvasResolutionSize(
  logicalWidth: number,
  logicalHeight: number,
  scale: CanvasResolutionScale,
): CanvasResolutionSize {
  return {
    scale,
    logicalWidth,
    logicalHeight,
    pixelWidth: Math.max(1, Math.round(logicalWidth * scale)),
    pixelHeight: Math.max(1, Math.round(logicalHeight * scale)),
  }
}

export function formatCanvasResolutionScale(scale: CanvasResolutionScale) {
  if (scale === 1) return "full"
  if (scale === 0.5) return "half"
  return "quarter"
}
