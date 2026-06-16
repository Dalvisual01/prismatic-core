import * as react from 'react';
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import p5 from 'p5';

type PrismaticBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
declare const PRISMATIC_BLEND_MODES: PrismaticBlendMode[];
/** Six base colours — everything else is derived automatically. */
type PrismaticPalette = {
    /** App page background. */
    background: string;
    /** Control chrome — sliders, canvas frame. */
    surface: string;
    /** Text, strokes, borders. */
    foreground: string;
    /** Active / hover emphasis fills. */
    accent: string;
    /** Text on accent fills — button hover, active radio, etc. */
    onAccent: string;
    /** Muted fill — slider pill, inactive radio rows. */
    muted: string;
};
type PrismaticPaletteToken = keyof PrismaticPalette;
type PrismaticPaletteBlendModes = Record<PrismaticPaletteToken, PrismaticBlendMode>;
declare const PRISMATIC_PALETTE_TOKEN_KEYS: readonly ["background", "surface", "foreground", "accent", "onAccent", "muted"];
declare const PRISMATIC_PALETTE_TOKEN_LABELS: Record<PrismaticPaletteToken, string>;
declare const DEFAULT_PRISMATIC_PALETTE: PrismaticPalette;
declare const DEFAULT_PRISMATIC_PALETTE_BLEND_MODES: PrismaticPaletteBlendModes;
/** Derived token set consumed by components (do not edit manually). */
type PrismaticTheme = {
    appBackground: string;
    canvasBackground: string;
    surface: string;
    surfaceMuted: string;
    surfaceActive: string;
    borderSubtle: string;
    textPrimary: string;
    textMuted: string;
    textOnActive: string;
    accentStroke: string;
    overlayBackground: string;
    gridLine: string;
    imageMetaBackground: string;
    imageMetaBackgroundHover: string;
};
type PrismaticThemeToken = keyof PrismaticTheme;
type PrismaticThemeBlendModes = Record<PrismaticThemeToken, PrismaticBlendMode>;
type PrismaticThemeInput = {
    palette?: Partial<PrismaticPalette>;
    paletteBlendModes?: Partial<PrismaticPaletteBlendModes>;
} | {
    colors?: Partial<PrismaticTheme>;
    blendModes?: Partial<PrismaticThemeBlendModes>;
};
declare const PRISMATIC_THEME_CSS_VARS: {
    readonly appBackground: "--prismatic-app-bg";
    readonly canvasBackground: "--prismatic-canvas-bg";
    readonly surface: "--prismatic-surface";
    readonly surfaceMuted: "--prismatic-surface-muted";
    readonly surfaceActive: "--prismatic-surface-active";
    readonly borderSubtle: "--prismatic-border-subtle";
    readonly textPrimary: "--prismatic-text-primary";
    readonly textMuted: "--prismatic-text-muted";
    readonly textOnActive: "--prismatic-text-on-active";
    readonly accentStroke: "--prismatic-accent-stroke";
    readonly overlayBackground: "--prismatic-overlay-bg";
    readonly gridLine: "--prismatic-grid-line";
    readonly imageMetaBackground: "--prismatic-image-meta-bg";
    readonly imageMetaBackgroundHover: "--prismatic-image-meta-bg-hover";
};
type RgbColor = {
    r: number;
    g: number;
    b: number;
    a: number;
};
declare function parseColor(value: string): RgbColor;
declare function resolvePrismaticPalette(palette?: Partial<PrismaticPalette>): PrismaticPalette;
declare function deriveThemeFromPalette(palette: PrismaticPalette): PrismaticTheme;
declare const DEFAULT_PRISMATIC_THEME: PrismaticTheme;
declare const DEFAULT_PRISMATIC_THEME_BLEND_MODES: PrismaticThemeBlendModes;
declare function normalizeThemeInput(theme?: Partial<PrismaticTheme> | PrismaticThemeInput): {
    palette: PrismaticPalette;
    paletteBlendModes: PrismaticPaletteBlendModes;
    colors: PrismaticTheme;
    blendModes: PrismaticThemeBlendModes;
};
declare function resolvePrismaticTheme(theme?: Partial<PrismaticTheme>): PrismaticTheme;
declare function formatPrismaticThemeCss(colors: PrismaticTheme, blendModes?: PrismaticThemeBlendModes, palette?: PrismaticPalette, paletteBlendModes?: PrismaticPaletteBlendModes): string;
type PrismaticColorMode = "default" | "sand";
declare const PRISMATIC_COLOR_MODES: readonly ["default", "sand"];
declare const PRISMATIC_COLOR_MODE_THEMES: Record<PrismaticColorMode, PrismaticThemeInput>;
type PrismaticThemePreset = {
    id: PrismaticColorMode;
    label: string;
    theme: PrismaticThemeInput;
};
/** @deprecated Use `PRISMATIC_COLOR_MODES` and `colorMode` on `PrismaticConfig`. */
declare const PRISMATIC_THEME_PRESETS: PrismaticThemePreset[];
declare function getRuntimeTheme(): PrismaticTheme;
declare function getRuntimeThemeBlendModes(): PrismaticThemeBlendModes;
declare function getRuntimePalette(): PrismaticPalette;
/** Squircle corner utilities from `@prismatic/core/style.css` — same presets as Slider. */
declare const PRISMATIC_CORNERS_CLASS = "prismatic-corners";
declare const PRISMATIC_CORNERS_INNER_CLASS = "prismatic-corners-inner";
declare const PRISMATIC_CORNERS_INNER_SM_CLASS = "prismatic-corners-inner-sm";
declare const PRISMATIC_CORNERS_CANVAS_FRAME_CLASS = "prismatic-corners-canvas-frame";

