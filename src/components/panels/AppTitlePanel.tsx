import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import { usePrismaticStore } from "../../hooks/usePrismaticStore"
import { titleSizeFromPanelSize } from "../../layout/panelSettings"
import {
  AppTitle,
  type AppTitleProps,
  type AppTitleSize,
} from "../AppTitle"
import { useWorkspacePanel } from "../WorkspacePanel"

const HOVER_GRACE_MS = 220
const DEFAULT_TITLE_SIZES = ["small", "large"] as const satisfies readonly AppTitleSize[]
const RESIZE_STEP_PX = 48

type ResizeStart = {
  x: number
  size: AppTitleSize
}

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(max, index))
}

function TitleSizeToolbar({
  size,
  options,
  onChange,
}: {
  size: AppTitleSize
  options: readonly AppTitleSize[]
  onChange: (size: AppTitleSize) => void
}) {
  return (
    <div
      className="workspace-controls prismatic-bg-overlay prismatic-text-primary flex items-center gap-0.5 rounded-full p-0.5 shadow-lg backdrop-blur-sm"
      role="toolbar"
      aria-label="Title size"
    >
      {options.map((option) => {
        const active = option === size
        const label = option === "small" ? "S" : "M"
        return (
          <button
            key={option}
            type="button"
            title={`${option} title`}
            aria-pressed={active}
            className={[
              "rounded-full px-2 py-1 text-[10px] transition-colors",
              active
                ? "prismatic-bg-surface-active prismatic-text-on-active"
                : "prismatic-text-primary hover:prismatic-bg-border-subtle",
            ].join(" ")}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(option)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export type AppTitlePanelProps = AppTitleProps & {
  panelId?: string
  defaultSize?: AppTitleSize
  sizeOptions?: readonly AppTitleSize[]
  onSizeChange?: (size: AppTitleSize) => void
}

export function AppTitlePanel({
  panelId,
  size,
  defaultSize = "small",
  sizeOptions = DEFAULT_TITLE_SIZES,
  onSizeChange,
  ...titleProps
}: AppTitlePanelProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const setUiGroupSize = useStore((s) => s.setUiGroupSize)
  const setPanelSetting = useStore((s) => s.setPanelSetting)
  const workspacePanel = useWorkspacePanel()
  const resolvedPanelId = panelId ?? workspacePanel?.id ?? "app-title"

  const rootRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef<ResizeStart | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [internalSize, setInternalSize] = useState<AppTitleSize>(() => {
    const state = useStore.getState()
    return (
      state.panelSettings[resolvedPanelId]?.titleSize ??
      titleSizeFromPanelSize(state.uiSizes[resolvedPanelId]) ??
      defaultSize
    )
  })
  const [resizing, setResizing] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)

  const currentSize = size ?? internalSize
  const allowedSizes = [...sizeOptions]

  const setTitleSize = (next: AppTitleSize) => {
    if (size === undefined) setInternalSize(next)
    setPanelSetting(resolvedPanelId, { titleSize: next })
    onSizeChange?.(next)
  }

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const updateSize = () => {
      setUiGroupSize(resolvedPanelId, {
        width: el.offsetWidth,
        height: el.offsetHeight,
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [resolvedPanelId, currentSize, setUiGroupSize])

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
    workspacePanel?.id === resolvedPanelId && workspacePanel.hovered

  useEffect(() => {
    if (workspaceMode && panelHovered) openControls()
  }, [panelHovered, workspaceMode])

  useEffect(() => {
    if (workspaceMode && !panelHovered && !resizing) {
      clearHideTimer()
      setControlsOpen(false)
    }
  }, [workspaceMode, panelHovered, resizing])

  const onResizePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!workspaceMode || e.button !== 0) return
    const el = rootRef.current
    if (!el) return

    e.preventDefault()
    e.stopPropagation()
    openControls()
    resizeStartRef.current = {
      x: e.clientX,
      size: currentSize,
    }
    setResizing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing || !resizeStartRef.current) return
    const delta = e.clientX - resizeStartRef.current.x
    const startIndex = Math.max(
      0,
      allowedSizes.indexOf(resizeStartRef.current.size),
    )
    const nextIndex = clampIndex(
      startIndex + Math.round(delta / RESIZE_STEP_PX),
      allowedSizes.length - 1,
    )
    setTitleSize(allowedSizes[nextIndex] ?? currentSize)
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
      className="workspace-hover-zone relative w-fit"
      onMouseEnter={openControls}
      onMouseLeave={scheduleCloseControls}
    >
      <div ref={rootRef} className="workspace-panel relative w-fit">
        <AppTitle {...titleProps} size={currentSize} />

        {showControls && (
          <div className="workspace-controls pointer-events-auto absolute left-1 top-1 z-30">
            <TitleSizeToolbar
              size={currentSize}
              options={allowedSizes}
              onChange={setTitleSize}
            />
          </div>
        )}

        {workspaceMode && (
          <div
            className={[
              "workspace-controls absolute -right-1.5 -bottom-1.5 z-10 size-4 cursor-ew-resize transition-opacity duration-150",
              showControls ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            aria-label="Resize title"
          >
            <div className="absolute right-0.5 bottom-0.5 size-2 rounded-sm border-r border-b border-[var(--prismatic-accent-stroke)] opacity-70" />
          </div>
        )}

        {workspaceMode && resizing && (
          <div className="workspace-controls prismatic-bg-overlay prismatic-text-primary pointer-events-none absolute bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] lowercase backdrop-blur-sm">
            {currentSize === "small" ? "S" : "M"}
          </div>
        )}
      </div>
    </div>
  )
}
