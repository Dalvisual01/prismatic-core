import { getRuntimeConfig } from "../config"
import { layoutGap } from "./modules"
import type { PanelId, PanelSize, PixelPosition } from "./types"

export function windowMargin() {
  return getRuntimeConfig().workspace.margin
}

export function snapThreshold() {
  return getRuntimeConfig().workspace.snapThreshold
}

export function uiCollisionGap() {
  return getRuntimeConfig().workspace.collisionGap
}

/** @deprecated Use windowMargin() */
export const WINDOW_MARGIN = 20

/** @deprecated Use snapThreshold() */
export const SNAP_THRESHOLD = 12

/** @deprecated Use uiCollisionGap() */
export const UI_COLLISION_GAP = 4

export function isSnapParticipant(id: PanelId) {
  return !getRuntimeConfig().workspace.snapExcludedPanelIds.has(id)
}

type UiRect = PixelPosition & PanelSize

function toUiRect(pos: PixelPosition, size: PanelSize): UiRect {
  return { x: pos.x, y: pos.y, width: size.width, height: size.height }
}

function uiRectsOverlap(a: UiRect, b: UiRect, gap = 0): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  )
}

function minSeparation(a: UiRect, b: UiRect, gap: number): { dx: number; dy: number } {
  const pushLeft = a.x + a.width + gap - b.x
  const pushRight = b.x + b.width + gap - a.x
  const pushUp = a.y + a.height + gap - b.y
  const pushDown = b.y + b.height + gap - a.y

  const candidates = [
    { dx: -pushLeft, dy: 0, cost: pushLeft },
    { dx: pushRight, dy: 0, cost: pushRight },
    { dx: 0, dy: -pushUp, cost: pushUp },
    { dx: 0, dy: pushDown, cost: pushDown },
  ].filter((candidate) => candidate.cost > 0)

  if (candidates.length === 0) return { dx: 0, dy: 0 }

  const best = candidates.reduce((min, candidate) =>
    candidate.cost < min.cost ? candidate : min,
  )

  return { dx: best.dx, dy: best.dy }
}

export function isUiPositionClear(
  draggedId: PanelId,
  position: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  gap = uiCollisionGap(),
): boolean {
  const self = toUiRect(position, size)

  for (const id of Object.keys(positions)) {
    if (id === draggedId) continue
    if (uiRectsOverlap(self, toUiRect(positions[id], sizes[id]), gap)) {
      return false
    }
  }

  return true
}

function resolveCollisions(
  draggedId: PanelId,
  position: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
  gap = uiCollisionGap(),
): PixelPosition {
  let pos = { ...position }
  const margin = windowMargin()

  for (let pass = 0; pass < 12; pass++) {
    let adjusted = false
    let self = toUiRect(pos, size)

    for (const id of Object.keys(positions)) {
      if (id === draggedId) continue

      const obstacle = toUiRect(positions[id], sizes[id])
      if (!uiRectsOverlap(self, obstacle, gap)) continue

      const { dx, dy } = minSeparation(self, obstacle, gap)
      pos.x += dx
      pos.y += dy
      self = toUiRect(pos, size)
      adjusted = true
    }

    pos = clampToWorkspaceBounds(pos, size, viewport)

    if (!adjusted) break
  }

  return pos
}

export type Viewport = {
  width: number
  height: number
}

export function snapScalar(value: number, targets: number[], threshold: number): number {
  let best = value
  let bestDist = threshold + 1

  for (const target of targets) {
    const dist = Math.abs(value - target)
    if (dist < bestDist) {
      bestDist = dist
      best = target
    }
  }

  return bestDist <= threshold ? best : value
}

export type SnapGuides = {
  x: number[]
  y: number[]
}

export type VisualSnapGuides = {
  x: number[]
  y: number[]
}

export type DistributionGuide = {
  axis: "x" | "y"
  cross: number
  gapA: { from: number; to: number }
  gapB: { from: number; to: number }
}

type DistributionBoundary = {
  edge: number
  cross: number
}