type PrismaticConfig = {
    workspace?: {
        /** Enable workspace layout mode (toggle via keyboard shortcut). */
        enabled?: boolean;
        margin?: number;
        moduleSize?: number;
        layoutGap?: number;
        snapThreshold?: number;
        collisionGap?: number;
        /** Panel IDs excluded from snap targets (e.g. auto-placed help icon). */
        snapExcludedPanelIds?: string[];
    };
    canvas?: {
        minZoom?: number;
        maxZoom?: number;
        zoomStep?: number;
        /** Cursor spotlight mask when not in workspace mode. */
        spotlight?: boolean;
        downloadFilePrefix?: string;
    };
    shortcuts?: {
        toggleWorkspace?: string;
        resetCanvasView?: string;
    };
    layout?: {
        imagePreviewModules?: readonly number[];
        defaultImageModules?: number;
        sliderColumnModules?: number;
        minSliderColumns?: number;
        maxSliderColumns?: number;
        defaultSliderColumns?: number;
        sliderItemHeight?: number;
        imageDesignSize?: number;
    };
    /** Built-in colour mode. Use this in consumer projects instead of custom theme CSS. */
    colorMode?: PrismaticColorMode;
    /** Advanced palette or token overrides. Prefer `colorMode` for the built-in looks. */
    theme?: Partial<PrismaticTheme> | PrismaticThemeInput;
};
type ResolvedPrismaticConfig = {
    workspace: Required<Omit<NonNullable<PrismaticConfig["workspace"]>, "snapExcludedPanelIds">> & {
        snapExcludedPanelIds: Set<string>;
    };
    canvas: Required<NonNullable<PrismaticConfig["canvas"]>>;
    shortcuts: Required<NonNullable<PrismaticConfig["shortcuts"]>>;
    layout: Required<NonNullable<PrismaticConfig["layout"]>>;
    colorMode: PrismaticColorMode;
    palette: PrismaticPalette;
    paletteBlendModes: PrismaticPaletteBlendModes;
    theme: PrismaticTheme;
    themeBlendModes: PrismaticThemeBlendModes;
};
declare const DEFAULT_PRISMATIC_CONFIG: ResolvedPrismaticConfig;
declare function resolvePrismaticConfig(config?: PrismaticConfig): ResolvedPrismaticConfig;

