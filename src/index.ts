// Config
export {
  DEFAULT_PRISMATIC_CONFIG,
  resolvePrismaticConfig,
  type PrismaticConfig,
  type ResolvedPrismaticConfig,
} from "./config"

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
export { ImagePanel } from "./components/panels/ImagePanel"
export { SlidersPanel } from "./components/panels/SlidersPanel"

// UI primitives
export { Button, type ButtonProps, type ButtonVariant } from "./components/ui/Button"
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