function clampScalar(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clampToWorkspaceBounds(
  position: PixelPosition,
  size: PanelSize,
  viewport: Viewport,
): PixelPosition {
  const margin = windowMargin()
  const maxX = viewport.width - margin - size.width
  const maxY = viewport.height - margin - size.height

  return {
    x: clampScalar(position.x, margin, Math.max(margin, maxX)),
    y: clampScalar(position.y, margin, Math.max(margin, maxY)),
  }
}

export function isSnappedToTopMargin(y: number) {
  return Math.abs(y - windowMargin()) <= snapThreshold()
}

export function getWindowMarginRect(viewport: Viewport) {
  const margin = windowMargin()
  return {
    left: margin,
    top: margin,
    right: viewport.width - margin,
    bottom: viewport.height - margin,
    width: viewport.width - margin * 2,
    height: viewport.height - margin * 2,
  }
}

export function collectSnapTargets(
  draggedId: PanelId,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): SnapGuides {
  const margin = windowMargin()
  const gap = layoutGap()
  const { width: w, height: h } = size

  const xTargets = [margin, viewport.width - margin - w]
  const yTargets = [margin, viewport.height - margin - h]

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const o = positions[id]
    const os = sizes[id]
    const oRight = o.x + os.width
    const oBottom = o.y + os.height

    xTargets.push(o.x, oRight - w, oRight + gap, o.x - w - gap)
    yTargets.push(o.y, oBottom - h, oBottom + gap, o.y - h - gap)
  }

  return { x: xTargets, y: yTargets }
}

export function collectWorkspaceSnapLines(
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): VisualSnapGuides {
  const margin = windowMargin()
  const xLines = [margin, viewport.width - margin]
  const yLines = [margin, viewport.height - margin]

  for (const id of Object.keys(positions)) {
    if (!isSnapParticipant(id)) continue

    const o = positions[id]
    const os = sizes[id]
    xLines.push(o.x, o.x + os.width)
    yLines.push(o.y, o.y + os.height)
  }

  return { x: xLines, y: yLines }
}

export function collectVisualSnapGuides(
  draggedId: PanelId,
  _size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): VisualSnapGuides {
  const margin = windowMargin()
  const xLines = [margin, viewport.width - margin]
  const yLines = [margin, viewport.height - margin]

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const o = positions[id]
    const os = sizes[id]
    xLines.push(o.x, o.x + os.width)
    yLines.push(o.y, o.y + os.height)
  }

  return { x: xLines, y: yLines }
}

function verticalOverlap(aTop: number, aHeight: number, bTop: number, bHeight: number) {
  return Math.max(0, Math.min(aTop + aHeight, bTop + bHeight) - Math.max(aTop, bTop))
}

function horizontalOverlap(aLeft: number, aWidth: number, bLeft: number, bWidth: number) {
  return Math.max(0, Math.min(aLeft + aWidth, bLeft + bWidth) - Math.max(aLeft, bLeft))
}

function overlapCrossCenter(aStart: number, aSize: number, bStart: number, bSize: number) {
  const overlap = Math.max(
    0,
    Math.min(aStart + aSize, bStart + bSize) - Math.max(aStart, bStart),
  )
  if (overlap <= 0) return (aStart + aSize / 2 + bStart + bSize / 2) / 2
  return (Math.max(aStart, bStart) + Math.min(aStart + aSize, bStart + bSize)) / 2
}

function collectHorizontalDistributionTargets(
  draggedId: PanelId,
  pos: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): number[] {
  const margin = windowMargin()
  const gap = layoutGap()
  const { width: w, height: h } = size
  const leftBoundaries: DistributionBoundary[] = [
    { edge: margin, cross: pos.y + h / 2 },
  ]
  const rightBoundaries: DistributionBoundary[] = [
    { edge: viewport.width - margin, cross: pos.y + h / 2 },
  ]

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    if (verticalOverlap(pos.y, h, other.y, otherSize.height) <= 0) continue

    const cross = overlapCrossCenter(pos.y, h, other.y, otherSize.height)
    leftBoundaries.push({ edge: other.x + otherSize.width + gap, cross })
    rightBoundaries.push({ edge: other.x - gap, cross })
  }

  const targets: number[] = []

  for (const left of leftBoundaries) {
    for (const right of rightBoundaries) {
      if (right.edge - left.edge < w) continue

      const x = (left.edge + right.edge - w) / 2
      if (x < margin - 0.5) continue
      if (x + w > viewport.width - margin + 0.5) continue
      if (x - left.edge < gap * 0.5 || right.edge - (x + w) < gap * 0.5) continue

      targets.push(x)
    }
  }

  return targets
}