type PanelId = string;
type PixelPosition = {
    x: number;
    y: number;
};
type PanelSize = {
    width: number;
    height: number;
};
type PanelRect = PixelPosition & PanelSize;
/** @deprecated Use PanelId */
type UiGroupId = PanelId;
/** @deprecated Use PanelSize */
type UiGroupSize = PanelSize;
/** @deprecated Use PanelRect */
type UiGroupRect = PanelRect;

type PanelDragDebug$1 = {
    id: PanelId;
    raw: PixelPosition;
    snapped: PixelPosition;
};
type CanvasDragDebug = {
    raw: PixelPosition;
    snapped: PixelPosition;
    rect: PanelRect;
    activeLines: {
        x: number | null;
        y: number | null;
    };
};
type PrismaticStoreState = {
    workspaceMode: boolean;
    uiPositions: Record<PanelId, PixelPosition>;
    uiSizes: Record<PanelId, PanelSize>;
    uiDragDebug: PanelDragDebug$1 | null;
    canvasDragDebug: CanvasDragDebug | null;
    snapFlashIds: PanelId[];
    sliderColumnCount: number;
    imagePreviewModules: number;
    toggleWorkspaceMode: () => void;
    setWorkspaceMode: (enabled: boolean) => void;
    setUiGroupSize: (id: PanelId, size: PanelSize) => void;
    setUiGroupPosition: (id: PanelId, position: PixelPosition) => void;
    setUiDragDebug: (drag: PanelDragDebug$1 | null) => void;
    setCanvasDragDebug: (drag: CanvasDragDebug | null) => void;
    flashSnapTargets: (ids: PanelId[]) => void;
    setSliderColumnCount: (count: number) => void;
    setImagePreviewModules: (modules: number) => void;
    initializeLayout: (positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>) => void;
};
type PrismaticStoreInit = {
    initialPositions?: Record<PanelId, PixelPosition>;
    initialSizes?: Record<PanelId, PanelSize>;
    workspaceMode?: boolean;
    sliderColumnCount?: number;
    imagePreviewModules?: number;
};
declare function createPrismaticStore(init?: PrismaticStoreInit): UseBoundStore<StoreApi<PrismaticStoreState>>;

type PrismaticProviderProps = {
    config?: PrismaticConfig;
    storeInit?: PrismaticStoreInit;
    children: ReactNode;
};
declare function PrismaticProvider({ config, storeInit, children, }: PrismaticProviderProps): react.JSX.Element;

declare function usePrismaticStore(): UseBoundStore<StoreApi<PrismaticStoreState>>;
declare function useWorkspaceMode(): boolean;
declare function usePanelPosition(id: string): PixelPosition;

type PreviewKind = "image" | "video";
type P5WithSketch = p5 & {
    updateImage?: (img: p5.Image) => void;
    updateVideo?: (url: string) => void;
};
type SketchFactory = (p: P5WithSketch) => void;

type CreativeCanvasHandle = {
    loadSource: (url: string, kind: PreviewKind) => void;
    saveCanvas: (filename?: string) => void;
};
type CreativeCanvasProps = {
    createSketch: SketchFactory;
};
declare const CreativeCanvas: react.ForwardRefExoticComponent<CreativeCanvasProps & react.RefAttributes<CreativeCanvasHandle>>;

type WorkspacePanelContextValue = {
    id: PanelId;
    hovered: boolean;
};
declare function useWorkspacePanel(): WorkspacePanelContextValue | null;
/** @deprecated Use useWorkspacePanel */
declare const useWorkspaceGroup: typeof useWorkspacePanel;
type WorkspacePanelProps = {
    id: PanelId;
    children: ReactNode;
    className?: string;
};
declare function WorkspacePanel({ id, children, className }: WorkspacePanelProps): react.JSX.Element;
/** @deprecated Use WorkspacePanel */
declare const WorkspaceGroup: typeof WorkspacePanel;

type WorkspaceShellProps = {
    children: ReactNode;
    showDebugOverlay?: boolean;
};
declare function WorkspaceShell({ children, showDebugOverlay, }: WorkspaceShellProps): react.JSX.Element;

