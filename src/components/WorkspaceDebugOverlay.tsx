import { useEffect, useState } from "react"
import { usePrismaticStore } from "../hooks/usePrismaticStore"
import {
  getActiveDistributionGuides,
  getActiveVisualSnapLines,
  type DistributionGuide,
} from "../workspace/snap"

const SNAP_STROKE = "rgba(255,255,255,0.85)"
const GAP_STROKE = "rgba(255,255,255,0.65)"
const CAP_SIZE = 5

function GapIndicator({ guide }: { guide: DistributionGuide }) {
  const isHorizontal = guide.axis === "x"
  const gapLengthA = Math.abs(guide.gapA.to - guide.gapA.from)
  const gapLengthB = Math.abs(guide.gapB.to - guide.gapB.from)

  const renderGap = (from: number, to: number, key: string) => {
    const length = Math.abs(to - from)
    const start = Math.min(from, to)
    const end = Math.max(from, to)

    if (isHorizontal) {
      const y = guide.cross
      return (
        <g key={key}>
          <line
            x1={start}
            y1={y}
            x2={end}
            y2={y}
            stroke={GAP_STROKE}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <line
            x1={start}
            y1={y - CAP_SIZE}
            x2={start}
            y2={y + CAP_SIZE}
            stroke={GAP_STROKE}
            strokeWidth={1}
          />
          <line
            x1={end}
            y1={y - CAP_SIZE}
            x2={end}
            y2={y + CAP_SIZE}
            stroke={GAP_STROKE}
            strokeWidth={1}
          />
          <text
            x={(start + end) / 2}
            y={y - 8}
            fill={GAP_STROKE}
            fontSize={9}
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            {Math.round(length)}
          </text>
        </g>
      )
    }

    const x = guide.cross
    return (
      <g key={key}>
        <line
          x1={x}
          y1={start}
          x2={x}
          y2={end}
          stroke={GAP_STROKE}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <line
          x1={x - CAP_SIZE}
          y1={start}
          x2={x + CAP_SIZE}
          y2={start}
          stroke={GAP_STROKE}
          strokeWidth={1}
        />
        <line
          x1={x - CAP_SIZE}
          y1={end}
          x2={x + CAP_SIZE}
          y2={end}
          stroke={GAP_STROKE}
          strokeWidth={1}
        />
        <text
          x={x + 10}
          y={(start + end) / 2}
          fill={GAP_STROKE}
          fontSize={9}
          fontFamily="ui-monospace, monospace"
          dominantBaseline="middle"
        >
          {Math.round(length)}
        </text>
      </g>
    )
  }

  return (
    <g>
      {renderGap(guide.gapA.from, guide.gapA.to, "gap-a")}
      {renderGap(guide.gapB.from, guide.gapB.to, "gap-b")}
      {Math.abs(gapLengthA - gapLengthB) < 1 && (
        <text
          x={
            isHorizontal
              ? (guide.gapA.to + guide.gapB.from) / 2
              : guide.cross + 18
          }
          y={
            isHorizontal
              ? guide.cross + 14
              : (guide.gapA.to + guide.gapB.from) / 2
          }
          fill={GAP_STROKE}
          fontSize={10}
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          =
        </text>
      )}
    </g>
  )
}

export function WorkspaceDebugOverlay() {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const uiPositions = useStore((s) => s.uiPositions)
  const uiSizes = useStore((s) => s.uiSizes)
  const uiDragDebug = useStore((s) => s.uiDragDebug)
  const canvasDragDebug = useStore((s) => s.canvasDragDebug)
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  if (!workspaceMode || (!uiDragDebug && !canvasDragDebug)) return null

  const activeUiSnapLines = uiDragDebug
    ? getActiveVisualSnapLines(
        uiDragDebug.id,
        uiDragDebug.raw,
        uiDragDebug.snapped,
        uiSizes[uiDragDebug.id],
        uiPositions,
        uiSizes,
        viewport,
      )
    : null

  const distributionGuides = uiDragDebug
    ? getActiveDistributionGuides(
        uiDragDebug.id,
        uiDragDebug.raw,
        uiDragDebug.snapped,
        uiSizes[uiDragDebug.id],
        uiPositions,
        uiSizes,
        viewport,
      )
    : []

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[40] select-none"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        {canvasDragDebug?.activeLines.x != null && (
          <line
            x1={canvasDragDebug.activeLines.x}
            y1={0}
            x2={canvasDragDebug.activeLines.x}
            y2={viewport.height}
            stroke={SNAP_STROKE}
            strokeWidth={1}
          />
        )}
        {canvasDragDebug?.activeLines.y != null && (
          <line
            x1={0}
            y1={canvasDragDebug.activeLines.y}
            x2={viewport.width}
            y2={canvasDragDebug.activeLines.y}
            stroke={SNAP_STROKE}
            strokeWidth={1}
          />
        )}

        {activeUiSnapLines != null && activeUiSnapLines.x != null && (
          <line
            x1={activeUiSnapLines.x}
            y1={0}
            x2={activeUiSnapLines.x}
            y2={viewport.height}
            stroke={SNAP_STROKE}
            strokeWidth={1}
          />
        )}
        {activeUiSnapLines != null && activeUiSnapLines.y != null && (
          <line
            x1={0}
            y1={activeUiSnapLines.y}
            x2={viewport.width}
            y2={activeUiSnapLines.y}
            stroke={SNAP_STROKE}
            strokeWidth={1}
          />
        )}

        {distributionGuides.map((guide, index) => (
          <GapIndicator key={`${guide.axis}-${index}`} guide={guide} />
        ))}
      </svg>
    </div>
  )
}