function collectVerticalDistributionTargets(
  draggedId: PanelId,
  pos: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): number[] {
  const margin = windowMargin()
  const gap = layoutGap()
  const { width: w, height: h } = size
  const topBoundaries: DistributionBoundary[] = [
    { edge: margin, cross: pos.x + w / 2 },
  ]
  const bottomBoundaries: DistributionBoundary[] = [
    { edge: viewport.height - margin, cross: pos.x + w / 2 },
  ]

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    if (horizontalOverlap(pos.x, w, other.x, otherSize.width) <= 0) continue

    const cross = overlapCrossCenter(pos.x, w, other.x, otherSize.width)
    topBoundaries.push({ edge: other.y + otherSize.height + gap, cross })
    bottomBoundaries.push({ edge: other.y - gap, cross })
  }

  const targets: number[] = []

  for (const top of topBoundaries) {
    for (const bottom of bottomBoundaries) {
      if (bottom.edge - top.edge < h) continue

      const y = (top.edge + bottom.edge - h) / 2
      if (y < margin - 0.5) continue
      if (y + h > viewport.height - margin + 0.5) continue
      if (y - top.edge < gap * 0.5 || bottom.edge - (y + h) < gap * 0.5) continue

      targets.push(y)
    }
  }

  return targets
}

function findDistributionGuideX(
  draggedId: PanelId,
  snapped: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): DistributionGuide | null {
  const margin = windowMargin()
  const gap = layoutGap()
  const { width: w, height: h } = size
  const x = snapped.x
  const leftBoundaries: DistributionBoundary[] = [
    { edge: margin, cross: snapped.y + h / 2 },
  ]
  const rightBoundaries: DistributionBoundary[] = [
    { edge: viewport.width - margin, cross: snapped.y + h / 2 },
  ]

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    if (verticalOverlap(snapped.y, h, other.y, otherSize.height) <= 0) continue

    const cross = overlapCrossCenter(snapped.y, h, other.y, otherSize.height)
    leftBoundaries.push({ edge: other.x + otherSize.width + gap, cross })
    rightBoundaries.push({ edge: other.x - gap, cross })
  }

  for (const left of leftBoundaries) {
    for (const right of rightBoundaries) {
      if (right.edge - left.edge < w) continue

      const targetX = (left.edge + right.edge - w) / 2
      if (Math.abs(targetX - x) > 0.5) continue
      if (x - left.edge < gap * 0.5 || right.edge - (x + w) < gap * 0.5) continue

      return {
        axis: "x",
        cross: (left.cross + right.cross) / 2,
        gapA: { from: left.edge, to: x },
        gapB: { from: x + w, to: right.edge },
      }
    }
  }

  return null
}

function findDistributionGuideY(
  draggedId: PanelId,
  snapped: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): DistributionGuide | null {
  const margin = windowMargin()
  const gap = layoutGap()
  const { width: w, height: h } = size
  const y = snapped.y
  const topBoundaries: DistributionBoundary[] = [
    { edge: margin, cross: snapped.x + w / 2 },
  ]
  const bottomBoundaries: DistributionBoundary[] = [
    { edge: viewport.height - margin, cross: snapped.x + w / 2 },
  ]

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    if (horizontalOverlap(snapped.x, w, other.x, otherSize.width) <= 0) continue

    const cross = overlapCrossCenter(snapped.x, w, other.x, otherSize.width)
    topBoundaries.push({ edge: other.y + otherSize.height + gap, cross })
    bottomBoundaries.push({ edge: other.y - gap, cross })
  }

  for (const top of topBoundaries) {
    for (const bottom of bottomBoundaries) {
      if (bottom.edge - top.edge < h) continue

      const targetY = (top.edge + bottom.edge - h) / 2
      if (Math.abs(targetY - y) > 0.5) continue
      if (y - top.edge < gap * 0.5 || bottom.edge - (y + h) < gap * 0.5) continue

      return {
        axis: "y",
        cross: (top.cross + bottom.cross) / 2,
        gapA: { from: top.edge, to: y },
        gapB: { from: y + h, to: bottom.edge },
      }
    }
  }

  return null
}