declare function WorkspaceDebugOverlay(): react.JSX.Element | null;

type FloatingHelpProps = {
    id?: string;
    fallbackPosition: PixelPosition;
    tooltip: (workspaceMode: boolean) => ReactNode;
    ariaLabel?: string;
};
declare function FloatingHelp({ id, fallbackPosition, tooltip, ariaLabel, }: FloatingHelpProps): react.JSX.Element;

/** Pixel side length when `ImageComponent` is rendered inside `ImagePanel`. */
declare function useImagePanelSize(): number | null;
type ImagePanelProps = {
    children: ReactNode;
    panelId?: string;
};
declare function ImagePanel({ children, panelId }: ImagePanelProps): react.JSX.Element;

type SlidersPanelProps = {
    children: ReactNode;
    panelId?: string;
};
declare function SlidersPanel({ children, panelId }: SlidersPanelProps): react.JSX.Element;

declare const BUTTON_TEXT_LG = "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase";
declare const BUTTON_ELLIPSE_WIDTH = 274;
declare const BUTTON_ELLIPSE_HEIGHT = 120;
type ButtonEllipseVisualProps = {
    active: boolean;
    children: ReactNode;
    width?: number;
    height?: number;
    className?: string;
};
declare function ButtonEllipseVisual({ active, children, width, height, className, }: ButtonEllipseVisualProps): react.JSX.Element;
type ButtonProps = {
    children: ReactNode;
    width?: number;
    height?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>;
declare function Button({ children, width, height, className, type, disabled, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest }: ButtonProps): react.JSX.Element;

type SliderProps = {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    displayValue?: (value: number) => string;
    onChange: (value: number) => void;
    /** URL for the top drag handle graphic (optional). */
    lineTopSrc?: string;
    /** URL for the bottom drag handle graphic (optional). */
    lineBottomSrc?: string;
};
declare function Slider({ label, value, min, max, step, displayValue, onChange, lineTopSrc, lineBottomSrc, }: SliderProps): react.JSX.Element;

type RadioProps = {
    items: string[];
    value?: number;
    defaultActiveIndex?: number;
    onChange?: (index: number) => void;
    className?: string;
};
declare function Radio({ items, value, defaultActiveIndex, onChange, className, }: RadioProps): react.JSX.Element;

type ImageComponentProps = {
    src: string;
    kind: PreviewKind;
    fileName: string;
    sizeKB: number;
    /** Required when used outside `ImagePanel`. Inside `ImagePanel`, size follows the panel. */
    size?: number;
    onReplace: (file: File) => void;
};
declare function ImageComponent({ src, kind, fileName, sizeKB, size, onReplace, }: ImageComponentProps): react.JSX.Element;

declare function windowMargin(): number;
declare function snapThreshold(): number;
declare function isSnapParticipant(id: PanelId): boolean;
declare function isUiPositionClear(draggedId: PanelId, position: PixelPosition, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, gap?: number): boolean;
type Viewport = {
    width: number;
    height: number;
};
declare function snapScalar(value: number, targets: number[], threshold: number): number;
type SnapGuides = {
    x: number[];
    y: number[];
};
type VisualSnapGuides = {
    x: number[];
    y: number[];
};
type DistributionGuide = {
    axis: "x" | "y";
    cross: number;
    gapA: {
        from: number;
        to: number;
    };
    gapB: {
        from: number;
        to: number;
    };
};
declare function clampToWorkspaceBounds(position: PixelPosition, size: PanelSize, viewport: Viewport): PixelPosition;
declare function isSnappedToTopMargin(y: number): boolean;
declare function getWindowMarginRect(viewport: Viewport): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};
declare function collectSnapTargets(draggedId: PanelId, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): SnapGuides;
declare function collectWorkspaceSnapLines(positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): VisualSnapGuides;
declare function getActiveDistributionGuides(draggedId: PanelId, raw: PixelPosition, snapped: PixelPosition, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): DistributionGuide[];
declare function getActiveVisualSnapLines(draggedId: PanelId, raw: PixelPosition, snapped: PixelPosition, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): {
    x: number | null;
    y: number | null;
};
declare function samePanelIds(a: PanelId[], b: PanelId[]): boolean;
/** @deprecated Use samePanelIds */
declare const sameUiGroupIds: typeof samePanelIds;
declare function getSnapTargetIds(draggedId: PanelId, raw: PixelPosition, snapped: PixelPosition, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): PanelId[];
declare function snapPosition(draggedId: PanelId, target: PixelPosition, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): PixelPosition;

