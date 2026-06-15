import {
  DEFAULT_PRISMATIC_PALETTE,
  DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
  DEFAULT_PRISMATIC_THEME,
  DEFAULT_PRISMATIC_THEME_BLEND_MODES,
  PRISMATIC_COLOR_MODE_THEMES,
  normalizeThemeInput,
  setRuntimePalette,
  setRuntimeTheme,
  type PrismaticColorMode,
  type PrismaticPalette,
  type PrismaticPaletteBlendModes,
  type PrismaticTheme,
  type PrismaticThemeBlendModes,
  type PrismaticThemeInput,
} from "./theme/tokens"

export type {
  PrismaticColorMode,
  PrismaticPalette,
  PrismaticPaletteBlendModes,
  PrismaticTheme,
  PrismaticThemeInput,
  PrismaticThemeBlendModes,
}

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
  /** Built-in colour mode. Use this in consumer projects instead of custom theme CSS. */
  colorMode?: PrismaticColorMode
  /** Advanced palette or token overrides. Prefer `colorMode` for the built-in looks. */
  theme?: Partial<PrismaticTheme> | PrismaticThemeInput
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
  colorMode: PrismaticColorMode
  palette: PrismaticPalette
  paletteBlendModes: PrismaticPaletteBlendModes
  theme: PrismaticTheme
  themeBlendModes: PrismaticThemeBlendModes
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
  colorMode: "default",
  palette: DEFAULT_PRISMATIC_PALETTE,
  paletteBlendModes: DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
  theme: DEFAULT_PRISMATIC_THEME,
  themeBlendModes: DEFAULT_PRISMATIC_THEME_BLEND_MODES,
}

export function resolvePrismaticConfig(
  config?: PrismaticConfig,
): ResolvedPrismaticConfig {
  const excluded = config?.workspace?.snapExcludedPanelIds ??
    [...DEFAULT_PRISMATIC_CONFIG.workspace.snapExcludedPanelIds]
  const colorMode = config?.colorMode ?? "default"
  const themeInput =
    config?.theme ?? PRISMATIC_COLOR_MODE_THEMES[colorMode]
  const { palette, paletteBlendModes, colors, blendModes } =
    normalizeThemeInput(themeInput)

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
    colorMode,
    palette,
    paletteBlendModes,
    theme: colors,
    themeBlendModes: blendModes,
  }
}

let runtimeConfig = DEFAULT_PRISMATIC_CONFIG

export function setRuntimeConfig(config: ResolvedPrismaticConfig) {
  runtimeConfig = config
  setRuntimePalette(config.palette, config.paletteBlendModes)
  setRuntimeTheme(config.theme, config.themeBlendModes)
}

export function getRuntimeConfig(): ResolvedPrismaticConfig {
  return runtimeConfig
}
