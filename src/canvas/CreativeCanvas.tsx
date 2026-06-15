import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"
import p5 from "p5"
import { getRuntimeConfig } from "../config"
import { usePrismaticStore } from "../hooks/usePrismaticStore"
import {
  getActiveCanvasSnapLines,
  getCanvasSnapTargetIds,
  getCanvasScreenRect,
  snapCanvasPan,
} from "../workspace/canvasSnap"
import { samePanelIds } from "../workspace/snap"
import type { PanelId } from "../workspace/types"
import { PRISMATIC_SURFACE_FRAME_STYLE } from "../theme/tokens"
import type { P5WithSketch, PreviewKind, SketchFactory } from "./types"

export type CreativeCanvasHandle = {
  loadSource: (url: string, kind: PreviewKind) => void
  saveCanvas: (filename?: string) => void
}

export type CreativeCanvasProps = {
  createSketch: SketchFactory
}

const SPOTLIGHT_RADIUS = 800
const SPOTLIGHT_HOLE = 0
const MASK_FADE_START = -20
const MASK_FADE_END = 400
const MASK_FADE_POWER = 2.7

const easeInOut = (t: number, power: number) =>
  t < 0.5
    ? Math.pow(2, power - 1) * Math.pow(t, power)
    : 1 - Math.pow(-2 * t + 2, power) / 2

const EASED_CURSOR_MASK_STOPS = (() => {
  const steps = 14
  const fadeLength = MASK_FADE_END - MASK_FADE_START
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps
    const radius = MASK_FADE_START + fadeLength * t
    const alpha = easeInOut(t, MASK_FADE_POWER)
    return `rgba(0, 0, 0, ${alpha.toFixed(3)}) ${radius.toFixed(1)}px`
  }).join(", ")
})()

const CURSOR_MASK = `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at var(--cursor-x) var(--cursor-y), transparent 0px, transparent ${SPOTLIGHT_HOLE}px, ${EASED_CURSOR_MASK_STOPS})`

const PAN_LERP_DRAG = 0.32
const PAN_LERP_RELEASE = 0.22
const PAN_DIST_REF_PX = 140
const PAN_MAX_STEP_DRAG_PX = 90
const PAN_MAX_STEP_RELEASE_PX = 60
const PAN_SETTLE_EPS = 0.06

const ZOOM_LERP = 0.12
const ZOOM_DIST_REF = 0.22
const ZOOM_MAX_STEP = 0.042
const ZOOM_SETTLE_EPS = 0.004

const easeOutQuad = (t: number) => t * (2 - t)