export function getActiveDistributionGuides(
  draggedId: PanelId,
  raw: PixelPosition,
  snapped: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): DistributionGuide[] {
  const guides: DistributionGuide[] = []

  if (snapped.x !== raw.x) {
    const guide = findDistributionGuideX(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport,
    )
    if (guide) guides.push(guide)
  }

  if (snapped.y !== raw.y) {
    const guide = findDistributionGuideY(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport,
    )
    if (guide) guides.push(guide)
  }

  return guides
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

function mapTopLeftXToVisual(
  topLeft: number,
  w: number,
  draggedId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): number {
  const margin = windowMargin()
  const gap = layoutGap()

  if (Math.abs(topLeft - margin) < 0.5) return margin

  const rightMarginTopLeft = viewport.width - margin - w
  if (Math.abs(topLeft - rightMarginTopLeft) < 0.5) {
    return viewport.width - margin
  }

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const o = positions[id]
    const os = sizes[id]
    const oRight = o.x + os.width

    if (Math.abs(topLeft - o.x) < 0.5 || Math.abs(topLeft - (o.x - w)) < 0.5) {
      return o.x
    }
    if (Math.abs(topLeft - (oRight - w)) < 0.5) return oRight
    if (Math.abs(topLeft - (oRight + gap)) < 0.5) return oRight + gap
    if (Math.abs(topLeft - (o.x - w - gap)) < 0.5) return o.x - gap
  }

  return topLeft
}

function mapTopLeftYToVisual(
  topLeft: number,
  h: number,
  draggedId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): number {
  const margin = windowMargin()
  const gap = layoutGap()

  if (Math.abs(topLeft - margin) < 0.5) return margin

  const bottomMarginTopLeft = viewport.height - margin - h
  if (Math.abs(topLeft - bottomMarginTopLeft) < 0.5) {
    return viewport.height - margin
  }

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const o = positions[id]
    const os = sizes[id]
    const oBottom = o.y + os.height

    if (Math.abs(topLeft - o.y) < 0.5 || Math.abs(topLeft - (o.y - h)) < 0.5) {
      return o.y
    }
    if (Math.abs(topLeft - (oBottom - h)) < 0.5) return oBottom
    if (Math.abs(topLeft - (oBottom + gap)) < 0.5) return oBottom + gap
    if (Math.abs(topLeft - (o.y - h - gap)) < 0.5) return o.y - gap
  }

  return topLeft
}

export function getActiveVisualSnapLines(
  draggedId: PanelId,
  raw: PixelPosition,
  snapped: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): { x: number | null; y: number | null } {
  const threshold = snapThreshold()
  const { x: xTargets, y: yTargets } = collectSnapTargets(
    draggedId,
    size,
    positions,
    sizes,
    viewport,
  )

  let visualX: number | null = null
  if (snapped.x !== raw.x) {
    const matched = findMatchedTarget(snapped.x, xTargets, threshold)
    if (matched !== null) {
      visualX = mapTopLeftXToVisual(
        matched,
        size.width,
        draggedId,
        positions,
        sizes,
        viewport,
      )
    }
  }

  let visualY: number | null = null
  if (snapped.y !== raw.y) {
    const matched = findMatchedTarget(snapped.y, yTargets, threshold)
    if (matched !== null) {
      visualY = mapTopLeftYToVisual(
        matched,
        size.height,
        draggedId,
        positions,
        sizes,
        viewport,
      )
    }
  }

  return { x: visualX, y: visualY }
}

function idsFromEdgeSnapX(
  matchedTopLeft: number,
  width: number,
  draggedId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
): PanelId[] {
  const gap = layoutGap()
  const ids: PanelId[] = []

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    const otherRight = other.x + otherSize.width

    if (
      Math.abs(matchedTopLeft - other.x) < 0.5 ||
      Math.abs(matchedTopLeft - (otherRight - width)) < 0.5 ||
      Math.abs(matchedTopLeft - (otherRight + gap)) < 0.5 ||
      Math.abs(matchedTopLeft - (other.x - width - gap)) < 0.5
    ) {
      ids.push(id)
    }
  }

  return ids
}

function idsFromEdgeSnapY(
  matchedTopLeft: number,
  height: number,
  draggedId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
): PanelId[] {
  const gap = layoutGap()
  const ids: PanelId[] = []

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    const otherBottom = other.y + otherSize.height

    if (
      Math.abs(matchedTopLeft - other.y) < 0.5 ||
      Math.abs(matchedTopLeft - (otherBottom - height)) < 0.5 ||
      Math.abs(matchedTopLeft - (otherBottom + gap)) < 0.5 ||
      Math.abs(matchedTopLeft - (other.y - height - gap)) < 0.5
    ) {
      ids.push(id)
    }
  }

  return ids
}

