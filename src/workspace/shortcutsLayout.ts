import { windowMargin, type Viewport } from "./snap"
import type { PanelId, PanelSize, PixelPosition } from "./types"

export type PanelDragDebug = {
  id: PanelId
  raw: PixelPosition
  snapped: PixelPosition
}

const CLEARANCE = 20
const SCORE_HYSTERESIS = 16

type Rect = PixelPosition & PanelSize

type ScoredPosition = {
  pos: PixelPosition
  score: number
}

function rectsOverlap(a: Rect, b: Rect, gap = 0): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  )
}

function positionKey(pos: PixelPosition) {
  return `${Math.round(pos.x)}:${Math.round(pos.y)}`
}

function clampScalar(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function rectDistance(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0)
  const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0)
  return Math.hypot(dx, dy)
}

function isWithinWorkspace(
  pos: PixelPosition,
  size: PanelSize,
  viewport: Viewport,
): boolean {
  const margin = windowMargin()
  return (
    pos.x >= margin &&
    pos.y >= margin &&
    pos.x + size.width <= viewport.width - margin &&
    pos.y + size.height <= viewport.height - margin
  )
}

function getObstacleRects(
  panelId: PanelId,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  dragDebug: PanelDragDebug | null,
): Rect[] {
  const rects: Rect[] = []

  for (const id of Object.keys(positions)) {
    if (id === panelId) continue

    const size = sizes[id]
    if (!size) continue

    const pos = dragDebug?.id === id ? dragDebug.snapped : positions[id]
    if (!pos) continue

    rects.push({ x: pos.x, y: pos.y, width: size.width, height: size.height })
  }

  return rects
}

function isPositionClear(
  pos: PixelPosition,
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): boolean {
  const candidate = { ...pos, ...size }
  if (!isWithinWorkspace(pos, size, viewport)) return false
  return !obstacles.some((o) => rectsOverlap(candidate, o, CLEARANCE))
}

function minObstacleDistance(candidate: Rect, obstacles: Rect[]): number {
  if (obstacles.length === 0) return Infinity

  let minDist = Infinity
  for (const obstacle of obstacles) {
    minDist = Math.min(minDist, rectDistance(candidate, obstacle))
  }
  return minDist
}

function directionalRoom(
  candidate: Rect,
  obstacles: Rect[],
  viewport: Viewport,
): { horizontal: number; vertical: number } {
  const margin = windowMargin()
  const leftBound = margin
  const rightBound = viewport.width - margin
  const topBound = margin
  const bottomBound = viewport.height - margin

  let leftRoom = candidate.x - leftBound
  let rightRoom = rightBound - (candidate.x + candidate.width)
  let topRoom = candidate.y - topBound
  let bottomRoom = bottomBound - (candidate.y + candidate.height)

  for (const obstacle of obstacles) {
    const verticalOverlap =
      Math.min(candidate.y + candidate.height, obstacle.y + obstacle.height) -
        Math.max(candidate.y, obstacle.y) >
      0

    if (verticalOverlap) {
      if (obstacle.x + obstacle.width <= candidate.x) {
        leftRoom = Math.min(leftRoom, candidate.x - (obstacle.x + obstacle.width))
      }
      if (obstacle.x >= candidate.x + candidate.width) {
        rightRoom = Math.min(
          rightRoom,
          obstacle.x - (candidate.x + candidate.width),
        )
      }
    }

    const horizontalOverlap =
      Math.min(candidate.x + candidate.width, obstacle.x + obstacle.width) -
        Math.max(candidate.x, obstacle.x) >
      0

    if (horizontalOverlap) {
      if (obstacle.y + obstacle.height <= candidate.y) {
        topRoom = Math.min(topRoom, candidate.y - (obstacle.y + obstacle.height))
      }
      if (obstacle.y >= candidate.y + candidate.height) {
        bottomRoom = Math.min(
          bottomRoom,
          obstacle.y - (candidate.y + candidate.height),
        )
      }
    }
  }

  return {
    horizontal: leftRoom + rightRoom + candidate.width,
    vertical: topRoom + bottomRoom + candidate.height,
  }
}

