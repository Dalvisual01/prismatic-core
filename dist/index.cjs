'use strict';

var react = require('react');
var zustand = require('zustand');
var jsxRuntime = require('react/jsx-runtime');
var p5 = require('p5');
var reactDom = require('react-dom');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var p5__default = /*#__PURE__*/_interopDefault(p5);

// src/config.ts
var DEFAULT_PRISMATIC_CONFIG = {
  workspace: {
    enabled: true,
    margin: 20,
    moduleSize: 70,
    layoutGap: 4,
    snapThreshold: 12,
    collisionGap: 4,
    snapExcludedPanelIds: /* @__PURE__ */ new Set(["shortcuts"])
  },
  canvas: {
    minZoom: 0.15,
    maxZoom: 12,
    zoomStep: 1.28,
    spotlight: false,
    downloadFilePrefix: "canvas"
  },
  shortcuts: {
    toggleWorkspace: "w",
    resetCanvasView: "r"
  },
  layout: {
    imagePreviewModules: [3, 5, 6],
    defaultImageModules: 6,
    sliderColumnModules: 6,
    minSliderColumns: 1,
    maxSliderColumns: 3,
    defaultSliderColumns: 1,
    sliderItemHeight: 70,
    imageDesignSize: 436
  }
};
function resolvePrismaticConfig(config) {
  const excluded = config?.workspace?.snapExcludedPanelIds ?? [...DEFAULT_PRISMATIC_CONFIG.workspace.snapExcludedPanelIds];
  return {
    workspace: {
      ...DEFAULT_PRISMATIC_CONFIG.workspace,
      ...config?.workspace,
      snapExcludedPanelIds: new Set(excluded)
    },
    canvas: {
      ...DEFAULT_PRISMATIC_CONFIG.canvas,
      ...config?.canvas
    },
    shortcuts: {
      ...DEFAULT_PRISMATIC_CONFIG.shortcuts,
      ...config?.shortcuts
    },
    layout: {
      ...DEFAULT_PRISMATIC_CONFIG.layout,
      ...config?.layout
    }
  };
}
var runtimeConfig = DEFAULT_PRISMATIC_CONFIG;
function setRuntimeConfig(config) {
  runtimeConfig = config;
}
function getRuntimeConfig() {
  return runtimeConfig;
}

// src/workspace/modules.ts
function layoutGap() {
  return getRuntimeConfig().workspace.layoutGap;
}
function moduleSize() {
  return getRuntimeConfig().workspace.moduleSize;
}
var LAYOUT_GAP = 4;
var MODULE = 70;
function moduleSpanPx(modules) {
  if (modules <= 0) return 0;
  const mod = moduleSize();
  const gap = layoutGap();
  return modules * mod + (modules - 1) * gap;
}