declare function getCanvasScreenRect(pan: PixelPosition, zoom: number, size: PanelSize, viewport: Viewport): PanelRect;
declare function collectCanvasPanSnapTargets(zoom: number, canvasSize: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): {
    xLines: number[];
    yLines: number[];
    x: number[];
    y: number[];
};
declare function snapCanvasPan(pan: PixelPosition, zoom: number, canvasSize: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): PixelPosition;
declare function getActiveCanvasSnapLines(rawPan: PixelPosition, snappedPan: PixelPosition, zoom: number, canvasSize: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): {
    x: number | null;
    y: number | null;
};
declare function getCanvasSnapTargetIds(rawPan: PixelPosition, snappedPan: PixelPosition, zoom: number, canvasSize: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, viewport: Viewport): PanelId[];

declare function layoutGap(): number;
declare function moduleSize(): number;
/** @deprecated Use layoutGap() */
declare const LAYOUT_GAP = 4;
/** @deprecated Use moduleSize() */
declare const MODULE = 70;
declare function moduleSpanPx(modules: number): number;

type PanelLayoutEntry = {
    id: PanelId;
    size: PanelSize;
};
/**
 * Place panels in a simple top-to-bottom, left-to-right grid within margins.
 * Apps can provide custom layout functions for domain-specific arrangements.
 */
declare function createGridLayout(panels: PanelLayoutEntry[], viewportWidth?: number, viewportHeight?: number, gap?: number): Record<PanelId, PixelPosition>;
declare function mergePanelSizes(sizes: Record<PanelId, PanelSize>, overrides: Partial<Record<PanelId, PanelSize>>): Record<PanelId, PanelSize>;

declare const IMAGE_PREVIEW_MODULES: readonly [3, 5, 6];
type ImagePreviewModules = (typeof IMAGE_PREVIEW_MODULES)[number];
declare const DEFAULT_IMAGE_MODULES: ImagePreviewModules;
declare const IMAGE_DESIGN_SIZE = 436;
declare function imagePreviewSizePx(modules: number): number;
declare function imagePanelSize(modules: number): PanelSize;
declare function clampImageModules(modules: number): number;
declare function imageModulesFromSize(px: number): number;
declare function imageComponentMetrics(size: number): {
    metaWidth: number;
    metaHeight: number | undefined;
    replaceHeight: number;
    blur: number;
    paddingX: number;
    paddingY: number;
    showFileSize: boolean;
    compactFilename: boolean;
};

declare const DEFAULT_SLIDER_COLUMNS = 1;
declare const SLIDER_COUNT = 8;
declare function sliderColumnWidthPx(): number;
declare function slidersPanelSize(columnCount: number, sliderCount?: number): {
    width: number;
    height: number;
};
declare function clampSliderColumns(count: number): number;
declare function columnCountFromWidth(width: number): number;
declare function chunkIntoColumns<T>(items: T[], columnCount: number): T[][];

type PanelDragDebug = {
    id: PanelId;
    raw: PixelPosition;
    snapped: PixelPosition;
};
declare function findAutoPlacedPosition(panelId: PanelId, current: PixelPosition | null, size: PanelSize, positions: Record<PanelId, PixelPosition>, sizes: Record<PanelId, PanelSize>, dragDebug: PanelDragDebug | null, viewport: Viewport, fallbackPosition: PixelPosition): PixelPosition;
/** @deprecated Use findAutoPlacedPosition */
declare const findShortcutsPosition: typeof findAutoPlacedPosition;

