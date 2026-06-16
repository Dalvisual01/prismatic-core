import { create, type StoreApi, type UseBoundStore } from "zustand"
import {
  DEFAULT_CANVAS_RESOLUTION_SCALE,
  clampCanvasResolutionScale,
  type CanvasResolutionScale,
} from "../canvas/resolution"
import {
  clampImageModules,
  defaultImageModules,
  imagePanelSize,
} from "../workspace/imageLayout"
import {
  clampSliderColumns,
  defaultSliderColumns,
  slidersPanelSize,
} from "../workspace/slidersLayout"
import type { PanelId, PanelRect, PanelSize, PixelPosition } from "../workspace/types"

const SNAP_FLASH_MS = 100
let snapFlashTimer: ReturnType<typeof setTimeout> | null = null

function blurActiveElement() {
  if (typeof document === "undefined") return
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

export type PanelDragDebug = {
  id: PanelId
  raw: PixelPosition
  snapped: PixelPosition
}

export type CanvasDragDebug = {
  raw: PixelPosition
  snapped: PixelPosition
  rect: PanelRect
  activeLines: { x: number | null; y: number | null }
}

export type PrismaticStoreState = {
  workspaceMode: boolean
  uiPositions: Record<PanelId, PixelPosition>
  uiSizes: Record<PanelId, PanelSize>
  uiDragDebug: PanelDragDebug | null
  canvasDragDebug: CanvasDragDebug | null
  snapFlashIds: PanelId[]
  sliderColumnCount: number
  imagePreviewModules: number
  canvasResolutionScale: CanvasResolutionScale
  toggleWorkspaceMode: () => void
  setWorkspaceMode: (enabled: boolean) => void
  setUiGroupSize: (id: PanelId, size: PanelSize) => void
  setUiGroupPosition: (id: PanelId, position: PixelPosition) => void
  setUiDragDebug: (drag: PanelDragDebug | null) => void
  setCanvasDragDebug: (drag: CanvasDragDebug | null) => void
  flashSnapTargets: (ids: PanelId[]) => void
  setSliderColumnCount: (count: number) => void
  setImagePreviewModules: (modules: number) => void
  setCanvasResolutionScale: (scale: CanvasResolutionScale) => void
  initializeLayout: (
    positions: Record<PanelId, PixelPosition>,
    sizes: Record<PanelId, PanelSize>,
  ) => void
}

export type PrismaticStoreInit = {
  initialPositions?: Record<PanelId, PixelPosition>
  initialSizes?: Record<PanelId, PanelSize>
  workspaceMode?: boolean
  sliderColumnCount?: number
  imagePreviewModules?: number
  canvasResolutionScale?: CanvasResolutionScale
}

export function createPrismaticStore(
  init: PrismaticStoreInit = {},
): UseBoundStore<StoreApi<PrismaticStoreState>> {
  const sliderColumns = init.sliderColumnCount ?? defaultSliderColumns()
  const imageModules = init.imagePreviewModules ?? defaultImageModules()
  const resolutionScale =
    init.canvasResolutionScale ?? DEFAULT_CANVAS_RESOLUTION_SCALE

  return create<PrismaticStoreState>((set) => ({
    workspaceMode: init.workspaceMode ?? false,
    uiPositions: init.initialPositions ?? {},
    uiSizes: init.initialSizes ?? {},
    uiDragDebug: null,
    canvasDragDebug: null,
    snapFlashIds: [],
    sliderColumnCount: sliderColumns,
    imagePreviewModules: imageModules,
    canvasResolutionScale: clampCanvasResolutionScale(resolutionScale),
    toggleWorkspaceMode: () =>
      set((s) => {
        const workspaceMode = !s.workspaceMode
        if (workspaceMode) blurActiveElement()
        return { workspaceMode }
      }),
    setWorkspaceMode: (enabled) => {
      if (enabled) blurActiveElement()
      set({ workspaceMode: enabled })
    },
    setUiGroupSize: (id, size) =>
      set((s) => ({
        uiSizes: { ...s.uiSizes, [id]: size },
      })),
    setUiGroupPosition: (id, position) =>
      set((s) => ({
        uiPositions: { ...s.uiPositions, [id]: position },
      })),
    setUiDragDebug: (drag) => set({ uiDragDebug: drag }),
    setCanvasDragDebug: (drag) => set({ canvasDragDebug: drag }),
    flashSnapTargets: (ids) => {
      const unique = [...new Set(ids)]
      if (unique.length === 0) return

      if (snapFlashTimer) clearTimeout(snapFlashTimer)
      set({ snapFlashIds: unique })
      snapFlashTimer = setTimeout(() => {
        set({ snapFlashIds: [] })
        snapFlashTimer = null
      }, SNAP_FLASH_MS)
    },
    setSliderColumnCount: (count) => {
      const columns = clampSliderColumns(count)
      set((s) => ({
        sliderColumnCount: columns,
        uiSizes: {
          ...s.uiSizes,
          sliders: slidersPanelSize(columns),
        },
      }))
    },
    setImagePreviewModules: (modules) => {
      const clamped = clampImageModules(modules)
      set((s) => ({
        imagePreviewModules: clamped,
        uiSizes: {
          ...s.uiSizes,
          image: imagePanelSize(clamped),
        },
      }))
    },
    setCanvasResolutionScale: (scale) =>
      set({ canvasResolutionScale: clampCanvasResolutionScale(scale) }),
    initializeLayout: (positions, sizes) =>
      set({ uiPositions: positions, uiSizes: sizes }),
  }))
}