// src/workspace/imageLayout.ts
function imagePreviewModulesList() {
  return getRuntimeConfig().layout.imagePreviewModules;
}
function defaultImageModules() {
  return getRuntimeConfig().layout.defaultImageModules;
}
function imageDesignSize() {
  return getRuntimeConfig().layout.imageDesignSize;
}
var IMAGE_PREVIEW_MODULES = [3, 5, 6];
var MIN_IMAGE_MODULES = IMAGE_PREVIEW_MODULES[0];
IMAGE_PREVIEW_MODULES[IMAGE_PREVIEW_MODULES.length - 1];
var DEFAULT_IMAGE_MODULES = 6;
var IMAGE_DESIGN_SIZE = 436;
function imagePreviewSizePx(modules) {
  return moduleSpanPx(clampImageModules(modules));
}
function imagePanelSize(modules) {
  const side = imagePreviewSizePx(modules);
  return { width: side, height: side };
}
function clampImageModules(modules) {
  const allowed = [...imagePreviewModulesList()];
  let best = allowed[0] ?? 3;
  let bestDist = Infinity;
  for (const candidate of allowed) {
    const dist = Math.abs(candidate - modules);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}
function imageModulesFromSize(px) {
  const allowed = [...imagePreviewModulesList()];
  let best = allowed[0] ?? 3;
  let bestDist = Infinity;
  for (const modules of allowed) {
    const side = imagePreviewSizePx(modules);
    const dist = Math.abs(side - px);
    if (dist < bestDist) {
      bestDist = dist;
      best = modules;
    }
  }
  return best;
}
function imageComponentMetrics(size) {
  const design = imageDesignSize();
  const r = size / design;
  const smallestSize = imagePreviewSizePx(MIN_IMAGE_MODULES);
  const showFileSize = size >= design;
  const compactFilename = size <= smallestSize;
  return {
    metaWidth: Math.round(274 * r),
    metaHeight: showFileSize ? Math.round(70 * r) : void 0,
    replaceHeight: Math.round(120 * r),
    blur: Math.max(12, Math.round(44 * r)),
    paddingX: Math.round(20 * r),
    paddingY: Math.round(10 * r),
    showFileSize,
    compactFilename
  };
}

// src/workspace/slidersLayout.ts
var DEFAULT_SLIDER_COLUMNS = 1;
var SLIDER_COUNT = 8;
function sliderColumnModules() {
  return getRuntimeConfig().layout.sliderColumnModules;
}
function minSliderColumns() {
  return getRuntimeConfig().layout.minSliderColumns;
}
function maxSliderColumns() {
  return getRuntimeConfig().layout.maxSliderColumns;
}
function defaultSliderColumns() {
  return getRuntimeConfig().layout.defaultSliderColumns;
}
function sliderItemHeight() {
  return getRuntimeConfig().layout.sliderItemHeight;
}
function sliderColumnWidthPx() {
  return moduleSpanPx(sliderColumnModules());
}
function slidersPerColumn(sliderCount, columnCount) {
  const columns = clampSliderColumns(columnCount);
  if (sliderCount <= 0) return 0;
  return Math.ceil(sliderCount / columns);
}
function slidersPanelHeightPx(columnCount, sliderCount = SLIDER_COUNT) {
  const rows = slidersPerColumn(sliderCount, columnCount);
  if (rows <= 0) return 0;
  const gap = layoutGap();
  const rowH = sliderItemHeight();
  return rows * rowH + (rows - 1) * gap;
}
function slidersPanelSize(columnCount, sliderCount = SLIDER_COUNT) {
  const colW = sliderColumnWidthPx();
  const columns = clampSliderColumns(columnCount);
  const gap = layoutGap();
  return {
    width: columns * colW + Math.max(0, columns - 1) * gap,
    height: slidersPanelHeightPx(columns, sliderCount)
  };
}
function clampSliderColumns(count) {
  return Math.min(maxSliderColumns(), Math.max(minSliderColumns(), count));
}
function columnCountFromWidth(width) {
  const colW = sliderColumnWidthPx();
  const gap = layoutGap();
  const step = colW + gap;
  const estimated = Math.round((width + gap) / step);
  return clampSliderColumns(estimated);
}
function chunkIntoColumns(items, columnCount) {
  const count = clampSliderColumns(columnCount);
  const columns = Array.from({ length: count }, () => []);
  const perCol = Math.ceil(items.length / count);
  let index = 0;
  for (let col = 0; col < count; col++) {
    for (let row = 0; row < perCol && index < items.length; row++) {
      columns[col].push(items[index]);
      index++;
    }
  }
  return columns;
}

// src/store/createPrismaticStore.ts
var SNAP_FLASH_MS = 100;
var snapFlashTimer = null;
function createPrismaticStore(init = {}) {
  const sliderColumns = init.sliderColumnCount ?? defaultSliderColumns();
  const imageModules = init.imagePreviewModules ?? defaultImageModules();
  return zustand.create((set) => ({
    workspaceMode: init.workspaceMode ?? false,
    uiPositions: init.initialPositions ?? {},
    uiSizes: init.initialSizes ?? {},
    uiDragDebug: null,
    canvasDragDebug: null,
    snapFlashIds: [],
    sliderColumnCount: sliderColumns,
    imagePreviewModules: imageModules,
    toggleWorkspaceMode: () => set((s) => ({ workspaceMode: !s.workspaceMode })),
    setWorkspaceMode: (enabled) => set({ workspaceMode: enabled }),
    setUiGroupSize: (id, size) => set((s) => ({
      uiSizes: { ...s.uiSizes, [id]: size }
    })),
    setUiGroupPosition: (id, position) => set((s) => ({
      uiPositions: { ...s.uiPositions, [id]: position }
    })),
    setUiDragDebug: (drag) => set({ uiDragDebug: drag }),
    setCanvasDragDebug: (drag) => set({ canvasDragDebug: drag }),
    flashSnapTargets: (ids) => {
      const unique = [...new Set(ids)];
      if (unique.length === 0) return;
      if (snapFlashTimer) clearTimeout(snapFlashTimer);
      set({ snapFlashIds: unique });
      snapFlashTimer = setTimeout(() => {
        set({ snapFlashIds: [] });
        snapFlashTimer = null;
      }, SNAP_FLASH_MS);
    },
    setSliderColumnCount: (count) => {
      const columns = clampSliderColumns(count);
      set((s) => ({
        sliderColumnCount: columns,
        uiSizes: {
          ...s.uiSizes,
          sliders: slidersPanelSize(columns)
        }
      }));
    },
    setImagePreviewModules: (modules) => {
      const clamped = clampImageModules(modules);
      set((s) => ({
        imagePreviewModules: clamped,
        uiSizes: {
          ...s.uiSizes,
          image: imagePanelSize(clamped)
        }
      }));
    },
    initializeLayout: (positions, sizes) => set({ uiPositions: positions, uiSizes: sizes })
  }));
}
var PrismaticStoreContext = react.createContext(null);
function PrismaticProvider({
  config,
  storeInit,
  children
}) {
  const resolvedConfig = react.useMemo(() => resolvePrismaticConfig(config), [config]);
  const store = react.useMemo(
    () => createPrismaticStore(storeInit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  react.useEffect(() => {
    setRuntimeConfig(resolvedConfig);
  }, [resolvedConfig]);
  return /* @__PURE__ */ jsxRuntime.jsx(PrismaticStoreContext.Provider, { value: store, children });
}
function usePrismaticStore() {
  const store = react.useContext(PrismaticStoreContext);
  if (!store) {
    throw new Error("usePrismaticStore must be used within PrismaticProvider");
  }
  return store;
}
function useWorkspaceMode() {
  const useStore = usePrismaticStore();
  return useStore((s) => s.workspaceMode);
}
function usePanelPosition(id) {
  const useStore = usePrismaticStore();
  return useStore((s) => s.uiPositions[id]);
}

// src/workspace/snap.ts
function windowMargin() {
  return getRuntimeConfig().workspace.margin;
}
function snapThreshold() {
  return getRuntimeConfig().workspace.snapThreshold;
}
function uiCollisionGap() {
  return getRuntimeConfig().workspace.collisionGap;
}
function isSnapParticipant(id) {
  return !getRuntimeConfig().workspace.snapExcludedPanelIds.has(id);
}
function toUiRect(pos, size) {
  return { x: pos.x, y: pos.y, width: size.width, height: size.height };
}
function uiRectsOverlap(a, b, gap = 0) {
  return !(a.x + a.width + gap <= b.x || b.x + b.width + gap <= a.x || a.y + a.height + gap <= b.y || b.y + b.height + gap <= a.y);
}
function minSeparation(a, b, gap) {
  const pushLeft = a.x + a.width + gap - b.x;
  const pushRight = b.x + b.width + gap - a.x;
  const pushUp = a.y + a.height + gap - b.y;
  const pushDown = b.y + b.height + gap - a.y;
  const candidates = [
    { dx: -pushLeft, dy: 0, cost: pushLeft },
    { dx: pushRight, dy: 0, cost: pushRight },
    { dx: 0, dy: -pushUp, cost: pushUp },
    { dx: 0, dy: pushDown, cost: pushDown }
  ].filter((candidate) => candidate.cost > 0);
  if (candidates.length === 0) return { dx: 0, dy: 0 };
  const best = candidates.reduce(
    (min, candidate) => candidate.cost < min.cost ? candidate : min
  );
  return { dx: best.dx, dy: best.dy };
}
function isUiPositionClear(draggedId, position, size, positions, sizes, gap = uiCollisionGap()) {
  const self = toUiRect(position, size);
  for (const id of Object.keys(positions)) {
    if (id === draggedId) continue;
    if (uiRectsOverlap(self, toUiRect(positions[id], sizes[id]), gap)) {
      return false;
    }
  }
  return true;
}
function resolveCollisions(draggedId, position, size, positions, sizes, viewport, gap = uiCollisionGap()) {
  let pos = { ...position };
  windowMargin();
  for (let pass = 0; pass < 12; pass++) {
    let adjusted = false;
    let self = toUiRect(pos, size);
    for (const id of Object.keys(positions)) {
      if (id === draggedId) continue;
      const obstacle = toUiRect(positions[id], sizes[id]);
      if (!uiRectsOverlap(self, obstacle, gap)) continue;
      const { dx, dy } = minSeparation(self, obstacle, gap);
      pos.x += dx;
      pos.y += dy;
      self = toUiRect(pos, size);
      adjusted = true;
    }
    pos = clampToWorkspaceBounds(pos, size, viewport);
    if (!adjusted) break;
  }
  return pos;
}
function snapScalar(value, targets, threshold) {
  let best = value;
  let bestDist = threshold + 1;
  for (const target of targets) {
    const dist = Math.abs(value - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = target;
    }
  }
  return bestDist <= threshold ? best : value;
}
function clampScalar(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function clampToWorkspaceBounds(position, size, viewport) {
  const margin = windowMargin();
  const maxX = viewport.width - margin - size.width;
  const maxY = viewport.height - margin - size.height;
  return {
    x: clampScalar(position.x, margin, Math.max(margin, maxX)),
    y: clampScalar(position.y, margin, Math.max(margin, maxY))
  };
}
function isSnappedToTopMargin(y) {
  return Math.abs(y - windowMargin()) <= snapThreshold();
}
function getWindowMarginRect(viewport) {
  const margin = windowMargin();
  return {
    left: margin,
    top: margin,
    right: viewport.width - margin,
    bottom: viewport.height - margin,
    width: viewport.width - margin * 2,
    height: viewport.height - margin * 2
  };
}
function collectSnapTargets(draggedId, size, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  const { width: w, height: h } = size;
  const xTargets = [margin, viewport.width - margin - w];
  const yTargets = [margin, viewport.height - margin - h];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const o = positions[id];
    const os = sizes[id];
    const oRight = o.x + os.width;
    const oBottom = o.y + os.height;
    xTargets.push(o.x, oRight - w, oRight + gap, o.x - w - gap);
    yTargets.push(o.y, oBottom - h, oBottom + gap, o.y - h - gap);
  }
  return { x: xTargets, y: yTargets };
}
function collectWorkspaceSnapLines(positions, sizes, viewport) {
  const margin = windowMargin();
  const xLines = [margin, viewport.width - margin];
  const yLines = [margin, viewport.height - margin];
  for (const id of Object.keys(positions)) {
    if (!isSnapParticipant(id)) continue;
    const o = positions[id];
    const os = sizes[id];
    xLines.push(o.x, o.x + os.width);
    yLines.push(o.y, o.y + os.height);
  }
  return { x: xLines, y: yLines };
}
function verticalOverlap(aTop, aHeight, bTop, bHeight) {
  return Math.max(0, Math.min(aTop + aHeight, bTop + bHeight) - Math.max(aTop, bTop));
}
function horizontalOverlap(aLeft, aWidth, bLeft, bWidth) {
  return Math.max(0, Math.min(aLeft + aWidth, bLeft + bWidth) - Math.max(aLeft, bLeft));
}
function overlapCrossCenter(aStart, aSize, bStart, bSize) {
  const overlap = Math.max(
    0,
    Math.min(aStart + aSize, bStart + bSize) - Math.max(aStart, bStart)
  );
  if (overlap <= 0) return (aStart + aSize / 2 + bStart + bSize / 2) / 2;
  return (Math.max(aStart, bStart) + Math.min(aStart + aSize, bStart + bSize)) / 2;
}
function collectHorizontalDistributionTargets(draggedId, pos, size, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  const { width: w, height: h } = size;
  const leftBoundaries = [
    { edge: margin, cross: pos.y + h / 2 }
  ];
  const rightBoundaries = [
    { edge: viewport.width - margin, cross: pos.y + h / 2 }
  ];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    if (verticalOverlap(pos.y, h, other.y, otherSize.height) <= 0) continue;
    const cross = overlapCrossCenter(pos.y, h, other.y, otherSize.height);
    leftBoundaries.push({ edge: other.x + otherSize.width + gap, cross });
    rightBoundaries.push({ edge: other.x - gap, cross });
  }
  const targets = [];
  for (const left of leftBoundaries) {
    for (const right of rightBoundaries) {
      if (right.edge - left.edge < w) continue;
      const x = (left.edge + right.edge - w) / 2;
      if (x < margin - 0.5) continue;
      if (x + w > viewport.width - margin + 0.5) continue;
      if (x - left.edge < gap * 0.5 || right.edge - (x + w) < gap * 0.5) continue;
      targets.push(x);
    }
  }
  return targets;
}
function collectVerticalDistributionTargets(draggedId, pos, size, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  const { width: w, height: h } = size;
  const topBoundaries = [
    { edge: margin, cross: pos.x + w / 2 }
  ];
  const bottomBoundaries = [
    { edge: viewport.height - margin, cross: pos.x + w / 2 }
  ];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    if (horizontalOverlap(pos.x, w, other.x, otherSize.width) <= 0) continue;
    const cross = overlapCrossCenter(pos.x, w, other.x, otherSize.width);
    topBoundaries.push({ edge: other.y + otherSize.height + gap, cross });
    bottomBoundaries.push({ edge: other.y - gap, cross });
  }
  const targets = [];
  for (const top of topBoundaries) {
    for (const bottom of bottomBoundaries) {
      if (bottom.edge - top.edge < h) continue;
      const y = (top.edge + bottom.edge - h) / 2;
      if (y < margin - 0.5) continue;
      if (y + h > viewport.height - margin + 0.5) continue;
      if (y - top.edge < gap * 0.5 || bottom.edge - (y + h) < gap * 0.5) continue;
      targets.push(y);
    }
  }
  return targets;
}
function findDistributionGuideX(draggedId, snapped, size, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  const { width: w, height: h } = size;
  const x = snapped.x;
  const leftBoundaries = [
    { edge: margin, cross: snapped.y + h / 2 }
  ];
  const rightBoundaries = [
    { edge: viewport.width - margin, cross: snapped.y + h / 2 }
  ];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    if (verticalOverlap(snapped.y, h, other.y, otherSize.height) <= 0) continue;
    const cross = overlapCrossCenter(snapped.y, h, other.y, otherSize.height);
    leftBoundaries.push({ edge: other.x + otherSize.width + gap, cross });
    rightBoundaries.push({ edge: other.x - gap, cross });
  }
  for (const left of leftBoundaries) {
    for (const right of rightBoundaries) {
      if (right.edge - left.edge < w) continue;
      const targetX = (left.edge + right.edge - w) / 2;
      if (Math.abs(targetX - x) > 0.5) continue;
      if (x - left.edge < gap * 0.5 || right.edge - (x + w) < gap * 0.5) continue;
      return {
        axis: "x",
        cross: (left.cross + right.cross) / 2,
        gapA: { from: left.edge, to: x },
        gapB: { from: x + w, to: right.edge }
      };
    }
  }
  return null;
}
function findDistributionGuideY(draggedId, snapped, size, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  const { width: w, height: h } = size;
  const y = snapped.y;
  const topBoundaries = [
    { edge: margin, cross: snapped.x + w / 2 }
  ];
  const bottomBoundaries = [
    { edge: viewport.height - margin, cross: snapped.x + w / 2 }
  ];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    if (horizontalOverlap(snapped.x, w, other.x, otherSize.width) <= 0) continue;
    const cross = overlapCrossCenter(snapped.x, w, other.x, otherSize.width);
    topBoundaries.push({ edge: other.y + otherSize.height + gap, cross });
    bottomBoundaries.push({ edge: other.y - gap, cross });
  }
  for (const top of topBoundaries) {
    for (const bottom of bottomBoundaries) {
      if (bottom.edge - top.edge < h) continue;
      const targetY = (top.edge + bottom.edge - h) / 2;
      if (Math.abs(targetY - y) > 0.5) continue;
      if (y - top.edge < gap * 0.5 || bottom.edge - (y + h) < gap * 0.5) continue;
      return {
        axis: "y",
        cross: (top.cross + bottom.cross) / 2,
        gapA: { from: top.edge, to: y },
        gapB: { from: y + h, to: bottom.edge }
      };
    }
  }
  return null;
}
function getActiveDistributionGuides(draggedId, raw, snapped, size, positions, sizes, viewport) {
  const guides = [];
  if (snapped.x !== raw.x) {
    const guide = findDistributionGuideX(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport
    );
    if (guide) guides.push(guide);
  }
  if (snapped.y !== raw.y) {
    const guide = findDistributionGuideY(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport
    );
    if (guide) guides.push(guide);
  }
  return guides;
}
function findMatchedTarget(value, targets, threshold) {
  let best = value;
  let bestDist = threshold + 1;
  for (const target of targets) {
    const dist = Math.abs(value - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = target;
    }
  }
  return bestDist <= threshold ? best : null;
}
function mapTopLeftXToVisual(topLeft, w, draggedId, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  if (Math.abs(topLeft - margin) < 0.5) return margin;
  const rightMarginTopLeft = viewport.width - margin - w;
  if (Math.abs(topLeft - rightMarginTopLeft) < 0.5) {
    return viewport.width - margin;
  }
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const o = positions[id];
    const os = sizes[id];
    const oRight = o.x + os.width;
    if (Math.abs(topLeft - o.x) < 0.5 || Math.abs(topLeft - (o.x - w)) < 0.5) {
      return o.x;
    }
    if (Math.abs(topLeft - (oRight - w)) < 0.5) return oRight;
    if (Math.abs(topLeft - (oRight + gap)) < 0.5) return oRight + gap;
    if (Math.abs(topLeft - (o.x - w - gap)) < 0.5) return o.x - gap;
  }
  return topLeft;
}
function mapTopLeftYToVisual(topLeft, h, draggedId, positions, sizes, viewport) {
  const margin = windowMargin();
  const gap = layoutGap();
  if (Math.abs(topLeft - margin) < 0.5) return margin;
  const bottomMarginTopLeft = viewport.height - margin - h;
  if (Math.abs(topLeft - bottomMarginTopLeft) < 0.5) {
    return viewport.height - margin;
  }
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const o = positions[id];
    const os = sizes[id];
    const oBottom = o.y + os.height;
    if (Math.abs(topLeft - o.y) < 0.5 || Math.abs(topLeft - (o.y - h)) < 0.5) {
      return o.y;
    }
    if (Math.abs(topLeft - (oBottom - h)) < 0.5) return oBottom;
    if (Math.abs(topLeft - (oBottom + gap)) < 0.5) return oBottom + gap;
    if (Math.abs(topLeft - (o.y - h - gap)) < 0.5) return o.y - gap;
  }
  return topLeft;
}
function getActiveVisualSnapLines(draggedId, raw, snapped, size, positions, sizes, viewport) {
  const threshold = snapThreshold();
  const { x: xTargets, y: yTargets } = collectSnapTargets(
    draggedId,
    size,
    positions,
    sizes,
    viewport
  );
  let visualX = null;
  if (snapped.x !== raw.x) {
    const matched = findMatchedTarget(snapped.x, xTargets, threshold);
    if (matched !== null) {
      visualX = mapTopLeftXToVisual(
        matched,
        size.width,
        draggedId,
        positions,
        sizes,
        viewport
      );
    }
  }
  let visualY = null;
  if (snapped.y !== raw.y) {
    const matched = findMatchedTarget(snapped.y, yTargets, threshold);
    if (matched !== null) {
      visualY = mapTopLeftYToVisual(
        matched,
        size.height,
        draggedId,
        positions,
        sizes,
        viewport
      );
    }
  }
  return { x: visualX, y: visualY };
}
function idsFromEdgeSnapX(matchedTopLeft, width, draggedId, positions, sizes) {
  const gap = layoutGap();
  const ids = [];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    const otherRight = other.x + otherSize.width;
    if (Math.abs(matchedTopLeft - other.x) < 0.5 || Math.abs(matchedTopLeft - (otherRight - width)) < 0.5 || Math.abs(matchedTopLeft - (otherRight + gap)) < 0.5 || Math.abs(matchedTopLeft - (other.x - width - gap)) < 0.5) {
      ids.push(id);
    }
  }
  return ids;
}
function idsFromEdgeSnapY(matchedTopLeft, height, draggedId, positions, sizes) {
  const gap = layoutGap();
  const ids = [];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    const otherBottom = other.y + otherSize.height;
    if (Math.abs(matchedTopLeft - other.y) < 0.5 || Math.abs(matchedTopLeft - (otherBottom - height)) < 0.5 || Math.abs(matchedTopLeft - (otherBottom + gap)) < 0.5 || Math.abs(matchedTopLeft - (other.y - height - gap)) < 0.5) {
      ids.push(id);
    }
  }
  return ids;
}
function idsFromDistributionGuideX(guide, draggedId, positions, sizes) {
  const gap = layoutGap();
  const leftEdge = guide.gapA.from;
  const rightEdge = guide.gapB.to;
  const ids = [];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    const otherRight = other.x + otherSize.width;
    if (Math.abs(otherRight + gap - leftEdge) < 0.5) ids.push(id);
    if (Math.abs(other.x - gap - rightEdge) < 0.5) ids.push(id);
  }
  return ids;
}
function idsFromDistributionGuideY(guide, draggedId, positions, sizes) {
  const gap = layoutGap();
  const topEdge = guide.gapA.from;
  const bottomEdge = guide.gapB.to;
  const ids = [];
  for (const id of Object.keys(positions)) {
    if (id === draggedId || !isSnapParticipant(id)) continue;
    const other = positions[id];
    const otherSize = sizes[id];
    const otherBottom = other.y + otherSize.height;
    if (Math.abs(otherBottom + gap - topEdge) < 0.5) ids.push(id);
    if (Math.abs(other.y - gap - bottomEdge) < 0.5) ids.push(id);
  }
  return ids;
}
function samePanelIds(a, b) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
}
var sameUiGroupIds = samePanelIds;
function getSnapTargetIds(draggedId, raw, snapped, size, positions, sizes, viewport) {
  const threshold = snapThreshold();
  const ids = /* @__PURE__ */ new Set();
  const { width, height } = size;
  if (snapped.x !== raw.x) {
    const distributionGuide = findDistributionGuideX(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport
    );
    if (distributionGuide) {
      for (const id of idsFromDistributionGuideX(
        distributionGuide,
        draggedId,
        positions,
        sizes
      )) {
        ids.add(id);
      }
    } else {
      const { x: xTargets } = collectSnapTargets(
        draggedId,
        size,
        positions,
        sizes,
        viewport
      );
      const matched = findMatchedTarget(snapped.x, xTargets, threshold);
      if (matched !== null) {
        for (const id of idsFromEdgeSnapX(
          matched,
          width,
          draggedId,
          positions,
          sizes
        )) {
          ids.add(id);
        }
      }
    }
  }
  if (snapped.y !== raw.y) {
    const distributionGuide = findDistributionGuideY(
      draggedId,
      snapped,
      size,
      positions,
      sizes,
      viewport
    );
    if (distributionGuide) {
      for (const id of idsFromDistributionGuideY(
        distributionGuide,
        draggedId,
        positions,
        sizes
      )) {
        ids.add(id);
      }
    } else {
      const { y: yTargets } = collectSnapTargets(
        draggedId,
        size,
        positions,
        sizes,
        viewport
      );
      const matched = findMatchedTarget(snapped.y, yTargets, threshold);
      if (matched !== null) {
        for (const id of idsFromEdgeSnapY(
          matched,
          height,
          draggedId,
          positions,
          sizes
        )) {
          ids.add(id);
        }
      }
    }
  }
  return [...ids];
}
function snapPosition(draggedId, target, size, positions, sizes, viewport) {
  const threshold = snapThreshold();
  const bounded = clampToWorkspaceBounds(target, size, viewport);
  const edgeTargets = collectSnapTargets(
    draggedId,
    size,
    positions,
    sizes,
    viewport
  );
  const distributionX = collectHorizontalDistributionTargets(
    draggedId,
    bounded,
    size,
    positions,
    sizes,
    viewport
  );
  const distributionY = collectVerticalDistributionTargets(
    draggedId,
    bounded,
    size,
    positions,
    sizes,
    viewport
  );
  const snapped = {
    x: snapScalar(bounded.x, [...edgeTargets.x, ...distributionX], threshold),
    y: snapScalar(bounded.y, [...edgeTargets.y, ...distributionY], threshold)
  };
  const clamped = clampToWorkspaceBounds(snapped, size, viewport);
  return resolveCollisions(
    draggedId,
    clamped,
    size,
    positions,
    sizes,
    viewport
  );
}

