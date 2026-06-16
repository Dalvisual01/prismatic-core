// Config
export {
  DEFAULT_PRISMATIC_CONFIG,
  resolvePrismaticConfig,
  type PrismaticColorMode,
  type PrismaticConfig,
  type PrismaticPalette,
  type PrismaticPaletteBlendModes,
  type PrismaticTheme,
  type PrismaticThemeBlendModes,
  type PrismaticThemeInput,
  type ResolvedPrismaticConfig,
} from "./config"

export {
  DEFAULT_PRISMATIC_PALETTE,
  DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
  DEFAULT_PRISMATIC_THEME,
  DEFAULT_PRISMATIC_THEME_BLEND_MODES,
  PRISMATIC_BLEND_MODES,
  PRISMATIC_COLOR_MODES,
  PRISMATIC_COLOR_MODE_THEMES,
  PRISMATIC_PALETTE_TOKEN_KEYS,
  PRISMATIC_PALETTE_TOKEN_LABELS,
  PRISMATIC_THEME_CSS_VARS,
  PRISMATIC_CORNERS_CLASS,
  PRISMATIC_CORNERS_INNER_CLASS,
  PRISMATIC_CORNERS_INNER_SM_CLASS,
  PRISMATIC_CORNERS_CANVAS_FRAME_CLASS,
  PRISMATIC_THEME_PRESETS,
  deriveThemeFromPalette,
  formatPrismaticThemeCss,
  getRuntimePalette,
  getRuntimeTheme,
  getRuntimeThemeBlendModes,
  normalizeThemeInput,
  parseColor,
  resolvePrismaticPalette,
  resolvePrismaticTheme,
  type PrismaticBlendMode,
  type PrismaticPaletteToken,
  type PrismaticThemePreset,
  type PrismaticThemeToken,
  type RgbColor,
} from "./theme/tokens"

// Provider & store
export { PrismaticProvider, type PrismaticProviderProps } from "./provider/PrismaticProvider"
export {
  createPrismaticStore,
  type CanvasDragDebug,
  type PanelDragDebug,
  type PrismaticStoreInit,
  type PrismaticStoreState,
} from "./store/createPrismaticStore"
export {
  usePanelPosition,
  usePrismaticStore,
  useWorkspaceMode,
} from "./hooks/usePrismaticStore"

// Canvas
export {
  CreativeCanvas,
  type CreativeCanvasHandle,
  type CreativeCanvasProps,
} from "./canvas/CreativeCanvas"
export type { P5WithSketch, PreviewKind, SketchFactory } from "./canvas/types"

// Workspace shell
export {
  WorkspacePanel,
  WorkspaceGroup,
  useWorkspacePanel,
  useWorkspaceGroup,
  type WorkspacePanelProps,
} from "./components/WorkspacePanel"
export { WorkspaceShell, type WorkspaceShellProps } from "./components/WorkspaceShell"
export { WorkspaceDebugOverlay } from "./components/WorkspaceDebugOverlay"
export { FloatingHelp } from "./components/FloatingHelp"

// Panels
export { ImagePanel, useImagePanelSize } from "./components/panels/ImagePanel"
export { SlidersPanel } from "./components/panels/SlidersPanel"

// UI primitives
export { Button, type ButtonProps, ButtonEllipseVisual, type ButtonEllipseVisualProps, BUTTON_TEXT_LG, BUTTON_ELLIPSE_WIDTH, BUTTON_ELLIPSE_HEIGHT } from "./components/ui/Button"
export { Slider, type SliderProps } from "./components/ui/Slider"
export { Radio, type RadioProps } from "./components/ui/Radio"
export {
  ImageComponent,
  type ImageComponentProps,
} from "./components/ui/ImageComponent"

// Workspace utilities
export type {
  PanelId,
  PanelRect,
  PanelSize,
  PixelPosition,
  UiGroupId,
  UiGroupRect,
  UiGroupSize,
} from "./workspace/types"
export {
  clampToWorkspaceBounds,
  collectSnapTargets,
  collectWorkspaceSnapLines,
  getActiveDistributionGuides,
  getActiveVisualSnapLines,
  getSnapTargetIds,
  getWindowMarginRect,
  isSnapParticipant,
  isSnappedToTopMargin,
  isUiPositionClear,
  samePanelIds,
  sameUiGroupIds,
  snapPosition,
  snapScalar,
  windowMargin,
  snapThreshold,
  type DistributionGuide,
  type SnapGuides,
  type Viewport,
  type VisualSnapGuides,
} from "./workspace/snap"
export {
  collectCanvasPanSnapTargets,
  getActiveCanvasSnapLines,
  getCanvasScreenRect,
  getCanvasSnapTargetIds,
  snapCanvasPan,
} from "./workspace/canvasSnap"
export { layoutGap, moduleSize, moduleSpanPx, LAYOUT_GAP, MODULE } from "./workspace/modules"
export {
  createGridLayout,
  mergePanelSizes,
  type PanelLayoutEntry,
} from "./workspace/layout"
export {
  clampImageModules,
  imageComponentMetrics,
  imageModulesFromSize,
  imagePanelSize,
  imagePreviewSizePx,
  DEFAULT_IMAGE_MODULES,
  IMAGE_DESIGN_SIZE,
  IMAGE_PREVIEW_MODULES,
} from "./workspace/imageLayout"
export {
  chunkIntoColumns,
  clampSliderColumns,
  columnCountFromWidth,
  DEFAULT_SLIDER_COLUMNS,
  sliderColumnWidthPx,
  slidersPanelSize,
  SLIDER_COUNT,
} from "./workspace/slidersLayout"
export { findAutoPlacedPosition, findShortcutsPosition } from "./workspace/shortcutsLayout"