export const CreativeCanvas = forwardRef<CreativeCanvasHandle, CreativeCanvasProps>(
  function CreativeCanvas({ createSketch }, ref) {
    const useStore = usePrismaticStore()
    const workspaceMode = useStore((s) => s.workspaceMode)
    const toggleWorkspaceMode = useStore((s) => s.toggleWorkspaceMode)
    const workspaceModeRef = useRef(false)

    const outerRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const pInstRef = useRef<P5WithSketch | null>(null)
    const createSketchRef = useRef(createSketch)
    createSketchRef.current = createSketch

    const panRef = useRef({ x: 0, y: 0 })
    const panDisplayRef = useRef({ x: 0, y: 0 })
    const zoomRef = useRef(1)
    const zoomDisplayRef = useRef(1)
    const panRafRef = useRef(0)
    const zoomAnchorRef = useRef<
      | { cx: number; cy: number; localX: number; localY: number }
      | null
    >(null)
    const dragRef = useRef({
      active: false,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
    })
    const lastCanvasSnapTargetsRef = useRef<PanelId[]>([])

    const canvasConfig = () => getRuntimeConfig().canvas
    const shortcutsConfig = () => getRuntimeConfig().shortcuts

    const cancelPanRaf = useCallback(() => {
      if (panRafRef.current) {
        cancelAnimationFrame(panRafRef.current)
        panRafRef.current = 0
      }
    }, [])

    const applyTransform = useCallback(() => {
      const el = containerRef.current
      if (!el) return
      const useSmooth = workspaceModeRef.current
      const { x, y } = useSmooth ? panDisplayRef.current : panRef.current
      const z = useSmooth ? zoomDisplayRef.current : zoomRef.current
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`
    }, [])

    const syncTransformDisplayToLogical = useCallback(() => {
      panDisplayRef.current = { ...panRef.current }
      zoomDisplayRef.current = zoomRef.current
    }, [])

    const resetTransform = useCallback(() => {
      panRef.current = { x: 0, y: 0 }
      panDisplayRef.current = { x: 0, y: 0 }
      zoomRef.current = 1
      zoomDisplayRef.current = 1
      zoomAnchorRef.current = null
      useStore.getState().setCanvasDragDebug(null)
      cancelPanRaf()
      applyTransform()
    }, [applyTransform, cancelPanRaf, useStore])

    const resolveCanvasPan = useCallback(
      (raw: { x: number; y: number }) => {
        const el = containerRef.current
        if (!el) return raw

        const state = useStore.getState()
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        }
        const canvasSize = {
          width: el.offsetWidth,
          height: el.offsetHeight,
        }

        return snapCanvasPan(
          raw,
          zoomRef.current,
          canvasSize,
          state.uiPositions,
          state.uiSizes,
          viewport,
        )
      },
      [useStore],
    )

    const runPanFrame = useCallback(() => {
      panRafRef.current = 0
      if (!workspaceModeRef.current) return

      const tx = panRef.current.x
      const ty = panRef.current.y
      const tz = zoomRef.current
      const dragging = dragRef.current.active

      const dx = tx - panDisplayRef.current.x
      const dy = ty - panDisplayRef.current.y
      const vz = zoomDisplayRef.current
      const dz = tz - vz

      const panSettled =
        !dragging && Math.abs(dx) < PAN_SETTLE_EPS && Math.abs(dy) < PAN_SETTLE_EPS
      const zoomSettled = Math.abs(dz) < ZOOM_SETTLE_EPS

      if (!dragging && panSettled && zoomSettled) {
        panDisplayRef.current = { x: tx, y: ty }
        zoomDisplayRef.current = tz
        applyTransform()
        return
      }

      if (panSettled) {
        panDisplayRef.current = { x: tx, y: ty }
      } else {
        const dist = Math.hypot(dx, dy)
        const blend = easeOutQuad(Math.min(1, dist / PAN_DIST_REF_PX))
        const baseK = dragging ? PAN_LERP_DRAG : PAN_LERP_RELEASE
        const k = baseK * (0.38 + 0.62 * blend)

        let stepX = dx * k
        let stepY = dy * k
        const maxStep = dragging ? PAN_MAX_STEP_DRAG_PX : PAN_MAX_STEP_RELEASE_PX
        const stepMag = Math.hypot(stepX, stepY)
        if (stepMag > maxStep && stepMag > 1e-6) {
          const s = maxStep / stepMag
          stepX *= s
          stepY *= s
        }

        panDisplayRef.current = {
          x: panDisplayRef.current.x + stepX,
          y: panDisplayRef.current.y + stepY,
        }
      }

      if (zoomSettled) {
        zoomDisplayRef.current = tz
        if (!dragging) zoomAnchorRef.current = null
      } else {
        const zBlend = easeOutQuad(Math.min(1, Math.abs(dz) / ZOOM_DIST_REF))
        const zk = ZOOM_LERP * (0.38 + 0.62 * zBlend)
        let zStep = dz * zk
        if (Math.abs(zStep) > ZOOM_MAX_STEP) {
          zStep = Math.sign(zStep) * ZOOM_MAX_STEP
        }
        zoomDisplayRef.current = vz + zStep
      }

      const anchor = zoomAnchorRef.current
      if (anchor && !dragging) {
        const z = zoomDisplayRef.current
        panDisplayRef.current = {
          x: anchor.cx - anchor.localX * z,
          y: anchor.cy - anchor.localY * z,
        }
      }

      applyTransform()

      const ndx = tx - panDisplayRef.current.x
      const ndy = ty - panDisplayRef.current.y
      const ndz = tz - zoomDisplayRef.current
      const stillPan =
        dragging ||
        Math.abs(ndx) >= PAN_SETTLE_EPS ||
        Math.abs(ndy) >= PAN_SETTLE_EPS
      const stillZoom = Math.abs(ndz) >= ZOOM_SETTLE_EPS
      if (stillPan || stillZoom) {
        panRafRef.current = requestAnimationFrame(runPanFrame)
      }
    }, [applyTransform])

    const schedulePanFrame = useCallback(() => {
      if (!workspaceModeRef.current) return
      if (panRafRef.current) return
      panRafRef.current = requestAnimationFrame(runPanFrame)
    }, [runPanFrame])

    useEffect(() => {
      workspaceModeRef.current = workspaceMode
      if (workspaceMode) {
        syncTransformDisplayToLogical()
        applyTransform()
      } else {
        cancelPanRaf()
        useStore.getState().setCanvasDragDebug(null)
        syncTransformDisplayToLogical()
        applyTransform()
      }
    }, [
      workspaceMode,
      applyTransform,
      cancelPanRaf,
      syncTransformDisplayToLogical,
      useStore,
    ])

    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      el.style.willChange = workspaceMode ? "transform" : "auto"
      return () => {
        el.style.willChange = "auto"
      }
    }, [workspaceMode])

    useImperativeHandle(ref, () => ({
      loadSource: (url: string, kind: PreviewKind) => {
        const p = pInstRef.current
        if (!p) return

        if (kind === "video") {
          p.updateVideo?.(url)
          return
        }

        p.loadImage(
          url,
          (img) => {
            p.updateImage?.(img)
          },
          () => console.error("Failed to load image"),
        )
      },
      saveCanvas: (filename?: string) => {
        const p = pInstRef.current
        if (!p) return
        const container = containerRef.current
        const prefix = canvasConfig().downloadFilePrefix
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const name = filename ?? `${prefix}_${timestamp}`
        const canvasEl = container?.querySelector("canvas") as
          | HTMLCanvasElement
          | undefined
          | null

        if (canvasEl) {
          try {
            const dataUrl = canvasEl.toDataURL("image/png")
            const a = document.createElement("a")
            a.href = dataUrl
            a.download = `${name}.png`
            document.body.appendChild(a)
            a.click()
            a.remove()
            return
          } catch (error) {
            console.warn("Canvas download failed, falling back to p5:", error)
          }
          p.saveCanvas(canvasEl, name, "png")
        } else {
          p.saveCanvas(name, "png")
        }
      },
    }))

    useEffect(() => {
      const el = containerRef.current
      if (!el) return

      const instance = new p5((p: P5WithSketch) => {
        createSketchRef.current(p)
        pInstRef.current = p
      }, el)

      return () => {
        pInstRef.current = null
        instance.remove()
      }
    }, [])

    useEffect(() => {
      const el = outerRef.current
      if (!el) return

      el.style.setProperty("--cursor-x", "-9999px")
      el.style.setProperty("--cursor-y", "-9999px")

      let rafId = 0
      let nextX = -9999
      let nextY = -9999

      const applyVars = () => {
        rafId = 0
        el.style.setProperty("--cursor-x", `${nextX}px`)
        el.style.setProperty("--cursor-y", `${nextY}px`)
      }

      const handleMouseMove = (e: PointerEvent | MouseEvent) => {
        nextX = e.clientX
        nextY = e.clientY
        if (!rafId) rafId = requestAnimationFrame(applyVars)
      }

      window.addEventListener("pointermove", handleMouseMove, { passive: true })
      return () => {
        window.removeEventListener("pointermove", handleMouseMove)
        if (rafId) cancelAnimationFrame(rafId)
      }
    }, [])

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
          return

        const { toggleWorkspace, resetCanvasView } = shortcutsConfig()
        const key = e.key.toLowerCase()

        if (key === toggleWorkspace.toLowerCase()) {
          if (getRuntimeConfig().workspace.enabled) {
            toggleWorkspaceMode()
          }
        } else if (key === resetCanvasView.toLowerCase()) {
          resetTransform()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [resetTransform, toggleWorkspaceMode])

    useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
        if (!workspaceModeRef.current) return
        e.preventDefault()

        const { minZoom, maxZoom, zoomStep } = canvasConfig()
        const oldZoom = zoomDisplayRef.current
        const factor = e.deltaY < 0 ? zoomStep : 1 / zoomStep
        const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * factor))

        const W = window.innerWidth
        const H = window.innerHeight
        const cx = e.clientX - W / 2
        const cy = e.clientY - H / 2

        const px = panDisplayRef.current.x
        const py = panDisplayRef.current.y

        const localX = (cx - px) / oldZoom
        const localY = (cy - py) / oldZoom

        panRef.current = {
          x: cx - localX * newZoom,
          y: cy - localY * newZoom,
        }
        zoomRef.current = newZoom
        zoomAnchorRef.current = { cx, cy, localX, localY }
        schedulePanFrame()
      }

      window.addEventListener("wheel", handleWheel, { passive: false })
      return () => window.removeEventListener("wheel", handleWheel)
    }, [schedulePanFrame])

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!workspaceModeRef.current) return
      e.preventDefault()
      cancelPanRaf()
      zoomAnchorRef.current = null
      syncTransformDisplayToLogical()
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return

      const raw = {
        x: dragRef.current.startPanX + e.clientX - dragRef.current.startX,
        y: dragRef.current.startPanY + e.clientY - dragRef.current.startY,
      }
      const snapped = resolveCanvasPan(raw)
      panRef.current = snapped

      const el = containerRef.current
      if (el) {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        }
        const canvasSize = {
          width: el.offsetWidth,
          height: el.offsetHeight,
        }
        const state = useStore.getState()
        useStore.getState().setCanvasDragDebug({
          raw,
          snapped,
          rect: getCanvasScreenRect(
            snapped,
            zoomRef.current,
            canvasSize,
            viewport,
          ),
          activeLines: getActiveCanvasSnapLines(
            raw,
            snapped,
            zoomRef.current,
            canvasSize,
            state.uiPositions,
            state.uiSizes,
            viewport,
          ),
        })

        const didSnap = snapped.x !== raw.x || snapped.y !== raw.y
        if (didSnap) {
          const snapTargets = getCanvasSnapTargetIds(
            raw,
            snapped,
            zoomRef.current,
            canvasSize,
            state.uiPositions,
            state.uiSizes,
            viewport,
          )
          if (
            snapTargets.length > 0 &&
            !samePanelIds(snapTargets, lastCanvasSnapTargetsRef.current)
          ) {
            useStore.getState().flashSnapTargets(snapTargets)
            lastCanvasSnapTargetsRef.current = snapTargets
          }
        } else {
          lastCanvasSnapTargetsRef.current = []
        }
      }

      schedulePanFrame()
    }

    const handlePointerUp = () => {
      dragRef.current.active = false
      lastCanvasSnapTargetsRef.current = []
      useStore.getState().setCanvasDragDebug(null)
      schedulePanFrame()
    }

    const spotlight = canvasConfig().spotlight

    return (
      <div
        ref={outerRef}
        className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center select-none"
        style={
          workspaceMode || !spotlight
            ? undefined
            : { maskImage: CURSOR_MASK, WebkitMaskImage: CURSOR_MASK }
        }
        aria-hidden
      >
        <div
          ref={containerRef}
          className={[
            "prismatic-surface-frame inline-flex p-1 rounded-[calc(var(--radius)*2+4px)] [&_canvas]:block [&_canvas]:max-h-none [&_canvas]:max-w-none [&_canvas]:rounded-[calc(var(--radius)*2)]",
            workspaceMode
              ? "pointer-events-auto cursor-grab active:cursor-grabbing"
              : "pointer-events-none",
          ].join(" ")}
          style={{
            transformOrigin: "center center",
            ...PRISMATIC_SURFACE_FRAME_STYLE,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    )
  },
)
