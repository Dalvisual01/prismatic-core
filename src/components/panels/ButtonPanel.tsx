import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react"
import { usePrismaticStore } from "../../hooks/usePrismaticStore"
import { buttonSizeFromPanelSize } from "../../layout/panelSettings"
import { Button, type ButtonProps, type ButtonSize } from "../ui/Button"
import { useWorkspacePanel } from "../WorkspacePanel"

const HOVER_GRACE_MS = 220
const DEFAULT_BUTTON_SIZES = ["small", "medium", "large"] as const satisfies readonly ButtonSize[]
const RESIZE_STEP_PX = 48

const SIZE_LABELS: Record<ButtonSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
}

type ResizeStart = {
  x: number
  size: ButtonSize
}

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(max, index))
}

function ButtonSizeToolbar({
  size,
  options,
  onChange,
}: {
  size: ButtonSize
  options: readonly ButtonSize[]
  onChange: (size: ButtonSize) => void
}) {
  return (
    <div
      className="workspace-controls prismatic-bg-overlay prismatic-text-primary flex items-center gap-0.5 rounded-full p-0.5 shadow-lg backdrop-blur-sm"
      role="toolbar"
      aria-label="Button size"
    >
      {options.map((option) => {
        const active = option === size
        return (
          <button
            key={option}
            type="button"
            title={`${option} button`}
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
            {SIZE_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}

export type ButtonPanelProps = ButtonProps & {
  panelId?: string
  defaultSize?: ButtonSize
  sizeOptions?: readonly ButtonSize[]
  onSizeChange?: (size: ButtonSize) => void
  children?: ReactNode
}

export function ButtonPanel({
  panelId,
  size: controlledSize,
  defaultSize = "large",
  sizeOptions = DEFAULT_BUTTON_SIZES,
  onSizeChange,
  children,
  ...buttonProps
}: ButtonPanelProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const setUiGroupSize = useStore((s) => s.setUiGroupSize)
  const setPanelSetting = useStore((s) => s.setPanelSetting)
  const workspacePanel = useWorkspacePanel()
  const resolvedPanelId = panelId ?? workspacePanel?.id ?? "button"

  const rootRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef<ResizeStart | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [internalSize, setInternalSize] = useState<ButtonSize>(() => {
    const state = useStore.getState()
    return (
      state.panelSettings[resolvedPanelId]?.buttonSize ??
      buttonSizeFromPanelSize(state.uiSizes[resolvedPanelId]) ??
      defaultSize
    )
  })
  const [resizing, setResizing] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)

  const currentSize = controlledSize ?? internalSize
  const allowedSizes = [...sizeOptions]

  const setButtonSize = (next: ButtonSize) => {
    if (controlledSize === undefined) setInternalSize(next)
    setPanelSetting(resolvedPanelId, { buttonSize: next })
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
    setButtonSize(allowedSizes[nextIndex] ?? currentSize)
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
        <Button {...buttonProps} size={currentSize}>
          {children}
        </Button>

        {showControls && (
          <div className="workspace-controls pointer-events-auto absolute left-1 top-1 z-30">
            <ButtonSizeToolbar
              size={currentSize}
              options={allowedSizes}
              onChange={setButtonSize}
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
            aria-label="Resize button"
          >
            <div className="absolute right-0.5 bottom-0.5 size-2 rounded-sm border-r border-b border-[var(--prismatic-accent-stroke)] opacity-70" />
          </div>
        )}

        {workspaceMode && resizing && (
          <div className="workspace-controls prismatic-bg-overlay prismatic-text-primary pointer-events-none absolute bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] lowercase backdrop-blur-sm">
            {SIZE_LABELS[currentSize]}
          </div>
        )}
      </div>
    </div>
  )
}
