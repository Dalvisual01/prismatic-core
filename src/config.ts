export type PrismaticConfig = {
  workspace?: {
    /** Enable workspace layout mode (toggle via keyboard shortcut). */
    enabled?: boolean
    margin?: number
    moduleSize?: number
    layoutGap?: number
    snapThreshold?: number
    collisionGap?: number
    /** Panel IDs excluded from snap targets (e.g. auto-placed help icon). */
    snapExcludedPanelIds?: string[]
  }
  canvas?: {
    minZoom?: number
    maxZoom?: number
    zoomStep?: number
    /** Cursor spotlight mask when not in workspace mode. */
    spotlight?: boolean
    downloadFilePrefix?: string
  }
  shortcuts?: {
    toggleWorkspace?: string
    resetCanvasView?: string
  }
  layout?: {
    imagePreviewModules?: readonly number[]
    defaultImageModules?: number
    sliderColumnModules?: number
    minSliderColumns?: number
    maxSliderColumns?: number
    defaultSliderColumns?: number
    sliderItemHeight?: number
    imageDesignSize?: number
  }
}

export type ResolvedPrismaticConfig = {
  workspace: Required<
    Omit<NonNullable<PrismaticConfig["workspace"]>, "snapExcludedPanelIds">
  > & {
    snapExcludedPanelIds: Set<string>
  }
  canvas: Required<NonNullable<PrismaticConfig["canvas"]>>
  shortcuts: Required<NonNullable<PrismaticConfig["shortcuts"]>>
  layout: Required<NonNullable<PrismaticConfig["layout"]>>
}

export const DEFAULT_PRISMATIC_CONFIG: ResolvedPrismaticConfig = {
  workspace: {
    enabled: true,
    margin: 20,
    moduleSize: 70,
    layoutGap: 4,
    snapThreshold: 12,
    collisionGap: 4,
    snapExcludedPanelIds: new Set(["shortcuts"]),
  },
  canvas: {
    minZoom: 0.15,
    maxZoom: 12,
    zoomStep: 1.28,
    spotlight: false,
    downloadFilePrefix: "canvas",
  },
  shortcuts: {
    toggleWorkspace: "w",
    resetCanvasView: "r",
  },
  layout: {
    imagePreviewModules: [3, 5, 6],
    defaultImageModules: 6,
    sliderColumnModules: 6,
    minSliderColumns: 1,
    maxSliderColumns: 3,
    defaultSliderColumns: 1,
    sliderItemHeight: 70,
    imageDesignSize: 436,
  },
}

export function resolvePrismaticConfig(
  config?: PrismaticConfig,
): ResolvedPrismaticConfig {
  const excluded = config?.workspace?.snapExcludedPanelIds ??
    [...DEFAULT_PRISMATIC_CONFIG.workspace.snapExcludedPanelIds]

  return {
    workspace: {
      ...DEFAULT_PRISMATIC_CONFIG.workspace,
      ...config?.workspace,
      snapExcludedPanelIds: new Set(excluded),
    },
    canvas: {
      ...DEFAULT_PRISMATIC_CONFIG.canvas,
      ...config?.canvas,
    },
    shortcuts: {
      ...DEFAULT_PRISMATIC_CONFIG.shortcuts,
      ...config?.shortcuts,
    },
    layout: {
      ...DEFAULT_PRISMATIC_CONFIG.layout,
      ...config?.layout,
    },
  }
}

let runtimeConfig = DEFAULT_PRISMATIC_CONFIG

export function setRuntimeConfig(config: ResolvedPrismaticConfig) {
  runtimeConfig = config
}

export function getRuntimeConfig(): ResolvedPrismaticConfig {
  return runtimeConfig
}
