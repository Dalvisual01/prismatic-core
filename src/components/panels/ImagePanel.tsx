import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { usePrismaticStore } from "../../hooks/usePrismaticStore"
import {
  imageModulesFromSize,
  imagePanelSize,
  imagePreviewModulesList,
  imagePreviewSizePx,
} from "../../workspace/imageLayout"
import { useWorkspacePanel } from "../WorkspacePanel"

const HOVER_GRACE_MS = 220

type ImageSizeToolbarProps = {
  modules: number
  onChange: (modules: number) => void
}

function SizeIcon({ modules, maxModules }: { modules: number; maxModules: number }) {
  const fill = Math.min(modules, maxModules) / maxModules
  const inset = (1 - fill) * 5

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="opacity-80"
    >
      <rect
        x={1 + inset}
        y={1 + inset}
        width={12 - inset * 2}
        height={12 - inset * 2}
        rx="2"
        fill="currentColor"
      />
    </svg>
  )
}

function ImageSizeToolbar({ modules, onChange }: ImageSizeToolbarProps) {
  const allowed = [...imagePreviewModulesList()]
  const maxModules = allowed[allowed.length - 1] ?? 6

  return (
    <div
      className="workspace-controls prismatic-bg-overlay prismatic-text-primary flex items-center gap-0.5 rounded-full p-0.5 shadow-lg backdrop-blur-sm"
      role="toolbar"
      aria-label="Preview size"
    >
      {allowed.map((count) => {
        const active = count === modules
        const px = imagePreviewSizePx(count)
        return (
          <button
            key={count}
            type="button"
            title={`${px}px preview`}
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
            <SizeIcon modules={count} maxModules={maxModules} />
            <span>{px}</span>
          </button>
        )
      })}
    </div>
  )
}

type ImagePanelProps = {
  children: ReactNode
  panelId?: string
}

export function ImagePanel({ children, panelId = "image" }: ImagePanelProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const imageModules = useStore((s) => s.imagePreviewModules)
  const setImagePreviewModules = useStore((s) => s.setImagePreviewModules)

  const workspacePanel = useWorkspacePanel()
  const resizeStartRef = useRef<{ x: number; size: number } | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [resizing, setResizing] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)

  const panelSize = imagePanelSize(imageModules)

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
    resizeStartRef.current = { x: e.clientX, size: panelSize.width }
    setResizing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing || !resizeStartRef.current) return
    const delta = e.clientX - resizeStartRef.current.x
    const nextSize = resizeStartRef.current.size + delta
    setImagePreviewModules(imageModulesFromSize(nextSize))
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
        <div className="size-full">{children}</div>

        {showControls && (
          <div className="workspace-controls pointer-events-auto absolute left-1 top-1 z-30">
            <ImageSizeToolbar modules={imageModules} onChange={setImagePreviewModules} />
          </div>
        )}

        {workspaceMode && (
          <div
            className={[
              "workspace-controls absolute -right-1.5 -bottom-1.5 z-10 size-4 cursor-nwse-resize transition-opacity duration-150",
              showControls ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            aria-label="Resize preview"
          >
            <div className="absolute right-0.5 bottom-0.5 size-2 rounded-sm border-r border-b border-[var(--prismatic-accent-stroke)] opacity-70" />
          </div>
        )}

        {workspaceMode && resizing && (
          <div className="workspace-controls prismatic-bg-overlay prismatic-text-primary pointer-events-none absolute bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] lowercase backdrop-blur-sm">
            {panelSize.width}px
          </div>
        )}
      </div>
    </div>
  )
}