// src/workspace/canvasSnap.ts
function getCanvasScreenRect(pan, zoom, size, viewport) {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const width = size.width * zoom;
  const height = size.height * zoom;
  return {
    x: cx + pan.x - width / 2,
    y: cy + pan.y - height / 2,
    width,
    height
  };
}
function panTargetsForLines(lines, center, halfExtent) {
  const targets = [];
  for (const line of lines) {
    targets.push(line - center + halfExtent);
    targets.push(line - center - halfExtent);
  }
  return targets;
}
function findMatchedTarget2(value, targets, threshold) {
  let best = value;
  let bestDist = threshold + 1;
  for (const target of targets) {
    const dist = Math.abs(value - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = target;
    }
  }
  return bestDist <= threshold ? best : null;
}
function collectCanvasPanSnapTargets(zoom, canvasSize, positions, sizes, viewport) {
  const { x: xLines, y: yLines } = collectWorkspaceSnapLines(
    positions,
    sizes,
    viewport
  );
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const halfW = canvasSize.width * zoom / 2;
  const halfH = canvasSize.height * zoom / 2;
  return {
    xLines,
    yLines,
    x: panTargetsForLines(xLines, cx, halfW),
    y: panTargetsForLines(yLines, cy, halfH)
  };
}
function snapCanvasPan(pan, zoom, canvasSize, positions, sizes, viewport) {
  const threshold = snapThreshold();
  const { x: xTargets, y: yTargets } = collectCanvasPanSnapTargets(
    zoom,
    canvasSize,
    positions,
    sizes,
    viewport
  );
  return {
    x: snapScalar(pan.x, xTargets, threshold),
    y: snapScalar(pan.y, yTargets, threshold)
  };
}
function getActiveCanvasSnapLines(rawPan, snappedPan, zoom, canvasSize, positions, sizes, viewport) {
  const threshold = snapThreshold();
  const { x: xTargets, y: yTargets, xLines, yLines } = collectCanvasPanSnapTargets(
    zoom,
    canvasSize,
    positions,
    sizes,
    viewport
  );
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const halfW = canvasSize.width * zoom / 2;
  const halfH = canvasSize.height * zoom / 2;
  let visualX = null;
  if (snappedPan.x !== rawPan.x) {
    const matched = findMatchedTarget2(snappedPan.x, xTargets, threshold);
    if (matched !== null) {
      for (const line of xLines) {
        if (Math.abs(matched - (line - cx + halfW)) < 0.5 || Math.abs(matched - (line - cx - halfW)) < 0.5) {
          visualX = line;
          break;
        }
      }
    }
  }
  let visualY = null;
  if (snappedPan.y !== rawPan.y) {
    const matched = findMatchedTarget2(snappedPan.y, yTargets, threshold);
    if (matched !== null) {
      for (const line of yLines) {
        if (Math.abs(matched - (line - cy + halfH)) < 0.5 || Math.abs(matched - (line - cy - halfH)) < 0.5) {
          visualY = line;
          break;
        }
      }
    }
  }
  return { x: visualX, y: visualY };
}
function getCanvasSnapTargetIds(rawPan, snappedPan, zoom, canvasSize, positions, sizes, viewport) {
  const margin = windowMargin();
  const activeLines = getActiveCanvasSnapLines(
    rawPan,
    snappedPan,
    zoom,
    canvasSize,
    positions,
    sizes,
    viewport
  );
  const ids = /* @__PURE__ */ new Set();
  if (activeLines.x !== null) {
    const line = activeLines.x;
    if (Math.abs(line - margin) > 0.5 && Math.abs(line - (viewport.width - margin)) > 0.5) {
      for (const id of Object.keys(positions)) {
        if (!isSnapParticipant(id)) continue;
        const other = positions[id];
        const otherSize = sizes[id];
        if (Math.abs(other.x - line) < 0.5 || Math.abs(other.x + otherSize.width - line) < 0.5) {
          ids.add(id);
        }
      }
    }
  }
  if (activeLines.y !== null) {
    const line = activeLines.y;
    if (Math.abs(line - margin) > 0.5 && Math.abs(line - (viewport.height - margin)) > 0.5) {
      for (const id of Object.keys(positions)) {
        if (!isSnapParticipant(id)) continue;
        const other = positions[id];
        const otherSize = sizes[id];
        if (Math.abs(other.y - line) < 0.5 || Math.abs(other.y + otherSize.height - line) < 0.5) {
          ids.add(id);
        }
      }
    }
  }
  return [...ids];
}
var SPOTLIGHT_RADIUS = 800;
var SPOTLIGHT_HOLE = 0;
var MASK_FADE_START = -20;
var MASK_FADE_END = 400;
var MASK_FADE_POWER = 2.7;
var easeInOut = (t, power) => t < 0.5 ? Math.pow(2, power - 1) * Math.pow(t, power) : 1 - Math.pow(-2 * t + 2, power) / 2;
var EASED_CURSOR_MASK_STOPS = (() => {
  const steps = 14;
  const fadeLength = MASK_FADE_END - MASK_FADE_START;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const radius = MASK_FADE_START + fadeLength * t;
    const alpha = easeInOut(t, MASK_FADE_POWER);
    return `rgba(0, 0, 0, ${alpha.toFixed(3)}) ${radius.toFixed(1)}px`;
  }).join(", ");
})();
var CURSOR_MASK = `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at var(--cursor-x) var(--cursor-y), transparent 0px, transparent ${SPOTLIGHT_HOLE}px, ${EASED_CURSOR_MASK_STOPS})`;
var PAN_LERP_DRAG = 0.32;
var PAN_LERP_RELEASE = 0.22;
var PAN_DIST_REF_PX = 140;
var PAN_MAX_STEP_DRAG_PX = 90;
var PAN_MAX_STEP_RELEASE_PX = 60;
var PAN_SETTLE_EPS = 0.06;
var ZOOM_LERP = 0.12;
var ZOOM_DIST_REF = 0.22;
var ZOOM_MAX_STEP = 0.042;
var ZOOM_SETTLE_EPS = 4e-3;
var easeOutQuad = (t) => t * (2 - t);
var CreativeCanvas = react.forwardRef(
  function CreativeCanvas2({ createSketch }, ref) {
    const useStore = usePrismaticStore();
    const workspaceMode = useStore((s) => s.workspaceMode);
    const toggleWorkspaceMode = useStore((s) => s.toggleWorkspaceMode);
    const workspaceModeRef = react.useRef(false);
    const outerRef = react.useRef(null);
    const containerRef = react.useRef(null);
    const pInstRef = react.useRef(null);
    const createSketchRef = react.useRef(createSketch);
    createSketchRef.current = createSketch;
    const panRef = react.useRef({ x: 0, y: 0 });
    const panDisplayRef = react.useRef({ x: 0, y: 0 });
    const zoomRef = react.useRef(1);
    const zoomDisplayRef = react.useRef(1);
    const panRafRef = react.useRef(0);
    const zoomAnchorRef = react.useRef(null);
    const dragRef = react.useRef({
      active: false,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0
    });
    const lastCanvasSnapTargetsRef = react.useRef([]);
    const canvasConfig = () => getRuntimeConfig().canvas;
    const shortcutsConfig = () => getRuntimeConfig().shortcuts;
    const cancelPanRaf = react.useCallback(() => {
      if (panRafRef.current) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = 0;
      }
    }, []);
    const applyTransform = react.useCallback(() => {
      const el = containerRef.current;
      if (!el) return;
      const useSmooth = workspaceModeRef.current;
      const { x, y } = useSmooth ? panDisplayRef.current : panRef.current;
      const z = useSmooth ? zoomDisplayRef.current : zoomRef.current;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
    }, []);
    const syncTransformDisplayToLogical = react.useCallback(() => {
      panDisplayRef.current = { ...panRef.current };
      zoomDisplayRef.current = zoomRef.current;
    }, []);
    const resetTransform = react.useCallback(() => {
      panRef.current = { x: 0, y: 0 };
      panDisplayRef.current = { x: 0, y: 0 };
      zoomRef.current = 1;
      zoomDisplayRef.current = 1;
      zoomAnchorRef.current = null;
      useStore.getState().setCanvasDragDebug(null);
      cancelPanRaf();
      applyTransform();
    }, [applyTransform, cancelPanRaf, useStore]);
    const resolveCanvasPan = react.useCallback(
      (raw) => {
        const el = containerRef.current;
        if (!el) return raw;
        const state = useStore.getState();
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        const canvasSize = {
          width: el.offsetWidth,
          height: el.offsetHeight
        };
        return snapCanvasPan(
          raw,
          zoomRef.current,
          canvasSize,
          state.uiPositions,
          state.uiSizes,
          viewport
        );
      },
      [useStore]
    );
    const runPanFrame = react.useCallback(() => {
      panRafRef.current = 0;
      if (!workspaceModeRef.current) return;
      const tx = panRef.current.x;
      const ty = panRef.current.y;
      const tz = zoomRef.current;
      const dragging = dragRef.current.active;
      const dx = tx - panDisplayRef.current.x;
      const dy = ty - panDisplayRef.current.y;
      const vz = zoomDisplayRef.current;
      const dz = tz - vz;
      const panSettled = !dragging && Math.abs(dx) < PAN_SETTLE_EPS && Math.abs(dy) < PAN_SETTLE_EPS;
      const zoomSettled = Math.abs(dz) < ZOOM_SETTLE_EPS;
      if (!dragging && panSettled && zoomSettled) {
        panDisplayRef.current = { x: tx, y: ty };
        zoomDisplayRef.current = tz;
        applyTransform();
        return;
      }
      if (panSettled) {
        panDisplayRef.current = { x: tx, y: ty };
      } else {
        const dist = Math.hypot(dx, dy);
        const blend = easeOutQuad(Math.min(1, dist / PAN_DIST_REF_PX));
        const baseK = dragging ? PAN_LERP_DRAG : PAN_LERP_RELEASE;
        const k = baseK * (0.38 + 0.62 * blend);
        let stepX = dx * k;
        let stepY = dy * k;
        const maxStep = dragging ? PAN_MAX_STEP_DRAG_PX : PAN_MAX_STEP_RELEASE_PX;
        const stepMag = Math.hypot(stepX, stepY);
        if (stepMag > maxStep && stepMag > 1e-6) {
          const s = maxStep / stepMag;
          stepX *= s;
          stepY *= s;
        }
        panDisplayRef.current = {
          x: panDisplayRef.current.x + stepX,
          y: panDisplayRef.current.y + stepY
        };
      }
      if (zoomSettled) {
        zoomDisplayRef.current = tz;
        if (!dragging) zoomAnchorRef.current = null;
      } else {
        const zBlend = easeOutQuad(Math.min(1, Math.abs(dz) / ZOOM_DIST_REF));
        const zk = ZOOM_LERP * (0.38 + 0.62 * zBlend);
        let zStep = dz * zk;
        if (Math.abs(zStep) > ZOOM_MAX_STEP) {
          zStep = Math.sign(zStep) * ZOOM_MAX_STEP;
        }
        zoomDisplayRef.current = vz + zStep;
      }
      const anchor = zoomAnchorRef.current;
      if (anchor && !dragging) {
        const z = zoomDisplayRef.current;
        panDisplayRef.current = {
          x: anchor.cx - anchor.localX * z,
          y: anchor.cy - anchor.localY * z
        };
      }
      applyTransform();
      const ndx = tx - panDisplayRef.current.x;
      const ndy = ty - panDisplayRef.current.y;
      const ndz = tz - zoomDisplayRef.current;
      const stillPan = dragging || Math.abs(ndx) >= PAN_SETTLE_EPS || Math.abs(ndy) >= PAN_SETTLE_EPS;
      const stillZoom = Math.abs(ndz) >= ZOOM_SETTLE_EPS;
      if (stillPan || stillZoom) {
        panRafRef.current = requestAnimationFrame(runPanFrame);
      }
    }, [applyTransform]);
    const schedulePanFrame = react.useCallback(() => {
      if (!workspaceModeRef.current) return;
      if (panRafRef.current) return;
      panRafRef.current = requestAnimationFrame(runPanFrame);
    }, [runPanFrame]);
    react.useEffect(() => {
      workspaceModeRef.current = workspaceMode;
      if (workspaceMode) {
        syncTransformDisplayToLogical();
        applyTransform();
      } else {
        cancelPanRaf();
        useStore.getState().setCanvasDragDebug(null);
        syncTransformDisplayToLogical();
        applyTransform();
      }
    }, [
      workspaceMode,
      applyTransform,
      cancelPanRaf,
      syncTransformDisplayToLogical,
      useStore
    ]);
    react.useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.style.willChange = workspaceMode ? "transform" : "auto";
      return () => {
        el.style.willChange = "auto";
      };
    }, [workspaceMode]);
    react.useImperativeHandle(ref, () => ({
      loadSource: (url, kind) => {
        const p = pInstRef.current;
        if (!p) return;
        if (kind === "video") {
          p.updateVideo?.(url);
          return;
        }
        p.loadImage(
          url,
          (img) => {
            p.updateImage?.(img);
          },
          () => console.error("Failed to load image")
        );
      },
      saveCanvas: (filename) => {
        const p = pInstRef.current;
        if (!p) return;
        const container = containerRef.current;
        const prefix = canvasConfig().downloadFilePrefix;
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const name = filename ?? `${prefix}_${timestamp}`;
        const canvasEl = container?.querySelector("canvas");
        if (canvasEl) {
          try {
            const dataUrl = canvasEl.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `${name}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
          } catch (error) {
            console.warn("Canvas download failed, falling back to p5:", error);
          }
          p.saveCanvas(canvasEl, name, "png");
        } else {
          p.saveCanvas(name, "png");
        }
      }
    }));
    react.useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const instance = new p5__default.default((p) => {
        createSketchRef.current(p);
        pInstRef.current = p;
      }, el);
      return () => {
        pInstRef.current = null;
        instance.remove();
      };
    }, []);
    react.useEffect(() => {
      const el = outerRef.current;
      if (!el) return;
      el.style.setProperty("--cursor-x", "-9999px");
      el.style.setProperty("--cursor-y", "-9999px");
      let rafId = 0;
      let nextX = -9999;
      let nextY = -9999;
      const applyVars = () => {
        rafId = 0;
        el.style.setProperty("--cursor-x", `${nextX}px`);
        el.style.setProperty("--cursor-y", `${nextY}px`);
      };
      const handleMouseMove = (e) => {
        nextX = e.clientX;
        nextY = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(applyVars);
      };
      window.addEventListener("pointermove", handleMouseMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", handleMouseMove);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, []);
    react.useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
          return;
        const { toggleWorkspace, resetCanvasView } = shortcutsConfig();
        const key = e.key.toLowerCase();
        if (key === toggleWorkspace.toLowerCase()) {
          if (getRuntimeConfig().workspace.enabled) {
            toggleWorkspaceMode();
          }
        } else if (key === resetCanvasView.toLowerCase()) {
          resetTransform();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [resetTransform, toggleWorkspaceMode]);
    react.useEffect(() => {
      const handleWheel = (e) => {
        if (!workspaceModeRef.current) return;
        e.preventDefault();
        const { minZoom, maxZoom, zoomStep } = canvasConfig();
        const oldZoom = zoomDisplayRef.current;
        const factor = e.deltaY < 0 ? zoomStep : 1 / zoomStep;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * factor));
        const W = window.innerWidth;
        const H = window.innerHeight;
        const cx = e.clientX - W / 2;
        const cy = e.clientY - H / 2;
        const px = panDisplayRef.current.x;
        const py = panDisplayRef.current.y;
        const localX = (cx - px) / oldZoom;
        const localY = (cy - py) / oldZoom;
        panRef.current = {
          x: cx - localX * newZoom,
          y: cy - localY * newZoom
        };
        zoomRef.current = newZoom;
        zoomAnchorRef.current = { cx, cy, localX, localY };
        schedulePanFrame();
      };
      window.addEventListener("wheel", handleWheel, { passive: false });
      return () => window.removeEventListener("wheel", handleWheel);
    }, [schedulePanFrame]);
    const handlePointerDown = (e) => {
      if (!workspaceModeRef.current) return;
      e.preventDefault();
      cancelPanRaf();
      zoomAnchorRef.current = null;
      syncTransformDisplayToLogical();
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e) => {
      if (!dragRef.current.active) return;
      const raw = {
        x: dragRef.current.startPanX + e.clientX - dragRef.current.startX,
        y: dragRef.current.startPanY + e.clientY - dragRef.current.startY
      };
      const snapped = resolveCanvasPan(raw);
      panRef.current = snapped;
      const el = containerRef.current;
      if (el) {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        const canvasSize = {
          width: el.offsetWidth,
          height: el.offsetHeight
        };
        const state = useStore.getState();
        useStore.getState().setCanvasDragDebug({
          raw,
          snapped,
          rect: getCanvasScreenRect(
            snapped,
            zoomRef.current,
            canvasSize,
            viewport
          ),
          activeLines: getActiveCanvasSnapLines(
            raw,
            snapped,
            zoomRef.current,
            canvasSize,
            state.uiPositions,
            state.uiSizes,
            viewport
          )
        });
        const didSnap = snapped.x !== raw.x || snapped.y !== raw.y;
        if (didSnap) {
          const snapTargets = getCanvasSnapTargetIds(
            raw,
            snapped,
            zoomRef.current,
            canvasSize,
            state.uiPositions,
            state.uiSizes,
            viewport
          );
          if (snapTargets.length > 0 && !samePanelIds(snapTargets, lastCanvasSnapTargetsRef.current)) {
            useStore.getState().flashSnapTargets(snapTargets);
            lastCanvasSnapTargetsRef.current = snapTargets;
          }
        } else {
          lastCanvasSnapTargetsRef.current = [];
        }
      }
      schedulePanFrame();
    };
    const handlePointerUp = () => {
      dragRef.current.active = false;
      lastCanvasSnapTargetsRef.current = [];
      useStore.getState().setCanvasDragDebug(null);
      schedulePanFrame();
    };
    const spotlight = canvasConfig().spotlight;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: outerRef,
        className: "pointer-events-none fixed inset-0 z-20 flex items-center justify-center select-none",
        style: workspaceMode || !spotlight ? void 0 : { maskImage: CURSOR_MASK, WebkitMaskImage: CURSOR_MASK },
        "aria-hidden": true,
        children: /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            ref: containerRef,
            className: [
              "inline-flex p-1 rounded-[calc(var(--radius)*2+4px)] [&_canvas]:block [&_canvas]:max-h-none [&_canvas]:max-w-none [&_canvas]:rounded-[calc(var(--radius)*2)]",
              workspaceMode ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"
            ].join(" "),
            style: {
              transformOrigin: "center center",
              backgroundImage: "linear-gradient(90deg, rgb(36, 35, 38) 0%, rgb(36, 35, 38) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%)"
            },
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp
          }
        )
      }
    );
  }
);
var WorkspacePanelContext = react.createContext(
  null
);
function useWorkspacePanel() {
  return react.useContext(WorkspacePanelContext);
}
var useWorkspaceGroup = useWorkspacePanel;
function WorkspacePanel({ id, children, className = "" }) {
  const useStore = usePrismaticStore();
  const workspaceMode = useStore((s) => s.workspaceMode);
  const position = useStore((s) => s.uiPositions[id] ?? { x: 0, y: 0 });
  const setUiGroupSize = useStore((s) => s.setUiGroupSize);
  const setUiGroupPosition = useStore((s) => s.setUiGroupPosition);
  const setUiDragDebug = useStore((s) => s.setUiDragDebug);
  const flashSnapTargets = useStore((s) => s.flashSnapTargets);
  const snapFlashing = useStore((s) => s.snapFlashIds.includes(id));
  const rootRef = react.useRef(null);
  const dragStartRef = react.useRef(
    null
  );
  const lastValidDragPosRef = react.useRef(position);
  const lastSnapTargetsRef = react.useRef([]);
  const [hovered, setHovered] = react.useState(false);
  const [dragging, setDragging] = react.useState(false);
  const [dragPos, setDragPos] = react.useState(null);
  react.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const updateSize = () => {
      setUiGroupSize(id, {
        width: el.offsetWidth,
        height: el.offsetHeight
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, setUiGroupSize]);
  const measuredSize = () => {
    const el = rootRef.current;
    const fromDom = el ? { width: el.offsetWidth, height: el.offsetHeight } : { width: 0, height: 0 };
    const fromStore = useStore.getState().uiSizes[id];
    return {
      width: fromDom.width || fromStore?.width || 0,
      height: fromDom.height || fromStore?.height || 0
    };
  };
  const resolveSnap = (raw) => {
    const state = useStore.getState();
    return snapPosition(
      id,
      raw,
      measuredSize(),
      state.uiPositions,
      state.uiSizes,
      { width: window.innerWidth, height: window.innerHeight }
    );
  };
  const finishDrag = () => {
    if (!dragStartRef.current || !dragPos) return;
    setUiGroupPosition(id, dragPos);
    dragStartRef.current = null;
    lastSnapTargetsRef.current = [];
    setDragPos(null);
    setDragging(false);
    setUiDragDebug(null);
  };
  const onPointerDown = (e) => {
    if (!workspaceMode || e.button !== 0) return;
    if (e.target.closest(".workspace-controls")) return;
    e.preventDefault();
    e.stopPropagation();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pos: { ...position }
    };
    lastValidDragPosRef.current = { ...position };
    setDragging(true);
    setDragPos({ ...position });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging || !dragStartRef.current) return;
    const raw = {
      x: dragStartRef.current.pos.x + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.pos.y + (e.clientY - dragStartRef.current.y)
    };
    const snapped = resolveSnap(raw);
    const size = measuredSize();
    const state = useStore.getState();
    const resolved = isUiPositionClear(
      id,
      snapped,
      size,
      state.uiPositions,
      state.uiSizes
    ) ? snapped : lastValidDragPosRef.current;
    if (resolved === snapped) {
      lastValidDragPosRef.current = snapped;
    }
    const didSnap = snapped.x !== raw.x || snapped.y !== raw.y;
    if (didSnap && resolved === snapped) {
      const snapTargets = getSnapTargetIds(
        id,
        raw,
        snapped,
        size,
        state.uiPositions,
        state.uiSizes,
        { width: window.innerWidth, height: window.innerHeight }
      );
      if (snapTargets.length > 0 && !samePanelIds(snapTargets, lastSnapTargetsRef.current)) {
        flashSnapTargets(snapTargets);
        lastSnapTargetsRef.current = snapTargets;
      }
    } else if (!didSnap) {
      lastSnapTargetsRef.current = [];
    }
    setDragPos(resolved);
    setUiDragDebug({ id, raw, snapped: resolved });
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    finishDrag();
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const displayPos = dragPos ?? position;
  const dragOffset = dragging ? { x: displayPos.x - position.x, y: displayPos.y - position.y } : { x: 0, y: 0 };
  const outlineClass = workspaceMode ? snapFlashing ? "outline outline-2 outline-white" : dragging ? "outline outline-2 outline-white" : hovered ? "outline outline-1 outline-white/50" : "" : "";
  return /* @__PURE__ */ jsxRuntime.jsx(WorkspacePanelContext.Provider, { value: { id, hovered }, children: /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      ref: rootRef,
      className: `pointer-events-auto absolute w-fit ${workspaceMode ? "cursor-grab active:cursor-grabbing" : ""} ${outlineClass} ${className}`,
      style: {
        left: position.x,
        top: position.y,
        transform: dragOffset.x || dragOffset.y ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` : void 0,
        transition: dragging ? "none" : "left 180ms ease-out, top 180ms ease-out"
      },
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: () => {
        if (dragging) finishDrag();
      },
      onMouseEnter: () => workspaceMode && setHovered(true),
      onMouseLeave: () => setHovered(false),
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: workspaceMode ? "pointer-events-none select-none [&_.workspace-controls]:pointer-events-auto [&_.workspace-hover-zone]:pointer-events-auto" : void 0,
          children
        }
      )
    }
  ) });
}
var WorkspaceGroup = WorkspacePanel;
var SNAP_STROKE = "rgba(255,255,255,0.85)";
var GAP_STROKE = "rgba(255,255,255,0.65)";
var CAP_SIZE = 5;
function GapIndicator({ guide }) {
  const isHorizontal = guide.axis === "x";
  const gapLengthA = Math.abs(guide.gapA.to - guide.gapA.from);
  const gapLengthB = Math.abs(guide.gapB.to - guide.gapB.from);
  const renderGap = (from, to, key) => {
    const length = Math.abs(to - from);
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    if (isHorizontal) {
      const y = guide.cross;
      return /* @__PURE__ */ jsxRuntime.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "line",
          {
            x1: start,
            y1: y,
            x2: end,
            y2: y,
            stroke: GAP_STROKE,
            strokeWidth: 1,
            strokeDasharray: "4 3"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "line",
          {
            x1: start,
            y1: y - CAP_SIZE,
            x2: start,
            y2: y + CAP_SIZE,
            stroke: GAP_STROKE,
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "line",
          {
            x1: end,
            y1: y - CAP_SIZE,
            x2: end,
            y2: y + CAP_SIZE,
            stroke: GAP_STROKE,
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "text",
          {
            x: (start + end) / 2,
            y: y - 8,
            fill: GAP_STROKE,
            fontSize: 9,
            fontFamily: "ui-monospace, monospace",
            textAnchor: "middle",
            children: Math.round(length)
          }
        )
      ] }, key);
    }
    const x = guide.cross;
    return /* @__PURE__ */ jsxRuntime.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "line",
        {
          x1: x,
          y1: start,
          x2: x,
          y2: end,
          stroke: GAP_STROKE,
          strokeWidth: 1,
          strokeDasharray: "4 3"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "line",
        {
          x1: x - CAP_SIZE,
          y1: start,
          x2: x + CAP_SIZE,
          y2: start,
          stroke: GAP_STROKE,
          strokeWidth: 1
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "line",
        {
          x1: x - CAP_SIZE,
          y1: end,
          x2: x + CAP_SIZE,
          y2: end,
          stroke: GAP_STROKE,
          strokeWidth: 1
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "text",
        {
          x: x + 10,
          y: (start + end) / 2,
          fill: GAP_STROKE,
          fontSize: 9,
          fontFamily: "ui-monospace, monospace",
          dominantBaseline: "middle",
          children: Math.round(length)
        }
      )
    ] }, key);
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("g", { children: [
    renderGap(guide.gapA.from, guide.gapA.to, "gap-a"),
    renderGap(guide.gapB.from, guide.gapB.to, "gap-b"),
    Math.abs(gapLengthA - gapLengthB) < 1 && /* @__PURE__ */ jsxRuntime.jsx(
      "text",
      {
        x: isHorizontal ? (guide.gapA.to + guide.gapB.from) / 2 : guide.cross + 18,
        y: isHorizontal ? guide.cross + 14 : (guide.gapA.to + guide.gapB.from) / 2,
        fill: GAP_STROKE,
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
        textAnchor: "middle",
        dominantBaseline: "middle",
        children: "="
      }
    )
  ] });
}
function WorkspaceDebugOverlay() {
  const useStore = usePrismaticStore();
  const workspaceMode = useStore((s) => s.workspaceMode);
  const uiPositions = useStore((s) => s.uiPositions);
  const uiSizes = useStore((s) => s.uiSizes);
  const uiDragDebug = useStore((s) => s.uiDragDebug);
  const canvasDragDebug = useStore((s) => s.canvasDragDebug);
  const [viewport, setViewport] = react.useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));
  react.useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (!workspaceMode || !uiDragDebug && !canvasDragDebug) return null;
  const activeUiSnapLines = uiDragDebug ? getActiveVisualSnapLines(
    uiDragDebug.id,
    uiDragDebug.raw,
    uiDragDebug.snapped,
    uiSizes[uiDragDebug.id],
    uiPositions,
    uiSizes,
    viewport
  ) : null;
  const distributionGuides = uiDragDebug ? getActiveDistributionGuides(
    uiDragDebug.id,
    uiDragDebug.raw,
    uiDragDebug.snapped,
    uiSizes[uiDragDebug.id],
    uiPositions,
    uiSizes,
    viewport
  ) : [];
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: "pointer-events-none absolute inset-0 z-[40] select-none",
      "aria-hidden": true,
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "svg",
        {
          className: "absolute inset-0 h-full w-full",
          width: viewport.width,
          height: viewport.height,
          viewBox: `0 0 ${viewport.width} ${viewport.height}`,
          children: [
            canvasDragDebug?.activeLines.x != null && /* @__PURE__ */ jsxRuntime.jsx(
              "line",
              {
                x1: canvasDragDebug.activeLines.x,
                y1: 0,
                x2: canvasDragDebug.activeLines.x,
                y2: viewport.height,
                stroke: SNAP_STROKE,
                strokeWidth: 1
              }
            ),
            canvasDragDebug?.activeLines.y != null && /* @__PURE__ */ jsxRuntime.jsx(
              "line",
              {
                x1: 0,
                y1: canvasDragDebug.activeLines.y,
                x2: viewport.width,
                y2: canvasDragDebug.activeLines.y,
                stroke: SNAP_STROKE,
                strokeWidth: 1
              }
            ),
            activeUiSnapLines != null && activeUiSnapLines.x != null && /* @__PURE__ */ jsxRuntime.jsx(
              "line",
              {
                x1: activeUiSnapLines.x,
                y1: 0,
                x2: activeUiSnapLines.x,
                y2: viewport.height,
                stroke: SNAP_STROKE,
                strokeWidth: 1
              }
            ),
            activeUiSnapLines != null && activeUiSnapLines.y != null && /* @__PURE__ */ jsxRuntime.jsx(
              "line",
              {
                x1: 0,
                y1: activeUiSnapLines.y,
                x2: viewport.width,
                y2: activeUiSnapLines.y,
                stroke: SNAP_STROKE,
                strokeWidth: 1
              }
            ),
            distributionGuides.map((guide, index) => /* @__PURE__ */ jsxRuntime.jsx(GapIndicator, { guide }, `${guide.axis}-${index}`))
          ]
        }
      )
    }
  );
}
function WorkspaceShell({
  children,
  showDebugOverlay = true
}) {
  const useStore = usePrismaticStore();
  const workspaceMode = useStore((s) => s.workspaceMode);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: `pointer-events-none fixed inset-0 ${workspaceMode ? "z-30" : "z-10"}`,
      children: [
        children,
        showDebugOverlay && /* @__PURE__ */ jsxRuntime.jsx(WorkspaceDebugOverlay, {})
      ]
    }
  );
}