function emptinessScore(
  pos: PixelPosition,
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): number {
  const candidate = { ...pos, ...size }
  const nearest = minObstacleDistance(candidate, obstacles)
  const room = directionalRoom(candidate, obstacles, viewport)
  const openArea = room.horizontal * room.vertical

  return nearest * 4 + Math.sqrt(openArea)
}

function marginAnchorCandidates(
  size: PanelSize,
  viewport: Viewport,
): PixelPosition[] {
  const margin = windowMargin()
  const { width: w, height: h } = size
  const vw = viewport.width
  const vh = viewport.height

  return [
    { x: margin, y: margin },
    { x: (vw - w) / 2, y: margin },
    { x: vw - margin - w, y: margin },
    { x: margin, y: vh - margin - h },
    { x: (vw - w) / 2, y: vh - margin - h },
    { x: vw - margin - w, y: vh - margin - h },
    { x: margin, y: (vh - h) / 2 },
    { x: vw - margin - w, y: (vh - h) / 2 },
  ]
}

function marginStripCandidates(
  size: PanelSize,
  viewport: Viewport,
): PixelPosition[] {
  const margin = windowMargin()
  const { width: w, height: h } = size
  const vw = viewport.width
  const vh = viewport.height
  const step = 28
  const positions: PixelPosition[] = []

  for (let x = margin; x <= vw - margin - w; x += step) {
    positions.push({ x, y: margin })
    positions.push({ x, y: vh - margin - h })
  }

  for (let y = margin + step; y <= vh - margin - h - step; y += step) {
    positions.push({ x: margin, y })
    positions.push({ x: vw - margin - w, y })
  }

  return positions
}

function horizontalEdgeGapCandidates(
  edgeY: number,
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): PixelPosition[] {
  const margin = windowMargin()
  const { width: w } = size
  const left = margin
  const right = viewport.width - margin
  const band: Rect = {
    x: left,
    y: edgeY,
    width: right - left,
    height: size.height,
  }

  const blocking = obstacles
    .filter((o) => rectsOverlap(o, band, 0))
    .map((o) => ({ left: o.x, right: o.x + o.width }))
    .sort((a, b) => a.left - b.left)

  const gaps: { start: number; end: number }[] = []
  let cursor = left

  for (const block of blocking) {
    if (block.left > cursor) gaps.push({ start: cursor, end: block.left })
    cursor = Math.max(cursor, block.right)
  }
  if (cursor < right) gaps.push({ start: cursor, end: right })

  return gaps
    .filter((gap) => gap.end - gap.start >= w + CLEARANCE * 2)
    .map((gap) => ({
      x: (gap.start + gap.end - w) / 2,
      y: edgeY,
    }))
}

function verticalEdgeGapCandidates(
  edgeX: number,
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): PixelPosition[] {
  const margin = windowMargin()
  const { height: h } = size
  const top = margin
  const bottom = viewport.height - margin
  const band: Rect = {
    x: edgeX,
    y: top,
    width: size.width,
    height: bottom - top,
  }

  const blocking = obstacles
    .filter((o) => rectsOverlap(o, band, 0))
    .map((o) => ({ top: o.y, bottom: o.y + o.height }))
    .sort((a, b) => a.top - b.top)

  const gaps: { start: number; end: number }[] = []
  let cursor = top

  for (const block of blocking) {
    if (block.top > cursor) gaps.push({ start: cursor, end: block.top })
    cursor = Math.max(cursor, block.bottom)
  }
  if (cursor < bottom) gaps.push({ start: cursor, end: bottom })

  return gaps
    .filter((gap) => gap.end - gap.start >= h + CLEARANCE * 2)
    .map((gap) => ({
      x: edgeX,
      y: (gap.start + gap.end - h) / 2,
    }))
}

