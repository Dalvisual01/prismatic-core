import {
  collectWorkspaceSnapLines,
  isSnapParticipant,
  snapScalar,
  snapThreshold,
  windowMargin,
  type Viewport,
} from "./snap"
import type { PanelId, PanelRect, PanelSize, PixelPosition } from "./types"

export function getCanvasScreenRect(
  pan: PixelPosition,
  zoom: number,
  size: PanelSize,
  viewport: Viewport,
): PanelRect {
  const cx = viewport.width / 2
  const cy = viewport.height / 2
  const width = size.width * zoom
  const height = size.height * zoom

  return {
    x: cx + pan.x - width / 2,
    y: cy + pan.y - height / 2,
    width,
    height,
  }
}

function panTargetsForLines(
  lines: number[],
  center: number,
  halfExtent: number,
): number[] {
  const targets: number[] = []
  for (const line of lines) {
    targets.push(line - center + halfExtent)
    targets.push(line - center - halfExtent)
  }
  return targets
}

function findMatchedTarget(value: number, targets: number[], threshold: number) {
  let best = value
  let bestDist = threshold + 1

  for (const target of targets) {
    const dist = Math.abs(value - target)
    if (dist < bestDist) {
      bestDist = dist
      best = target
    }
  }

  return bestDist <= threshold ? best : null
}

export function collectCanvasPanSnapTargets(
  zoom: number,
  canvasSize: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
) {
  const { x: xLines, y: yLines } = collectWorkspaceSnapLines(
    positions,
    sizes,
    viewport,
  )
  const cx = viewport.width / 2
  const cy = viewport.height / 2
  const halfW = (canvasSize.width * zoom) / 2
  const halfH = (canvasSize.height * zoom) / 2

  return {
    xLines,
    yLines,
    x: panTargetsForLines(xLines, cx, halfW),
    y: panTargetsForLines(yLines, cy, halfH),
  }
}

export function snapCanvasPan(
  pan: PixelPosition,
  zoom: number,
  canvasSize: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): PixelPosition {
  const threshold = snapThreshold()
  const { x: xTargets, y: yTargets } = collectCanvasPanSnapTargets(
    zoom,
    canvasSize,
    positions,
    sizes,
    viewport,
  )

  return {
    x: snapScalar(pan.x, xTargets, threshold),
    y: snapScalar(pan.y, yTargets, threshold),
  }
}

export function getActiveCanvasSnapLines(
  rawPan: PixelPosition,
  snappedPan: PixelPosition,
  zoom: number,
  canvasSize: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): { x: number | null; y: number | null } {
  const threshold = snapThreshold()
  const { x: xTargets, y: yTargets, xLines, yLines } =
    collectCanvasPanSnapTargets(
      zoom,
      canvasSize,
      positions,
      sizes,
      viewport,
    )

  const cx = viewport.width / 2
  const cy = viewport.height / 2
  const halfW = (canvasSize.width * zoom) / 2
  const halfH = (canvasSize.height * zoom) / 2

  let visualX: number | null = null
  if (snappedPan.x !== rawPan.x) {
    const matched = findMatchedTarget(snappedPan.x, xTargets, threshold)
    if (matched !== null) {
      for (const line of xLines) {
        if (
          Math.abs(matched - (line - cx + halfW)) < 0.5 ||
          Math.abs(matched - (line - cx - halfW)) < 0.5
        ) {
          visualX = line
          break
        }
      }
    }
  }

  let visualY: number | null = null
  if (snappedPan.y !== rawPan.y) {
    const matched = findMatchedTarget(snappedPan.y, yTargets, threshold)
    if (matched !== null) {
      for (const line of yLines) {
        if (
          Math.abs(matched - (line - cy + halfH)) < 0.5 ||
          Math.abs(matched - (line - cy - halfH)) < 0.5
        ) {
          visualY = line
          break
        }
      }
    }
  }

  return { x: visualX, y: visualY }
}

export function getCanvasSnapTargetIds(
  rawPan: PixelPosition,
  snappedPan: PixelPosition,
  zoom: number,
  canvasSize: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): PanelId[] {
  const margin = windowMargin()
  const activeLines = getActiveCanvasSnapLines(
    rawPan,
    snappedPan,
    zoom,
    canvasSize,
    positions,
    sizes,
    viewport,
  )
  const ids = new Set<PanelId>()

  if (activeLines.x !== null) {
    const line = activeLines.x
    if (
      Math.abs(line - margin) > 0.5 &&
      Math.abs(line - (viewport.width - margin)) > 0.5
    ) {
      for (const id of Object.keys(positions)) {
        if (!isSnapParticipant(id)) continue

        const other = positions[id]
        const otherSize = sizes[id]
        if (
          Math.abs(other.x - line) < 0.5 ||
          Math.abs(other.x + otherSize.width - line) < 0.5
        ) {
          ids.add(id)
        }
      }
    }
  }

  if (activeLines.y !== null) {
    const line = activeLines.y
    if (
      Math.abs(line - margin) > 0.5 &&
      Math.abs(line - (viewport.height - margin)) > 0.5
    ) {
      for (const id of Object.keys(positions)) {
        if (!isSnapParticipant(id)) continue

        const other = positions[id]
        const otherSize = sizes[id]
        if (
          Math.abs(other.y - line) < 0.5 ||
          Math.abs(other.y + otherSize.height - line) < 0.5
        ) {
          ids.add(id)
        }
      }
    }
  }

  return [...ids]
}
