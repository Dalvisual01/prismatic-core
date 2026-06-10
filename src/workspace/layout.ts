import type { PanelId, PanelSize, PixelPosition } from "./types"
import { windowMargin } from "./snap"

export type PanelLayoutEntry = {
  id: PanelId
  size: PanelSize
}

/**
 * Place panels in a simple top-to-bottom, left-to-right grid within margins.
 * Apps can provide custom layout functions for domain-specific arrangements.
 */
export function createGridLayout(
  panels: PanelLayoutEntry[],
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920,
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080,
  gap = 16,
): Record<PanelId, PixelPosition> {
  const margin = windowMargin()
  const positions: Record<PanelId, PixelPosition> = {}
  let x = margin
  let y = margin
  let rowHeight = 0

  for (const panel of panels) {
    if (x + panel.size.width > viewportWidth - margin) {
      x = margin
      y += rowHeight + gap
      rowHeight = 0
    }

    positions[panel.id] = { x, y }
    x += panel.size.width + gap
    rowHeight = Math.max(rowHeight, panel.size.height)
  }

  return positions
}

export function mergePanelSizes(
  sizes: Record<PanelId, PanelSize>,
  overrides: Partial<Record<PanelId, PanelSize>>,
): Record<PanelId, PanelSize> {
  const merged = { ...sizes }
  for (const [id, size] of Object.entries(overrides)) {
    if (size) merged[id] = size
  }
  return merged
}
