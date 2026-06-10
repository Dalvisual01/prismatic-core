import { create, type StoreApi, type UseBoundStore } from "zustand"
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
  toggleWorkspaceMode: () => void
  setWorkspaceMode: (enabled: boolean) => void
  setUiGroupSize: (id: PanelId, size: PanelSize) => void
  setUiGroupPosition: (id: PanelId, position: PixelPosition) => void
  setUiDragDebug: (drag: PanelDragDebug | null) => void
  setCanvasDragDebug: (drag: CanvasDragDebug | null) => void
  flashSnapTargets: (ids: PanelId[]) => void
  setSliderColumnCount: (count: number) => void
  setImagePreviewModules: (modules: number) => void
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
}

export function createPrismaticStore(
  init: PrismaticStoreInit = {},
): UseBoundStore<StoreApi<PrismaticStoreState>> {
  const sliderColumns = init.sliderColumnCount ?? defaultSliderColumns()
  const imageModules = init.imagePreviewModules ?? defaultImageModules()

  return create<PrismaticStoreState>((set) => ({
    workspaceMode: init.workspaceMode ?? false,
    uiPositions: init.initialPositions ?? {},
    uiSizes: init.initialSizes ?? {},
    uiDragDebug: null,
    canvasDragDebug: null,
    snapFlashIds: [],
    sliderColumnCount: sliderColumns,
    imagePreviewModules: imageModules,
    toggleWorkspaceMode: () =>
      set((s) => ({ workspaceMode: !s.workspaceMode })),
    setWorkspaceMode: (enabled) => set({ workspaceMode: enabled }),
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
    initializeLayout: (positions, sizes) =>
      set({ uiPositions: positions, uiSizes: sizes }),
  }))
}