// src/workspace/shortcutsLayout.ts
var CLEARANCE = 20;
var SCORE_HYSTERESIS = 16;
function rectsOverlap(a, b, gap = 0) {
  return !(a.x + a.width + gap <= b.x || b.x + b.width + gap <= a.x || a.y + a.height + gap <= b.y || b.y + b.height + gap <= a.y);
}
function positionKey(pos) {
  return `${Math.round(pos.x)}:${Math.round(pos.y)}`;
}
function clampScalar2(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function rectDistance(a, b) {
  const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0);
  const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0);
  return Math.hypot(dx, dy);
}
function isWithinWorkspace(pos, size, viewport) {
  const margin = windowMargin();
  return pos.x >= margin && pos.y >= margin && pos.x + size.width <= viewport.width - margin && pos.y + size.height <= viewport.height - margin;
}
function getObstacleRects(panelId, positions, sizes, dragDebug) {
  return Object.keys(positions).filter((id) => id !== panelId).map((id) => {
    const pos = dragDebug?.id === id ? dragDebug.snapped : positions[id];
    const size = sizes[id];
    return { x: pos.x, y: pos.y, width: size.width, height: size.height };
  });
}
function isPositionClear(pos, size, obstacles, viewport) {
  const candidate = { ...pos, ...size };
  if (!isWithinWorkspace(pos, size, viewport)) return false;
  return !obstacles.some((o) => rectsOverlap(candidate, o, CLEARANCE));
}
function minObstacleDistance(candidate, obstacles) {
  if (obstacles.length === 0) return Infinity;
  let minDist = Infinity;
  for (const obstacle of obstacles) {
    minDist = Math.min(minDist, rectDistance(candidate, obstacle));
  }
  return minDist;
}
function directionalRoom(candidate, obstacles, viewport) {
  const margin = windowMargin();
  const leftBound = margin;
  const rightBound = viewport.width - margin;
  const topBound = margin;
  const bottomBound = viewport.height - margin;
  let leftRoom = candidate.x - leftBound;
  let rightRoom = rightBound - (candidate.x + candidate.width);
  let topRoom = candidate.y - topBound;
  let bottomRoom = bottomBound - (candidate.y + candidate.height);
  for (const obstacle of obstacles) {
    const verticalOverlap2 = Math.min(candidate.y + candidate.height, obstacle.y + obstacle.height) - Math.max(candidate.y, obstacle.y) > 0;
    if (verticalOverlap2) {
      if (obstacle.x + obstacle.width <= candidate.x) {
        leftRoom = Math.min(leftRoom, candidate.x - (obstacle.x + obstacle.width));
      }
      if (obstacle.x >= candidate.x + candidate.width) {
        rightRoom = Math.min(
          rightRoom,
          obstacle.x - (candidate.x + candidate.width)
        );
      }
    }
    const horizontalOverlap2 = Math.min(candidate.x + candidate.width, obstacle.x + obstacle.width) - Math.max(candidate.x, obstacle.x) > 0;
    if (horizontalOverlap2) {
      if (obstacle.y + obstacle.height <= candidate.y) {
        topRoom = Math.min(topRoom, candidate.y - (obstacle.y + obstacle.height));
      }
      if (obstacle.y >= candidate.y + candidate.height) {
        bottomRoom = Math.min(
          bottomRoom,
          obstacle.y - (candidate.y + candidate.height)
        );
      }
    }
  }
  return {
    horizontal: leftRoom + rightRoom + candidate.width,
    vertical: topRoom + bottomRoom + candidate.height
  };
}
function emptinessScore(pos, size, obstacles, viewport) {
  const candidate = { ...pos, ...size };
  const nearest = minObstacleDistance(candidate, obstacles);
  const room = directionalRoom(candidate, obstacles, viewport);
  const openArea = room.horizontal * room.vertical;
  return nearest * 4 + Math.sqrt(openArea);
}
function marginAnchorCandidates(size, viewport) {
  const margin = windowMargin();
  const { width: w, height: h } = size;
  const vw = viewport.width;
  const vh = viewport.height;
  return [
    { x: margin, y: margin },
    { x: (vw - w) / 2, y: margin },
    { x: vw - margin - w, y: margin },
    { x: margin, y: vh - margin - h },
    { x: (vw - w) / 2, y: vh - margin - h },
    { x: vw - margin - w, y: vh - margin - h },
    { x: margin, y: (vh - h) / 2 },
    { x: vw - margin - w, y: (vh - h) / 2 }
  ];
}
function marginStripCandidates(size, viewport) {
  const margin = windowMargin();
  const { width: w, height: h } = size;
  const vw = viewport.width;
  const vh = viewport.height;
  const step = 28;
  const positions = [];
  for (let x = margin; x <= vw - margin - w; x += step) {
    positions.push({ x, y: margin });
    positions.push({ x, y: vh - margin - h });
  }
  for (let y = margin + step; y <= vh - margin - h - step; y += step) {
    positions.push({ x: margin, y });
    positions.push({ x: vw - margin - w, y });
  }
  return positions;
}
function horizontalEdgeGapCandidates(edgeY, size, obstacles, viewport) {
  const margin = windowMargin();
  const { width: w } = size;
  const left = margin;
  const right = viewport.width - margin;
  const band = {
    x: left,
    y: edgeY,
    width: right - left,
    height: size.height
  };
  const blocking = obstacles.filter((o) => rectsOverlap(o, band, 0)).map((o) => ({ left: o.x, right: o.x + o.width })).sort((a, b) => a.left - b.left);
  const gaps = [];
  let cursor = left;
  for (const block of blocking) {
    if (block.left > cursor) gaps.push({ start: cursor, end: block.left });
    cursor = Math.max(cursor, block.right);
  }
  if (cursor < right) gaps.push({ start: cursor, end: right });
  return gaps.filter((gap) => gap.end - gap.start >= w + CLEARANCE * 2).map((gap) => ({
    x: (gap.start + gap.end - w) / 2,
    y: edgeY
  }));
}
function verticalEdgeGapCandidates(edgeX, size, obstacles, viewport) {
  const margin = windowMargin();
  const { height: h } = size;
  const top = margin;
  const bottom = viewport.height - margin;
  const band = {
    x: edgeX,
    y: top,
    width: size.width,
    height: bottom - top
  };
  const blocking = obstacles.filter((o) => rectsOverlap(o, band, 0)).map((o) => ({ top: o.y, bottom: o.y + o.height })).sort((a, b) => a.top - b.top);
  const gaps = [];
  let cursor = top;
  for (const block of blocking) {
    if (block.top > cursor) gaps.push({ start: cursor, end: block.top });
    cursor = Math.max(cursor, block.bottom);
  }
  if (cursor < bottom) gaps.push({ start: cursor, end: bottom });
  return gaps.filter((gap) => gap.end - gap.start >= h + CLEARANCE * 2).map((gap) => ({
    x: edgeX,
    y: (gap.start + gap.end - h) / 2
  }));
}
function collectCandidates(size, obstacles, viewport) {
  const margin = windowMargin();
  const { width: w, height: h } = size;
  const vh = viewport.height;
  const vw = viewport.width;
  const raw = [
    ...marginAnchorCandidates(size, viewport),
    ...marginStripCandidates(size, viewport),
    ...horizontalEdgeGapCandidates(margin, size, obstacles, viewport),
    ...horizontalEdgeGapCandidates(vh - margin - h, size, obstacles, viewport),
    ...verticalEdgeGapCandidates(margin, size, obstacles, viewport),
    ...verticalEdgeGapCandidates(vw - margin - w, size, obstacles, viewport)
  ];
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const pos of raw) {
    const key = positionKey(pos);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(pos);
  }
  return unique;
}
function scoreValidPositions(candidates, size, obstacles, viewport) {
  return candidates.filter((pos) => isPositionClear(pos, size, obstacles, viewport)).map((pos) => ({
    pos,
    score: emptinessScore(pos, size, obstacles, viewport)
  })).sort((a, b) => b.score - a.score);
}
function pickEmptiestPosition(scored, current) {
  if (scored.length === 0) return null;
  const best = scored[0];
  if (current) {
    const currentEntry = scored.find(
      (entry) => positionKey(entry.pos) === positionKey(current)
    );
    if (currentEntry && currentEntry.score >= best.score - SCORE_HYSTERESIS) {
      return current;
    }
  }
  return best.pos;
}
function findFallbackPosition(target, size, obstacles, viewport) {
  const margin = windowMargin();
  const gridStep = 24;
  const { width: w, height: h } = size;
  const candidates = [];
  for (let y = margin; y <= viewport.height - margin - h; y += gridStep) {
    for (let x = margin; x <= viewport.width - margin - w; x += gridStep) {
      candidates.push({ x, y });
    }
  }
  const scored = scoreValidPositions(candidates, size, obstacles, viewport);
  if (scored.length > 0) return scored[0].pos;
  if (isPositionClear(target, size, obstacles, viewport)) return target;
  const center = {
    x: (viewport.width - size.width) / 2,
    y: (viewport.height - size.height) / 2
  };
  for (let step = 1; step <= 12; step++) {
    const t = step / 12;
    const pos = {
      x: Math.round(target.x + (center.x - target.x) * t),
      y: Math.round(target.y + (center.y - target.y) * t)
    };
    if (isPositionClear(pos, size, obstacles, viewport)) return pos;
  }
  return {
    x: clampScalar2(
      target.x,
      margin,
      viewport.width - margin - size.width
    ),
    y: clampScalar2(
      target.y,
      margin,
      viewport.height - margin - size.height
    )
  };
}
function findAutoPlacedPosition(panelId, current, size, positions, sizes, dragDebug, viewport, fallbackPosition) {
  const obstacles = getObstacleRects(panelId, positions, sizes, dragDebug);
  const candidates = collectCandidates(size, obstacles, viewport);
  const scored = scoreValidPositions(candidates, size, obstacles, viewport);
  const best = pickEmptiestPosition(scored, current);
  if (best) return best;
  return findFallbackPosition(fallbackPosition, size, obstacles, viewport);
}
var findShortcutsPosition = findAutoPlacedPosition;
var TEXT_CLASS = "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase";
var VIEWPORT_MARGIN = 12;
var TOOLTIP_GAP = 12;
var TOOLTIP_WIDTH = 200;
function clampTooltipPlacement(anchor, tooltip, viewport) {
  let left = anchor.left + anchor.width / 2 - tooltip.width / 2;
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewport.width - VIEWPORT_MARGIN - tooltip.width)
  );
  let top = anchor.top - tooltip.height - TOOLTIP_GAP;
  if (top < VIEWPORT_MARGIN) {
    top = anchor.bottom + TOOLTIP_GAP;
  }
  top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(top, viewport.height - VIEWPORT_MARGIN - tooltip.height)
  );
  return { top, left, maxWidth: TOOLTIP_WIDTH };
}
function useViewportSize() {
  const [viewport, setViewport] = react.useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));
  react.useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return viewport;
}
function FloatingHelp({
  id = "shortcuts",
  fallbackPosition,
  tooltip,
  ariaLabel = "Keyboard shortcuts"
}) {
  const useStore = usePrismaticStore();
  const workspaceMode = useStore((s) => s.workspaceMode);
  const uiPositions = useStore((s) => s.uiPositions);
  const uiSizes = useStore((s) => s.uiSizes);
  const uiDragDebug = useStore((s) => s.uiDragDebug);
  const setUiGroupPosition = useStore((s) => s.setUiGroupPosition);
  const setUiGroupSize = useStore((s) => s.setUiGroupSize);
  const viewport = useViewportSize();
  const rootRef = react.useRef(null);
  const anchorRef = react.useRef(null);
  const tooltipRef = react.useRef(null);
  const lastPositionRef = react.useRef(null);
  const [measuredSize, setMeasuredSize] = react.useState({ width: 24, height: 24 });
  const [hovered, setHovered] = react.useState(false);
  const [placement, setPlacement] = react.useState(null);
  react.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const updateSize = () => {
      setMeasuredSize({
        width: el.offsetWidth,
        height: el.offsetHeight
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const position = react.useMemo(
    () => findAutoPlacedPosition(
      id,
      lastPositionRef.current,
      measuredSize,
      uiPositions,
      uiSizes,
      uiDragDebug,
      viewport,
      fallbackPosition
    ),
    [id, measuredSize, uiDragDebug, uiPositions, uiSizes, viewport, fallbackPosition]
  );
  react.useEffect(() => {
    lastPositionRef.current = position;
  }, [position]);
  react.useEffect(() => {
    setUiGroupPosition(id, position);
  }, [id, position, setUiGroupPosition]);
  react.useEffect(() => {
    setUiGroupSize(id, measuredSize);
  }, [id, measuredSize, setUiGroupSize]);
  react.useLayoutEffect(() => {
    if (!hovered) {
      setPlacement(null);
      return;
    }
    const anchor = anchorRef.current;
    const tip = tooltipRef.current;
    if (!anchor || !tip) return;
    setPlacement(
      clampTooltipPlacement(
        anchor.getBoundingClientRect(),
        tip.getBoundingClientRect(),
        viewport
      )
    );
  }, [hovered, viewport, position, workspaceMode]);
  const tooltipContent = tooltip(workspaceMode);
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: rootRef,
        className: "pointer-events-auto absolute z-50 w-fit",
        style: {
          left: position.x,
          top: position.y,
          transition: "left 180ms ease-out, top 180ms ease-out"
        },
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        children: /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            ref: anchorRef,
            className: `${TEXT_CLASS} cursor-default text-[rgba(255,255,255,0.9)] transition-colors ${hovered ? "text-white" : ""}`,
            "aria-label": ariaLabel,
            children: "?"
          }
        )
      }
    ),
    hovered && reactDom.createPortal(
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          ref: tooltipRef,
          role: "tooltip",
          className: "pointer-events-none fixed z-[60] w-[200px] rounded-2xl bg-black/75 px-3 py-2.5 lowercase text-white/90 shadow-lg backdrop-blur-sm transition-opacity duration-150",
          style: {
            top: placement?.top ?? -9999,
            left: placement?.left ?? -9999,
            maxWidth: placement?.maxWidth ?? TOOLTIP_WIDTH,
            opacity: placement ? 1 : 0
          },
          children: tooltipContent
        }
      ),
      document.body
    )
  ] });
}
var HOVER_GRACE_MS = 220;
function SizeIcon({ modules, maxModules }) {
  const fill = Math.min(modules, maxModules) / maxModules;
  const inset = (1 - fill) * 5;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 14 14",
      fill: "none",
      "aria-hidden": true,
      className: "opacity-80",
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "rect",
        {
          x: 1 + inset,
          y: 1 + inset,
          width: 12 - inset * 2,
          height: 12 - inset * 2,
          rx: "2",
          fill: "currentColor"
        }
      )
    }
  );
}
function ImageSizeToolbar({ modules, onChange }) {
  const allowed = [...imagePreviewModulesList()];
  const maxModules = allowed[allowed.length - 1] ?? 6;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: "workspace-controls flex items-center gap-0.5 rounded-full bg-black/75 p-0.5 text-white shadow-lg backdrop-blur-sm",
      role: "toolbar",
      "aria-label": "Preview size",
      children: allowed.map((count) => {
        const active = count === modules;
        const px = imagePreviewSizePx(count);
        return /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            title: `${px}px preview`,
            "aria-pressed": active,
            className: [
              "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] lowercase transition-colors",
              active ? "bg-white text-black" : "text-white/80 hover:bg-white/15 hover:text-white"
            ].join(" "),
            onPointerDown: (e) => e.stopPropagation(),
            onClick: () => onChange(count),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(SizeIcon, { modules: count, maxModules }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: px })
            ]
          },
          count
        );
      })
    }
  );
}
function ImagePanel({ children, panelId = "image" }) {
  const useStore = usePrismaticStore();
  const workspaceMode = useStore((s) => s.workspaceMode);
  const imageModules = useStore((s) => s.imagePreviewModules);
  const setImagePreviewModules = useStore((s) => s.setImagePreviewModules);
  const workspacePanel = useWorkspacePanel();
  const resizeStartRef = react.useRef(null);
  const hideTimerRef = react.useRef(null);
  const [resizing, setResizing] = react.useState(false);
  const [controlsOpen, setControlsOpen] = react.useState(false);
  const panelSize = imagePanelSize(imageModules);
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const openControls = () => {
    clearHideTimer();
    setControlsOpen(true);
  };
  const scheduleCloseControls = () => {
    if (resizing) return;
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setControlsOpen(false);
      hideTimerRef.current = null;
    }, HOVER_GRACE_MS);
  };
  react.useEffect(() => () => clearHideTimer(), []);
  react.useEffect(() => {
    if (!workspaceMode) {
      clearHideTimer();
      setControlsOpen(false);
    }
  }, [workspaceMode]);
  const panelHovered = workspacePanel?.id === panelId && workspacePanel.hovered;
  react.useEffect(() => {
    if (workspaceMode && panelHovered) openControls();
  }, [panelHovered, workspaceMode]);
  const onResizePointerDown = (e) => {
    if (!workspaceMode || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    openControls();
    resizeStartRef.current = { x: e.clientX, size: panelSize.width };
    setResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizePointerMove = (e) => {
    if (!resizing || !resizeStartRef.current) return;
    const delta = e.clientX - resizeStartRef.current.x;
    const nextSize = resizeStartRef.current.size + delta;
    setImagePreviewModules(imageModulesFromSize(nextSize));
  };
  const finishResize = (e) => {
    if (!resizing) return;
    resizeStartRef.current = null;
    setResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const showControls = workspaceMode && (controlsOpen || resizing);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: "workspace-hover-zone relative",
      onMouseEnter: openControls,
      onMouseLeave: scheduleCloseControls,
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: [
            "workspace-panel relative transition-[width,height] duration-200 ease-out",
            workspaceMode ? "pointer-events-none" : ""
          ].join(" "),
          style: panelSize,
          children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "size-full", children }),
            showControls && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "workspace-controls pointer-events-auto absolute left-1 top-1 z-30", children: /* @__PURE__ */ jsxRuntime.jsx(ImageSizeToolbar, { modules: imageModules, onChange: setImagePreviewModules }) }),
            workspaceMode && /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: [
                  "workspace-controls absolute -right-1.5 -bottom-1.5 z-10 size-4 cursor-nwse-resize transition-opacity duration-150",
                  showControls ? "opacity-100" : "opacity-0"
                ].join(" "),
                onPointerDown: onResizePointerDown,
                onPointerMove: onResizePointerMove,
                onPointerUp: finishResize,
                onPointerCancel: finishResize,
                "aria-label": "Resize preview",
                children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute right-0.5 bottom-0.5 size-2 rounded-sm border-r border-b border-white/70" })
              }
            ),
            workspaceMode && resizing && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "workspace-controls pointer-events-none absolute bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/90 lowercase backdrop-blur-sm", children: [
              panelSize.width,
              "px"
            ] })
          ]
        }
      )
    }
  );
}
var HOVER_GRACE_MS2 = 220;
function ColumnIcon({ count }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 14 14",
      fill: "none",
      "aria-hidden": true,
      className: "opacity-80",
      children: Array.from({ length: count }, (_, i) => {
        const colW = 12 / count - 1;
        const x = 1 + i * (colW + 1);
        return /* @__PURE__ */ jsxRuntime.jsx(
          "rect",
          {
            x,
            y: "2",
            width: colW,
            height: "10",
            rx: "1",
            fill: "currentColor"
          },
          i
        );
      })
    }
  );
}
function SliderColumnToolbar({ columnCount, onChange }) {
  const min = minSliderColumns();
  const max = maxSliderColumns();
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: "workspace-controls flex items-center gap-0.5 rounded-full bg-black/75 p-0.5 text-white shadow-lg backdrop-blur-sm",
      role: "toolbar",
      "aria-label": "Slider columns",
      children: Array.from({ length: max - min + 1 }, (_, i) => i + min).map((count) => {
        const active = count === columnCount;
        return /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            title: `${count} column${count === 1 ? "" : "s"}`,
            "aria-pressed": active,
            className: [
              "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] lowercase transition-colors",
              active ? "bg-white text-black" : "text-white/80 hover:bg-white/15 hover:text-white"
            ].join(" "),
            onPointerDown: (e) => e.stopPropagation(),
            onClick: () => onChange(count),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(ColumnIcon, { count }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: count })
            ]
          },
          count
        );
      })
    }
  );
}
function SlidersPanel({ children, panelId = "sliders" }) {
  const useStore = usePrismaticStore();
  const workspaceMode = useStore((s) => s.workspaceMode);
  const columnCount = useStore((s) => s.sliderColumnCount);
  const setSliderColumnCount = useStore((s) => s.setSliderColumnCount);
  const workspacePanel = useWorkspacePanel();
  const resizeStartRef = react.useRef(null);
  const hideTimerRef = react.useRef(null);
  const [resizing, setResizing] = react.useState(false);
  const [controlsOpen, setControlsOpen] = react.useState(false);
  const panelSize = slidersPanelSize(columnCount);
  const columnWidth = sliderColumnWidthPx();
  const columns = chunkIntoColumns(react.Children.toArray(children), columnCount);
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const openControls = () => {
    clearHideTimer();
    setControlsOpen(true);
  };
  const scheduleCloseControls = () => {
    if (resizing) return;
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setControlsOpen(false);
      hideTimerRef.current = null;
    }, HOVER_GRACE_MS2);
  };
  react.useEffect(() => () => clearHideTimer(), []);
  react.useEffect(() => {
    if (!workspaceMode) {
      clearHideTimer();
      setControlsOpen(false);
    }
  }, [workspaceMode]);
  const panelHovered = workspacePanel?.id === panelId && workspacePanel.hovered;
  react.useEffect(() => {
    if (workspaceMode && panelHovered) openControls();
  }, [panelHovered, workspaceMode]);
  const onResizePointerDown = (e) => {
    if (!workspaceMode || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    openControls();
    resizeStartRef.current = { x: e.clientX, width: panelSize.width };
    setResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizePointerMove = (e) => {
    if (!resizing || !resizeStartRef.current) return;
    const delta = e.clientX - resizeStartRef.current.x;
    const nextWidth = resizeStartRef.current.width + delta;
    setSliderColumnCount(columnCountFromWidth(nextWidth));
  };
  const finishResize = (e) => {
    if (!resizing) return;
    resizeStartRef.current = null;
    setResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const showControls = workspaceMode && (controlsOpen || resizing);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: "workspace-hover-zone relative",
      onMouseEnter: openControls,
      onMouseLeave: scheduleCloseControls,
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: [
            "workspace-panel relative transition-[width,height] duration-200 ease-out",
            workspaceMode ? "pointer-events-none" : ""
          ].join(" "),
          style: panelSize,
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "flex content-start gap-1",
                style: { width: panelSize.width, height: panelSize.height },
                children: columns.map((columnSliders, colIndex) => /* @__PURE__ */ jsxRuntime.jsx(
                  "div",
                  {
                    className: "flex shrink-0 flex-col gap-1",
                    style: { width: columnWidth },
                    children: columnSliders
                  },
                  colIndex
                ))
              }
            ),
            showControls && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "workspace-controls pointer-events-auto absolute left-1 top-1 z-30", children: /* @__PURE__ */ jsxRuntime.jsx(
              SliderColumnToolbar,
              {
                columnCount,
                onChange: setSliderColumnCount
              }
            ) }),
            workspaceMode && /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: [
                  "workspace-controls absolute top-0 -right-1.5 z-10 h-full w-3 cursor-ew-resize transition-opacity duration-150",
                  showControls ? "opacity-100" : "opacity-0"
                ].join(" "),
                onPointerDown: onResizePointerDown,
                onPointerMove: onResizePointerMove,
                onPointerUp: finishResize,
                onPointerCancel: finishResize,
                "aria-label": "Resize slider columns",
                children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute top-1/2 right-1 h-10 w-1 -translate-y-1/2 rounded-full bg-white/70" })
              }
            ),
            workspaceMode && resizing && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "workspace-controls pointer-events-none absolute bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/90 lowercase backdrop-blur-sm", children: [
              columnCount,
              " col \xB7 ",
              panelSize.width,
              "px"
            ] })
          ]
        }
      )
    }
  );
}
function Button({
  children,
  variant = "save",
  saveButtonBg = 'url("/assets/save-button-bg.svg")',
  className = "",
  type = "button",
  ...rest
}) {
  const size = variant === "save" ? "h-[113px] w-[216px] rounded-[var(--radius)]" : "h-[120px] w-[194px] rounded-[var(--radius)]";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      type,
      className: `group relative flex cursor-pointer select-none items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none ${size} ${className}`,
      ...rest,
      children: /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "absolute inset-0 flex items-center justify-center mix-blend-difference transform-gpu transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform group-hover:scale-[1.02] group-active:scale-[0.98] group-disabled:scale-100", children: [
        variant === "save" && /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            "aria-hidden": true,
            className: "pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat",
            style: { backgroundImage: saveButtonBg }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "relative z-[1] text-center font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] text-black lowercase", children })
      ] })
    }
  );
}
function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
function snapToStep(value, min, step) {
  const steps = Math.round((value - min) / step);
  return min + steps * step;
}
var outerBgStyle = {
  backgroundImage: "linear-gradient(90deg, rgb(36, 35, 38) 0%, rgb(36, 35, 38) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%)"
};
var ROW_H = 28;
var INNER_STACK_H = ROW_H + 4 + ROW_H;
var OUTER_H = 70;
var OUTER_PAD_Y = 8;
var DEFAULT_ROW_H = OUTER_H - OUTER_PAD_Y;
var INNER_PAD = 4;
var FALLBACK_RADIUS = 32;
function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  displayValue,
  onChange,
  lineTopSrc,
  lineBottomSrc
}) {
  const trackAreaRef = react.useRef(null);
  const hitAreaRef = react.useRef(null);
  const draggingRef = react.useRef(false);
  const [hovered, setHovered] = react.useState(false);
  const [dragging, setDragging] = react.useState(false);
  const [trackWidthPx, setTrackWidthPx] = react.useState(0);
  const [innerCornerPx, setInnerCornerPx] = react.useState(
    FALLBACK_RADIUS - INNER_PAD
  );
  const [editingValue, setEditingValue] = react.useState(false);
  const [draftValue, setDraftValue] = react.useState("");
  const valueInputRef = react.useRef(null);
  react.useEffect(() => {
    const el = trackAreaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setTrackWidthPx(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setTrackWidthPx(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  react.useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(
      "--radius"
    );
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) setInnerCornerPx(parsed - INNER_PAD);
  }, []);
  const normalized = max === min ? 0 : clamp((value - min) / (max - min), 0, 1);
  const shown = displayValue?.(value) ?? (Number.isInteger(step) && step >= 1 ? String(Math.round(value)) : value.toFixed(4).replace(/\.?0+$/, ""));
  const isBoolean = min === 0 && max === 1 && step === 1;
  const isToggle = isBoolean;
  const minLabel = isBoolean ? "false" : String(min);
  const maxLabel = isBoolean ? "true" : String(max);
  react.useEffect(() => {
    if (!editingValue) return;
    valueInputRef.current?.focus();
    valueInputRef.current?.select();
  }, [editingValue]);
  const commitDraftValue = react.useCallback(() => {
    if (isToggle) return;
    const raw = Number(draftValue.trim());
    if (!Number.isFinite(raw)) {
      setEditingValue(false);
      setDraftValue("");
      return;
    }
    const snapped = snapToStep(raw, min, step);
    const clamped = clamp(snapped, min, max);
    onChange(clamped);
    setEditingValue(false);
    setDraftValue("");
  }, [draftValue, isToggle, max, min, onChange, step]);
  const cancelDraftValue = react.useCallback(() => {
    setEditingValue(false);
    setDraftValue("");
  }, []);
  const setFromClientX = react.useCallback(
    (clientX) => {
      const el = hitAreaRef.current ?? trackAreaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const t = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + t * (max - min);
      const next = snapToStep(raw, min, step);
      const clamped = clamp(next, min, max);
      if (clamped !== value) onChange(clamped);
    },
    [max, min, onChange, step, value]
  );
  const onPointerDown = (e) => {
    e.preventDefault();
    if (isToggle) {
      onChange(value >= 0.5 ? 0 : 1);
      return;
    }
    draggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e) => {
    if (isToggle) return;
    if (!draggingRef.current) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = (e) => {
    if (isToggle) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
    }
  };
  const fillPct = react.useMemo(() => normalized * 100, [normalized]);
  const showRange = hovered || dragging;
  const showHandle = hovered || dragging;
  const pillWidthStyle = react.useMemo(() => {
    const minPx = innerCornerPx * 2;
    if (fillPct <= 0) return { width: "0%", minWidth: void 0 };
    if (fillPct >= 100) return { width: "100%", minWidth: void 0 };
    if (trackWidthPx <= 0) return { width: `${fillPct}%`, minWidth: void 0 };
    const minPct = minPx / trackWidthPx * 100;
    const visualPct = Math.max(fillPct, minPct);
    return {
      width: `${visualPct}%`,
      minWidth: visualPct === minPct && fillPct < minPct ? `${minPx}px` : void 0
    };
  }, [fillPct, trackWidthPx, innerCornerPx]);
  const stackHeight = showRange ? INNER_STACK_H : DEFAULT_ROW_H;
  const topRowHeight = showRange ? ROW_H : DEFAULT_ROW_H;
  const topRowHeightStyle = { height: topRowHeight, minHeight: topRowHeight };
  const bottomRowHeightStyle = { height: ROW_H, minHeight: ROW_H };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: "relative box-border flex w-full flex-col justify-center overflow-hidden rounded-[var(--radius)] p-1",
      style: { ...outerBgStyle, height: OUTER_H, minHeight: OUTER_H, maxHeight: OUTER_H },
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            ref: hitAreaRef,
            role: "slider",
            "aria-valuemin": min,
            "aria-valuemax": max,
            "aria-valuenow": value,
            "aria-label": label,
            tabIndex: 0,
            className: `absolute inset-0 z-10 touch-none select-none rounded-[var(--radius)] outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${isToggle ? "cursor-pointer" : "cursor-ew-resize"}`,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onKeyDown: (e) => {
              if (isToggle) {
                if (e.key !== " " && e.key !== "Enter") return;
                e.preventDefault();
                onChange(value >= 0.5 ? 0 : 1);
                return;
              }
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const dir = e.key === "ArrowRight" ? 1 : -1;
              const delta = step * dir * (e.shiftKey ? 10 : 1);
              const next = clamp(snapToStep(value + delta, min, step), min, max);
              if (next !== value) onChange(next);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            className: "relative z-0 flex shrink-0 flex-col gap-1 transition-[height] duration-300 ease-out",
            style: { height: stackHeight, minHeight: stackHeight, maxHeight: stackHeight },
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs(
                "div",
                {
                  className: "flex shrink-0 items-center pr-[18px] transition-[height] duration-300 ease-out",
                  style: topRowHeightStyle,
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsxs(
                      "div",
                      {
                        ref: trackAreaRef,
                        className: "relative flex min-h-0 flex-1 items-stretch",
                        style: topRowHeightStyle,
                        children: [
                          /* @__PURE__ */ jsxRuntime.jsx(
                            "div",
                            {
                              className: `pointer-events-none absolute inset-y-0 left-0 rounded-[var(--radius-inner)] ${showRange ? "bg-transparent" : "bg-[#313034]"}`,
                              style: {
                                width: pillWidthStyle.width,
                                minWidth: pillWidthStyle.minWidth
                              },
                              "aria-hidden": true,
                              children: /* @__PURE__ */ jsxRuntime.jsx(
                                "div",
                                {
                                  className: `absolute inset-y-0 right-0 z-[2] w-0 transition-opacity duration-300 ease-out ${showHandle ? "opacity-100" : "opacity-0"}`,
                                  "aria-hidden": true,
                                  children: lineTopSrc && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute right-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 translate-x-1/2 rotate-90", children: /* @__PURE__ */ jsxRuntime.jsx(
                                    "img",
                                    {
                                      src: lineTopSrc,
                                      alt: "",
                                      className: "block h-full w-full max-w-none",
                                      draggable: false
                                    }
                                  ) })
                                }
                              )
                            }
                          ),
                          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative z-[1] flex w-full min-w-0 items-center pl-[18px] pr-3", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "min-w-0 truncate font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] text-[rgba(255,255,255,0.9)] lowercase", children: label }) })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        className: "relative z-20 flex shrink-0 items-center pl-2",
                        style: topRowHeightStyle,
                        children: editingValue && !isToggle ? /* @__PURE__ */ jsxRuntime.jsx(
                          "input",
                          {
                            ref: valueInputRef,
                            value: draftValue,
                            inputMode: "decimal",
                            className: "w-[120px] bg-transparent text-right font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] text-white tabular-nums outline-none",
                            onChange: (e) => setDraftValue(e.target.value),
                            onPointerDown: (e) => e.stopPropagation(),
                            onClick: (e) => e.stopPropagation(),
                            onBlur: commitDraftValue,
                            onKeyDown: (e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitDraftValue();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                cancelDraftValue();
                              }
                            }
                          }
                        ) : /* @__PURE__ */ jsxRuntime.jsx(
                          "button",
                          {
                            type: "button",
                            className: "cursor-text text-right font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] text-white tabular-nums",
                            onPointerDown: (e) => e.stopPropagation(),
                            onClick: (e) => {
                              e.stopPropagation();
                              if (isToggle) return;
                              setDraftValue(String(value));
                              setEditingValue(true);
                            },
                            children: shown
                          }
                        )
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsxs(
                "div",
                {
                  className: "flex shrink-0 items-center overflow-hidden pr-[18px] transition-[max-height,opacity] duration-300 ease-out",
                  style: {
                    ...bottomRowHeightStyle,
                    maxHeight: showRange ? ROW_H : 0,
                    opacity: showRange ? 1 : 0
                  },
                  "aria-hidden": !showRange,
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex min-h-0 flex-1 items-stretch", style: bottomRowHeightStyle, children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative flex min-h-0 flex-1 items-stretch", style: bottomRowHeightStyle, children: [
                      /* @__PURE__ */ jsxRuntime.jsx(
                        "div",
                        {
                          className: "pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-[var(--radius-inner-sm)] bg-[#313034] backdrop-blur-[14.649px] [corner-shape:round]",
                          style: {
                            width: pillWidthStyle.width,
                            minWidth: pillWidthStyle.minWidth
                          },
                          "aria-hidden": true,
                          children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute right-3 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex h-[18.015px] w-0 items-center justify-center", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex-none rotate-90", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative h-0 w-[18.015px]", children: lineBottomSrc && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute inset-[-1.72px_0_0_0]", children: /* @__PURE__ */ jsxRuntime.jsx(
                            "img",
                            {
                              src: lineBottomSrc,
                              alt: "",
                              className: "block size-full max-w-none",
                              draggable: false
                            }
                          ) }) }) }) }) })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative z-[1] flex w-full min-w-0 items-center pl-[18px] pr-3", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] text-[rgba(255,255,255,0.9)] tabular-nums lowercase", children: minLabel }) })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        className: "pointer-events-none flex shrink-0 items-center justify-end pl-2",
                        style: bottomRowHeightStyle,
                        children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] text-white tabular-nums lowercase", children: maxLabel })
                      }
                    )
                  ]
                }
              )
            ]
          }
        )
      ]
    }
  );
}
var EXPANDED_W = "304.012px";
var TEXT_CLASS2 = "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[17.897px] leading-[1.1] tracking-[-0.3579px] text-center whitespace-nowrap";
function RadioRow({ label, isActive, onClick }) {
  const bg = isActive ? "bg-[#e1e1e1] hover:bg-[rgba(225,225,225,0.5)]" : "bg-[#313034]";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      type: "button",
      onClick,
      style: {
        minWidth: isActive ? EXPANDED_W : void 0
      },
      className: `group/radio flex h-9 min-w-0 cursor-pointer items-center px-2.5 outline-none transition-[min-width,background-color] duration-200 ease-out hover:min-w-[304.012px] ${bg}`,
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: `${TEXT_CLASS2} ${isActive ? "text-black" : "text-white mix-blend-difference"}`, children: label })
    }
  );
}
function Radio({
  items,
  value,
  defaultActiveIndex = 0,
  onChange,
  className = ""
}) {
  const [internalActive, setInternalActive] = react.useState(defaultActiveIndex);
  const active = value ?? internalActive;
  const select = (index) => {
    if (value === void 0) setInternalActive(index);
    onChange?.(index);
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: `flex flex-col items-start ${className}`, children: items.map((label, i) => /* @__PURE__ */ jsxRuntime.jsx(
    RadioRow,
    {
      label,
      isActive: i === active,
      onClick: () => select(i)
    },
    `${label}-${i}`
  )) });
}
var TEXT_LG = "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase";
var TEXT_SM = "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] lowercase";
function ImageComponent({
  src,
  kind,
  fileName,
  sizeKB,
  size,
  onReplace
}) {
  const inputId = react.useId();
  const inputRef = react.useRef(null);
  const [isActive, setIsActive] = react.useState(false);
  const metrics = imageComponentMetrics(size);
  const shortName = fileName.length > 42 ? `${fileName.slice(0, 39)}\u2026` : fileName;
  const openPicker = () => inputRef.current?.click();
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: "group relative shrink-0 cursor-pointer rounded-[500px] outline-none [corner-shape:round]",
      style: { width: size, height: size },
      role: "button",
      tabIndex: 0,
      "aria-label": "Replace source image or video",
      onClick: openPicker,
      onKeyDown,
      onMouseEnter: () => setIsActive(true),
      onMouseLeave: () => setIsActive(false),
      onFocus: () => setIsActive(true),
      onBlur: () => setIsActive(false),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: "absolute inset-0 overflow-hidden rounded-full transition-[filter] duration-200 [corner-shape:round]",
            style: { filter: `blur(${isActive ? 0 : metrics.blur}px)` },
            children: kind === "video" ? /* @__PURE__ */ jsxRuntime.jsx(
              "video",
              {
                src,
                muted: true,
                loop: true,
                playsInline: true,
                autoPlay: true,
                className: "block size-full max-w-none object-cover"
              }
            ) : /* @__PURE__ */ jsxRuntime.jsx(
              "img",
              {
                alt: "",
                src,
                className: "block size-full max-w-none object-cover"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            className: "absolute inset-0 flex flex-col items-center justify-center",
            style: {
              paddingLeft: metrics.paddingX,
              paddingRight: metrics.paddingX,
              paddingTop: metrics.paddingY,
              paddingBottom: metrics.paddingY
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs(
                "div",
                {
                  className: [
                    "flex w-full max-w-[274px] flex-col justify-center rounded-[var(--radius)] border border-solid border-white bg-[rgba(212,212,212,0.2)] pl-[18px] pr-[12px] text-[rgba(212,212,212,0.9)] backdrop-blur-[10px] transition-[background-color,border-color] duration-200 group-hover:border-transparent group-hover:bg-[rgba(255,255,255,0.5)] group-hover:text-[rgba(255,255,255,0.9)]",
                    metrics.showFileSize ? "gap-2 py-3" : "py-2.5"
                  ].join(" "),
                  style: {
                    width: metrics.metaWidth,
                    height: metrics.metaHeight
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "p",
                      {
                        className: [
                          "line-clamp-2",
                          metrics.compactFilename ? "max-h-[28px]" : "max-h-[44px]",
                          metrics.compactFilename ? TEXT_SM : TEXT_LG
                        ].join(" "),
                        children: shortName
                      }
                    ),
                    metrics.showFileSize && /* @__PURE__ */ jsxRuntime.jsxs("p", { className: TEXT_SM, children: [
                      sizeKB,
                      " kb"
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsxs(
                "div",
                {
                  className: "relative flex w-full max-w-[274px] items-center justify-center",
                  style: {
                    width: metrics.metaWidth,
                    height: metrics.replaceHeight
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "svg",
                      {
                        viewBox: "0 0 274 120",
                        preserveAspectRatio: "none",
                        "aria-hidden": "true",
                        className: "absolute inset-0 size-full",
                        children: /* @__PURE__ */ jsxRuntime.jsx(
                          "ellipse",
                          {
                            cx: "137",
                            cy: "60",
                            rx: "136",
                            ry: "59",
                            fill: isActive ? "white" : "transparent",
                            stroke: isActive ? "transparent" : "white",
                            strokeWidth: "1",
                            vectorEffect: "non-scaling-stroke"
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "span",
                      {
                        className: `relative z-[1] text-[rgba(212,212,212,0.9)] ${TEXT_LG}`,
                        children: "replace"
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            ref: inputRef,
            id: inputId,
            type: "file",
            accept: "image/*,video/*",
            className: "sr-only",
            onChange: (e) => {
              const f = e.target.files?.[0];
              if (f) onReplace(f);
              e.target.value = "";
            }
          }
        )
      ]
    }
  );
}

// src/workspace/layout.ts
function createGridLayout(panels, viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920, viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080, gap = 16) {
  const margin = windowMargin();
  const positions = {};
  let x = margin;
  let y = margin;
  let rowHeight = 0;
  for (const panel of panels) {
    if (x + panel.size.width > viewportWidth - margin) {
      x = margin;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    positions[panel.id] = { x, y };
    x += panel.size.width + gap;
    rowHeight = Math.max(rowHeight, panel.size.height);
  }
  return positions;
}
function mergePanelSizes(sizes, overrides) {
  const merged = { ...sizes };
  for (const [id, size] of Object.entries(overrides)) {
    if (size) merged[id] = size;
  }
  return merged;
}

exports.Button = Button;
exports.CreativeCanvas = CreativeCanvas;
exports.DEFAULT_IMAGE_MODULES = DEFAULT_IMAGE_MODULES;
exports.DEFAULT_PRISMATIC_CONFIG = DEFAULT_PRISMATIC_CONFIG;
exports.DEFAULT_SLIDER_COLUMNS = DEFAULT_SLIDER_COLUMNS;
exports.FloatingHelp = FloatingHelp;
exports.IMAGE_DESIGN_SIZE = IMAGE_DESIGN_SIZE;
exports.IMAGE_PREVIEW_MODULES = IMAGE_PREVIEW_MODULES;
exports.ImageComponent = ImageComponent;
exports.ImagePanel = ImagePanel;
exports.LAYOUT_GAP = LAYOUT_GAP;
exports.MODULE = MODULE;
exports.PrismaticProvider = PrismaticProvider;
exports.Radio = Radio;
exports.SLIDER_COUNT = SLIDER_COUNT;
exports.Slider = Slider;
exports.SlidersPanel = SlidersPanel;
exports.WorkspaceDebugOverlay = WorkspaceDebugOverlay;
exports.WorkspaceGroup = WorkspaceGroup;
exports.WorkspacePanel = WorkspacePanel;
exports.WorkspaceShell = WorkspaceShell;
exports.chunkIntoColumns = chunkIntoColumns;
exports.clampImageModules = clampImageModules;
exports.clampSliderColumns = clampSliderColumns;
exports.clampToWorkspaceBounds = clampToWorkspaceBounds;
exports.collectCanvasPanSnapTargets = collectCanvasPanSnapTargets;
exports.collectSnapTargets = collectSnapTargets;
exports.collectWorkspaceSnapLines = collectWorkspaceSnapLines;
exports.columnCountFromWidth = columnCountFromWidth;
exports.createGridLayout = createGridLayout;
exports.createPrismaticStore = createPrismaticStore;
exports.findAutoPlacedPosition = findAutoPlacedPosition;
exports.findShortcutsPosition = findShortcutsPosition;
exports.getActiveCanvasSnapLines = getActiveCanvasSnapLines;
exports.getActiveDistributionGuides = getActiveDistributionGuides;
exports.getActiveVisualSnapLines = getActiveVisualSnapLines;
exports.getCanvasScreenRect = getCanvasScreenRect;
exports.getCanvasSnapTargetIds = getCanvasSnapTargetIds;
exports.getSnapTargetIds = getSnapTargetIds;
exports.getWindowMarginRect = getWindowMarginRect;
exports.imageComponentMetrics = imageComponentMetrics;
exports.imageModulesFromSize = imageModulesFromSize;
exports.imagePanelSize = imagePanelSize;
exports.imagePreviewSizePx = imagePreviewSizePx;
exports.isSnapParticipant = isSnapParticipant;
exports.isSnappedToTopMargin = isSnappedToTopMargin;
exports.isUiPositionClear = isUiPositionClear;
exports.layoutGap = layoutGap;
exports.mergePanelSizes = mergePanelSizes;
exports.moduleSize = moduleSize;
exports.moduleSpanPx = moduleSpanPx;
exports.resolvePrismaticConfig = resolvePrismaticConfig;
exports.samePanelIds = samePanelIds;
exports.sameUiGroupIds = sameUiGroupIds;
exports.sliderColumnWidthPx = sliderColumnWidthPx;
exports.slidersPanelSize = slidersPanelSize;
exports.snapCanvasPan = snapCanvasPan;
exports.snapPosition = snapPosition;
exports.snapScalar = snapScalar;
exports.snapThreshold = snapThreshold;
exports.usePanelPosition = usePanelPosition;
exports.usePrismaticStore = usePrismaticStore;
exports.useWorkspaceGroup = useWorkspaceGroup;
exports.useWorkspaceMode = useWorkspaceMode;
exports.useWorkspacePanel = useWorkspacePanel;
exports.windowMargin = windowMargin;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map