function idsFromDistributionGuideX(
  guide: DistributionGuide,
  draggedId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
): PanelId[] {
  const gap = layoutGap()
  const leftEdge = guide.gapA.from
  const rightEdge = guide.gapB.to
  const ids: PanelId[] = []

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    const otherRight = other.x + otherSize.width

    if (Math.abs(otherRight + gap - leftEdge) < 0.5) ids.push(id)
    if (Math.abs(other.x - gap - rightEdge) < 0.5) ids.push(id)
  }

  return ids
}

function idsFromDistributionGuideY(
  guide: DistributionGuide,
  draggedId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
): PanelId[] {
  const gap = layoutGap()
  const topEdge = guide.gapA.from
  const bottomEdge = guide.gapB.to
  const ids: PanelId[] = []

  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue

    const other = positions[id]
    const otherSize = sizes[id]
    const otherBottom = other.y + otherSize.height

    if (Math.abs(otherBottom + gap - topEdge) < 0.5) ids.push(id)
    if (Math.abs(other.y - gap - bottomEdge) < 0.5) ids.push(id)
  }

  return ids
}

export function samePanelIds(a: PanelId[], b: PanelId[]): boolean {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((id, index) => id === right[index])
}

/** @deprecated Use samePanelIds */
export const sameUiGroupIds = samePanelIds

export function getSnapTargetIds(
  draggedId: PanelId,
  raw: PixelPosition,
  snapped: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): PanelId[] {
  const threshold = snapThreshold()
  const ids = new Set<PanelId>()
  const { width, height } = size

  if (snapped.x !== raw.x) {
    const distributionGuide = findDistributionGuideX(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport,
    )

    if (distributionGuide) {
      for (const id of idsFromDistributionGuideX(
        distributionGuide,
        draggedId,
        positions,
        sizes,
      )) {
        ids.add(id)
      }
    } else {
      const { x: xTargets } = collectSnapTargets(
        draggedId,
        size,
        positions,
        sizes,
        viewport,
      )
      const matched = findMatchedTarget(snapped.x, xTargets, threshold)
      if (matched !== null) {
        for (const id of idsFromEdgeSnapX(
          matched,
          width,
          draggedId,
          positions,
          sizes,
        )) {
          ids.add(id)
        }
      }
    }
  }

  if (snapped.y !== raw.y) {
    const distributionGuide = findDistributionGuideY(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport,
    )

    if (distributionGuide) {
      for (const id of idsFromDistributionGuideY(
        distributionGuide,
        draggedId,
        positions,
        sizes,
      )) {
        ids.add(id)
      }
    } else {
      const { y: yTargets } = collectSnapTargets(
        draggedId,
        size,
        positions,
        sizes,
        viewport,
      )
      const matched = findMatchedTarget(snapped.y, yTargets, threshold)
      if (matched !== null) {
        for (const id of idsFromEdgeSnapY(
          matched,
          height,
          draggedId,
          positions,
          sizes,
        )) {
          ids.add(id)
        }
      }
    }
  }

  return [...ids]
}

export function snapPosition(
  draggedId: PanelId,
  target: PixelPosition,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  viewport: Viewport,
): PixelPosition {
  const threshold = snapThreshold()
  const bounded = clampToWorkspaceBounds(target, size, viewport)

  const edgeTargets = collectSnapTargets(
    draggedId,
    size,
    positions,
    sizes,
    viewport,
  )

  const distributionX = collectHorizontalDistributionTargets(
    draggedId,
    bounded,
    size,
    positions,
    sizes,
    viewport,
  )
  const distributionY = collectVerticalDistributionTargets(
    draggedId,
    bounded,
    size,
    positions,
    sizes,
    viewport,
  )

  const snapped = {
    x: snapScalar(bounded.x, [...edgeTargets.x, ...distributionX], threshold),
    y: snapScalar(bounded.y, [...edgeTargets.y, ...distributionY], threshold),
  }

  const clamped = clampToWorkspaceBounds(snapped, size, viewport)

  return resolveCollisions(
    draggedId,
    clamped,
    size,
    positions,
    sizes,
    viewport,
  )
}
