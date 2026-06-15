import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react"
import { usePrismaticStore } from "../hooks/usePrismaticStore"
import {
  getSnapTargetIds,
  isUiPositionClear,
  samePanelIds,
  snapPosition,
} from "../workspace/snap"
import type { PanelId, PixelPosition } from "../workspace/types"

type WorkspacePanelContextValue = {
  id: PanelId
  hovered: boolean
}

const WorkspacePanelContext = createContext<WorkspacePanelContextValue | null>(
  null,
)

export function useWorkspacePanel() {
  return useContext(WorkspacePanelContext)
}

/** @deprecated Use useWorkspacePanel */
export const useWorkspaceGroup = useWorkspacePanel

export type WorkspacePanelProps = {
  id: PanelId
  children: ReactNode
  className?: string
}

export function WorkspacePanel({ id, children, className = "" }: WorkspacePanelProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const position = useStore((s) => s.uiPositions[id] ?? { x: 0, y: 0 })
  const setUiGroupSize = useStore((s) => s.setUiGroupSize)
  const setUiGroupPosition = useStore((s) => s.setUiGroupPosition)
  const setUiDragDebug = useStore((s) => s.setUiDragDebug)
  const flashSnapTargets = useStore((s) => s.flashSnapTargets)
  const snapFlashing = useStore((s) => s.snapFlashIds.includes(id))

  const rootRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; pos: PixelPosition } | null>(
    null,
  )
  const lastValidDragPosRef = useRef<PixelPosition>(position)
  const lastSnapTargetsRef = useRef<PanelId[]>([])
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragPos, setDragPos] = useState<PixelPosition | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const updateSize = () => {
      setUiGroupSize(id, {
        width: el.offsetWidth,
        height: el.offsetHeight,
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [id, setUiGroupSize])

  const measuredSize = () => {
    const el = rootRef.current
    const fromDom = el
      ? { width: el.offsetWidth, height: el.offsetHeight }
      : { width: 0, height: 0 }
    const fromStore = useStore.getState().uiSizes[id]
    return {
      width: fromDom.width || fromStore?.width || 0,
      height: fromDom.height || fromStore?.height || 0,
    }
  }

  const resolveSnap = (raw: PixelPosition): PixelPosition => {
    const state = useStore.getState()
    return snapPosition(
      id,
      raw,
      measuredSize(),
      state.uiPositions,
      state.uiSizes,
      { width: window.innerWidth, height: window.innerHeight },
    )
  }

  const finishDrag = () => {
    if (!dragStartRef.current || !dragPos) return

    setUiGroupPosition(id, dragPos)
    dragStartRef.current = null
    lastSnapTargetsRef.current = []
    setDragPos(null)
    setDragging(false)
    setUiDragDebug(null)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!workspaceMode || e.button !== 0) return
    if ((e.target as HTMLElement).closest(".workspace-controls")) return
    e.preventDefault()
    e.stopPropagation()
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pos: { ...position },
    }
    lastValidDragPosRef.current = { ...position }
    setDragging(true)
    setDragPos({ ...position })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return

    const raw = {
      x: dragStartRef.current.pos.x + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.pos.y + (e.clientY - dragStartRef.current.y),
    }
    const snapped = resolveSnap(raw)
    const size = measuredSize()
    const state = useStore.getState()
    const resolved = isUiPositionClear(
      id,
      snapped,
      size,
      state.uiPositions,
      state.uiSizes,
    )
      ? snapped
      : lastValidDragPosRef.current

    if (resolved === snapped) {
      lastValidDragPosRef.current = snapped
    }

    const didSnap = snapped.x !== raw.x || snapped.y !== raw.y
    if (didSnap && resolved === snapped) {
      const snapTargets = getSnapTargetIds(
        id,
        raw,
        snapped,
        size,
        state.uiPositions,
        state.uiSizes,
        { width: window.innerWidth, height: window.innerHeight },
      )
      if (
        snapTargets.length > 0 &&
        !samePanelIds(snapTargets, lastSnapTargetsRef.current)
      ) {
        flashSnapTargets(snapTargets)
        lastSnapTargetsRef.current = snapTargets
      }
    } else if (!didSnap) {
      lastSnapTargetsRef.current = []
    }

    setDragPos(resolved)
    setUiDragDebug({ id, raw, snapped: resolved })
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    finishDrag()
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const displayPos = dragPos ?? position
  const dragOffset = dragging
    ? { x: displayPos.x - position.x, y: displayPos.y - position.y }
    : { x: 0, y: 0 }

  const outlineClass = workspaceMode
    ? snapFlashing
      ? "outline outline-2 outline-[var(--prismatic-accent-stroke)]"
      : dragging
        ? "outline outline-2 outline-[var(--prismatic-accent-stroke)]"
        : hovered
          ? "outline outline-1 outline-[var(--prismatic-border-subtle)]"
          : ""
    : ""

  return (
    <WorkspacePanelContext.Provider value={{ id, hovered }}>
      <div
        ref={rootRef}
        className={`pointer-events-auto absolute w-fit ${workspaceMode ? "cursor-grab active:cursor-grabbing" : ""} ${outlineClass} ${className}`}
        style={{
          left: position.x,
          top: position.y,
          transform:
            dragOffset.x || dragOffset.y
              ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
              : undefined,
          transition: dragging ? "none" : "left 180ms ease-out, top 180ms ease-out",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          if (dragging) finishDrag()
        }}
        onMouseEnter={() => workspaceMode && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={
            workspaceMode
              ? "pointer-events-none select-none [&_.workspace-controls]:pointer-events-auto [&_.workspace-hover-zone]:pointer-events-auto"
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </WorkspacePanelContext.Provider>
  )
}

/** @deprecated Use WorkspacePanel */
export const WorkspaceGroup = WorkspacePanel