function collectCandidates(
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): PixelPosition[] {
  const margin = windowMargin()
  const { width: w, height: h } = size
  const vh = viewport.height
  const vw = viewport.width

  const raw = [
    ...marginAnchorCandidates(size, viewport),
    ...marginStripCandidates(size, viewport),
    ...horizontalEdgeGapCandidates(margin, size, obstacles, viewport),
    ...horizontalEdgeGapCandidates(vh - margin - h, size, obstacles, viewport),
    ...verticalEdgeGapCandidates(margin, size, obstacles, viewport),
    ...verticalEdgeGapCandidates(vw - margin - w, size, obstacles, viewport),
  ]

  const seen = new Set<string>()
  const unique: PixelPosition[] = []

  for (const pos of raw) {
    const key = positionKey(pos)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(pos)
  }

  return unique
}

function scoreValidPositions(
  candidates: PixelPosition[],
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): ScoredPosition[] {
  return candidates
    .filter((pos) => isPositionClear(pos, size, obstacles, viewport))
    .map((pos) => ({
      pos,
      score: emptinessScore(pos, size, obstacles, viewport),
    }))
    .sort((a, b) => b.score - a.score)
}

function pickEmptiestPosition(
  scored: ScoredPosition[],
  current: PixelPosition | null,
): PixelPosition | null {
  if (scored.length === 0) return null

  const best = scored[0]

  if (current) {
    const currentEntry = scored.find(
      (entry) => positionKey(entry.pos) === positionKey(current),
    )
    if (
      currentEntry &&
      currentEntry.score >= best.score - SCORE_HYSTERESIS
    ) {
      return current
    }
  }

  return best.pos
}

function findFallbackPosition(
  target: PixelPosition,
  size: PanelSize,
  obstacles: Rect[],
  viewport: Viewport,
): PixelPosition {
  const margin = windowMargin()
  const gridStep = 24
  const { width: w, height: h } = size
  const candidates: PixelPosition[] = []

  for (
    let y = margin;
    y <= viewport.height - margin - h;
    y += gridStep
  ) {
    for (
      let x = margin;
      x <= viewport.width - margin - w;
      x += gridStep
    ) {
      candidates.push({ x, y })
    }
  }

  const scored = scoreValidPositions(candidates, size, obstacles, viewport)
  if (scored.length > 0) return scored[0].pos

  if (isPositionClear(target, size, obstacles, viewport)) return target

  const center = {
    x: (viewport.width - size.width) / 2,
    y: (viewport.height - size.height) / 2,
  }

  for (let step = 1; step <= 12; step++) {
    const t = step / 12
    const pos = {
      x: Math.round(target.x + (center.x - target.x) * t),
      y: Math.round(target.y + (center.y - target.y) * t),
    }
    if (isPositionClear(pos, size, obstacles, viewport)) return pos
  }

  return {
    x: clampScalar(
      target.x,
      margin,
      viewport.width - margin - size.width,
    ),
    y: clampScalar(
      target.y,
      margin,
      viewport.height - margin - size.height,
    ),
  }
}

export function findAutoPlacedPosition(
  panelId: PanelId,
  current: PixelPosition | null,
  size: PanelSize,
  positions: Record<PanelId, PixelPosition>,
  sizes: Record<PanelId, PanelSize>,
  dragDebug: PanelDragDebug | null,
  viewport: Viewport,
  fallbackPosition: PixelPosition,
): PixelPosition {
  const obstacles = getObstacleRects(panelId, positions, sizes, dragDebug)
  const candidates = collectCandidates(size, obstacles, viewport)
  const scored = scoreValidPositions(candidates, size, obstacles, viewport)
  const best = pickEmptiestPosition(scored, current)

  if (best) return best

  return findFallbackPosition(fallbackPosition, size, obstacles, viewport)
}

/** @deprecated Use findAutoPlacedPosition */
export const findShortcutsPosition = findAutoPlacedPosition
