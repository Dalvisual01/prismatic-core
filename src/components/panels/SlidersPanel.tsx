import {
  Children,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react"
import { usePrismaticStore } from "../../hooks/usePrismaticStore"
import {
  chunkIntoColumns,
  columnCountFromWidth,
  maxSliderColumns,
  minSliderColumns,
  sliderColumnWidthPx,
  slidersPanelSize,
} from "../../workspace/slidersLayout"
import { useWorkspacePanel } from "../WorkspacePanel"

const HOVER_GRACE_MS = 220

type SliderColumnToolbarProps = {
  columnCount: number
  onChange: (count: number) => void
}

function ColumnIcon({ count }: { count: number }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="opacity-80"
    >
      {Array.from({ length: count }, (_, i) => {
        const colW = 12 / count - 1
        const x = 1 + i * (colW + 1)
        return (
          <rect
            key={i}
            x={x}
            y="2"
            width={colW}
            height="10"
            rx="1"
            fill="currentColor"
          />
        )
      })}
    </svg>
  )
}

function SliderColumnToolbar({ columnCount, onChange }: SliderColumnToolbarProps) {
  const min = minSliderColumns()
  const max = maxSliderColumns()

  return (
    <div
      className="workspace-controls prismatic-bg-overlay prismatic-text-primary flex items-center gap-0.5 rounded-full p-0.5 shadow-lg backdrop-blur-sm"
      role="toolbar"
      aria-label="Slider columns"
    >
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((count) => {
        const active = count === columnCount
        return (
          <button
            key={count}
            type="button"
            title={`${count} column${count === 1 ? "" : "s"}`}
            aria-pressed={active}
            className={[
              "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] lowercase transition-colors",
              active
                ? "prismatic-bg-surface-active prismatic-text-on-active"
                : "prismatic-text-primary hover:prismatic-bg-border-subtle",
            ].join(" ")}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(count)}
          >
            <ColumnIcon count={count} />
            <span>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

type SlidersPanelProps = {
  children: ReactNode
  panelId?: string
}

export function SlidersPanel({ children, panelId = "sliders" }: SlidersPanelProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const columnCount = useStore((s) => s.sliderColumnCount)
  const setSliderColumnCount = useStore((s) => s.setSliderColumnCount)

  const workspacePanel = useWorkspacePanel()
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [resizing, setResizing] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)

  const panelSize = slidersPanelSize(columnCount)
  const columnWidth = sliderColumnWidthPx()
  const columns = chunkIntoColumns(Children.toArray(children), columnCount)

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const openControls = () => {
    clearHideTimer()
    setControlsOpen(true)
  }

  const scheduleCloseControls = () => {
    if (resizing) return
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setControlsOpen(false)
      hideTimerRef.current = null
    }, HOVER_GRACE_MS)
  }

  useEffect(() => () => clearHideTimer(), [])

  useEffect(() => {
    if (!workspaceMode) {
      clearHideTimer()
      setControlsOpen(false)
    }
  }, [workspaceMode])

  const panelHovered =
    workspacePanel?.id === panelId && workspacePanel.hovered

  useEffect(() => {
    if (workspaceMode && panelHovered) openControls()
  }, [panelHovered, workspaceMode])

  const onResizePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!workspaceMode || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    openControls()
    resizeStartRef.current = { x: e.clientX, width: panelSize.width }
    setResizing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing || !resizeStartRef.current) return
    const delta = e.clientX - resizeStartRef.current.x
    const nextWidth = resizeStartRef.current.width + delta
    setSliderColumnCount(columnCountFromWidth(nextWidth))
  }

  const finishResize = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing) return
    resizeStartRef.current = null
    setResizing(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const showControls = workspaceMode && (controlsOpen || resizing)

  return (
    <div
      className="workspace-hover-zone relative"
      onMouseEnter={openControls}
      onMouseLeave={scheduleCloseControls}
    >
      <div
        className={[
          "workspace-panel relative transition-[width,height] duration-200 ease-out",
          workspaceMode ? "pointer-events-none" : "",
        ].join(" ")}
        style={panelSize}
      >
        <div
          className="flex content-start gap-1"
          style={{ width: panelSize.width, height: panelSize.height }}
        >
          {columns.map((columnSliders, colIndex) => (
            <div
              key={colIndex}
              className="flex shrink-0 flex-col gap-1"
              style={{ width: columnWidth }}
            >
              {columnSliders}
            </div>
          ))}
        </div>

        {showControls && (
          <div className="workspace-controls pointer-events-auto absolute left-1 top-1 z-30">
            <SliderColumnToolbar
              columnCount={columnCount}
              onChange={setSliderColumnCount}
            />
          </div>
        )}

        {workspaceMode && (
          <div
            className={[
              "workspace-controls absolute top-0 -right-1.5 z-10 h-full w-3 cursor-ew-resize transition-opacity duration-150",
              showControls ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            aria-label="Resize slider columns"
          >
            <div className="absolute top-1/2 right-1 h-10 w-1 -translate-y-1/2 rounded-full bg-[var(--prismatic-accent-stroke)] opacity-70" />
          </div>
        )}

        {workspaceMode && resizing && (
          <div className="workspace-controls prismatic-bg-overlay prismatic-text-primary pointer-events-none absolute bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] lowercase backdrop-blur-sm">
            {columnCount} col · {panelSize.width}px
          </div>
        )}
      </div>
    </div>
  )
}