export { BUTTON_ELLIPSE_HEIGHT, BUTTON_ELLIPSE_WIDTH, BUTTON_TEXT_LG, Button, ButtonEllipseVisual, type ButtonEllipseVisualProps, type ButtonProps, type CanvasDragDebug, CreativeCanvas, type CreativeCanvasHandle, type CreativeCanvasProps, DEFAULT_IMAGE_MODULES, DEFAULT_PRISMATIC_CONFIG, DEFAULT_PRISMATIC_PALETTE, DEFAULT_PRISMATIC_PALETTE_BLEND_MODES, DEFAULT_PRISMATIC_THEME, DEFAULT_PRISMATIC_THEME_BLEND_MODES, DEFAULT_SLIDER_COLUMNS, type DistributionGuide, FloatingHelp, IMAGE_DESIGN_SIZE, IMAGE_PREVIEW_MODULES, ImageComponent, type ImageComponentProps, ImagePanel, LAYOUT_GAP, MODULE, type P5WithSketch, PRISMATIC_BLEND_MODES, PRISMATIC_COLOR_MODES, PRISMATIC_COLOR_MODE_THEMES, PRISMATIC_CORNERS_CANVAS_FRAME_CLASS, PRISMATIC_CORNERS_CLASS, PRISMATIC_CORNERS_INNER_CLASS, PRISMATIC_CORNERS_INNER_SM_CLASS, PRISMATIC_PALETTE_TOKEN_KEYS, PRISMATIC_PALETTE_TOKEN_LABELS, PRISMATIC_THEME_CSS_VARS, PRISMATIC_THEME_PRESETS, type PanelDragDebug$1 as PanelDragDebug, type PanelId, type PanelLayoutEntry, type PanelRect, type PanelSize, type PixelPosition, type PreviewKind, type PrismaticBlendMode, type PrismaticColorMode, type PrismaticConfig, type PrismaticPalette, type PrismaticPaletteBlendModes, type PrismaticPaletteToken, PrismaticProvider, type PrismaticProviderProps, type PrismaticStoreInit, type PrismaticStoreState, type PrismaticTheme, type PrismaticThemeBlendModes, type PrismaticThemeInput, type PrismaticThemePreset, type PrismaticThemeToken, Radio, type RadioProps, type ResolvedPrismaticConfig, type RgbColor, SLIDER_COUNT, type SketchFactory, Slider, type SliderProps, SlidersPanel, type SnapGuides, type UiGroupId, type UiGroupRect, type UiGroupSize, type Viewport, type VisualSnapGuides, WorkspaceDebugOverlay, WorkspaceGroup, WorkspacePanel, type WorkspacePanelProps, WorkspaceShell, type WorkspaceShellProps, chunkIntoColumns, clampImageModules, clampSliderColumns, clampToWorkspaceBounds, collectCanvasPanSnapTargets, collectSnapTargets, collectWorkspaceSnapLines, columnCountFromWidth, createGridLayout, createPrismaticStore, deriveThemeFromPalette, findAutoPlacedPosition, findShortcutsPosition, formatPrismaticThemeCss, getActiveCanvasSnapLines, getActiveDistributionGuides, getActiveVisualSnapLines, getCanvasScreenRect, getCanvasSnapTargetIds, getRuntimePalette, getRuntimeTheme, getRuntimeThemeBlendModes, getSnapTargetIds, getWindowMarginRect, imageComponentMetrics, imageModulesFromSize, imagePanelSize, imagePreviewSizePx, isSnapParticipant, isSnappedToTopMargin, isUiPositionClear, layoutGap, mergePanelSizes, moduleSize, moduleSpanPx, normalizeThemeInput, parseColor, resolvePrismaticConfig, resolvePrismaticPalette, resolvePrismaticTheme, samePanelIds, sameUiGroupIds, sliderColumnWidthPx, slidersPanelSize, snapCanvasPan, snapPosition, snapScalar, snapThreshold, useImagePanelSize, usePanelPosition, usePrismaticStore, useWorkspaceGroup, useWorkspaceMode, useWorkspacePanel, windowMargin };
