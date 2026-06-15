import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { usePrismaticStore } from "../hooks/usePrismaticStore"
import { findAutoPlacedPosition } from "../workspace/shortcutsLayout"
import type { PixelPosition } from "../workspace/types"

const TEXT_CLASS =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase"

const VIEWPORT_MARGIN = 12
const TOOLTIP_GAP = 12
const TOOLTIP_WIDTH = 200

type Viewport = { width: number; height: number }

type TooltipPlacement = {
  top: number
  left: number
  maxWidth: number
}

function clampTooltipPlacement(
  anchor: DOMRect,
  tooltip: DOMRect,
  viewport: Viewport,
): TooltipPlacement {
  let left = anchor.left + anchor.width / 2 - tooltip.width / 2
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewport.width - VIEWPORT_MARGIN - tooltip.width),
  )

  let top = anchor.top - tooltip.height - TOOLTIP_GAP
  if (top < VIEWPORT_MARGIN) {
    top = anchor.bottom + TOOLTIP_GAP
  }
  top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(top, viewport.height - VIEWPORT_MARGIN - tooltip.height),
  )

  return { top, left, maxWidth: TOOLTIP_WIDTH }
}

function useViewportSize() {
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

  return viewport
}

type FloatingHelpProps = {
  id?: string
  fallbackPosition: PixelPosition
  tooltip: (workspaceMode: boolean) => ReactNode
  ariaLabel?: string
}

export function FloatingHelp({
  id = "shortcuts",
  fallbackPosition,
  tooltip,
  ariaLabel = "Keyboard shortcuts",
}: FloatingHelpProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const uiPositions = useStore((s) => s.uiPositions)
  const uiSizes = useStore((s) => s.uiSizes)
  const uiDragDebug = useStore((s) => s.uiDragDebug)
  const setUiGroupPosition = useStore((s) => s.setUiGroupPosition)
  const setUiGroupSize = useStore((s) => s.setUiGroupSize)

  const viewport = useViewportSize()
  const rootRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const lastPositionRef = useRef<PixelPosition | null>(null)
  const [measuredSize, setMeasuredSize] = useState({ width: 24, height: 24 })
  const [hovered, setHovered] = useState(false)
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const updateSize = () => {
      setMeasuredSize({
        width: el.offsetWidth,
        height: el.offsetHeight,
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const position = useMemo(
    () =>
      findAutoPlacedPosition(
        id,
        lastPositionRef.current,
        measuredSize,
        uiPositions,
        uiSizes,
        uiDragDebug,
        viewport,
        fallbackPosition,
      ),
    [id, measuredSize, uiDragDebug, uiPositions, uiSizes, viewport, fallbackPosition],
  )

  useEffect(() => {
    lastPositionRef.current = position
  }, [position])

  useEffect(() => {
    setUiGroupPosition(id, position)
  }, [id, position, setUiGroupPosition])

  useEffect(() => {
    setUiGroupSize(id, measuredSize)
  }, [id, measuredSize, setUiGroupSize])

  useLayoutEffect(() => {
    if (!hovered) {
      setPlacement(null)
      return
    }

    const anchor = anchorRef.current
    const tip = tooltipRef.current
    if (!anchor || !tip) return

    setPlacement(
      clampTooltipPlacement(
        anchor.getBoundingClientRect(),
        tip.getBoundingClientRect(),
        viewport,
      ),
    )
  }, [hovered, viewport, position, workspaceMode])

  const tooltipContent = tooltip(workspaceMode)

  return (
    <>
      <div
        ref={rootRef}
        className="pointer-events-auto absolute z-50 w-fit"
        style={{
          left: position.x,
          top: position.y,
          transition: "left 180ms ease-out, top 180ms ease-out",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          ref={anchorRef}
          className={`${TEXT_CLASS} prismatic-text-primary cursor-default transition-opacity ${hovered ? "opacity-100" : "opacity-90"}`}
          aria-label={ariaLabel}
        >
          ?
        </span>
      </div>

      {hovered &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="prismatic-bg-overlay prismatic-text-primary pointer-events-none fixed z-[60] w-[200px] rounded-2xl px-3 py-2.5 lowercase shadow-lg backdrop-blur-sm transition-opacity duration-150"
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              maxWidth: placement?.maxWidth ?? TOOLTIP_WIDTH,
              opacity: placement ? 1 : 0,
            }}
          >
            {tooltipContent}
          </div>,
          document.body,
        )}
    </>
  )
}
