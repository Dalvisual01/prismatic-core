import { getRuntimeConfig } from "../config"
import { layoutGap, moduleSpanPx } from "./modules"

export const SLIDER_COL_MODULES = 6
export const MIN_SLIDER_COLUMNS = 1
export const MAX_SLIDER_COLUMNS = 3
export const DEFAULT_SLIDER_COLUMNS = 1
export const SLIDER_ITEM_HEIGHT = 70
export const SLIDER_COUNT = 8

export function sliderColumnModules() {
  return getRuntimeConfig().layout.sliderColumnModules
}

export function minSliderColumns() {
  return getRuntimeConfig().layout.minSliderColumns
}

export function maxSliderColumns() {
  return getRuntimeConfig().layout.maxSliderColumns
}

export function defaultSliderColumns() {
  return getRuntimeConfig().layout.defaultSliderColumns
}

export function sliderItemHeight() {
  return getRuntimeConfig().layout.sliderItemHeight
}

export function sliderColumnWidthPx() {
  return moduleSpanPx(sliderColumnModules())
}

export function slidersPerColumn(sliderCount: number, columnCount: number) {
  const columns = clampSliderColumns(columnCount)
  if (sliderCount <= 0) return 0
  return Math.ceil(sliderCount / columns)
}

export function slidersPanelHeightPx(
  columnCount: number,
  sliderCount = SLIDER_COUNT,
) {
  const rows = slidersPerColumn(sliderCount, columnCount)
  if (rows <= 0) return 0
  const gap = layoutGap()
  const rowH = sliderItemHeight()
  return rows * rowH + (rows - 1) * gap
}

export function slidersPanelSize(
  columnCount: number,
  sliderCount = SLIDER_COUNT,
) {
  const colW = sliderColumnWidthPx()
  const columns = clampSliderColumns(columnCount)
  const gap = layoutGap()
  return {
    width: columns * colW + Math.max(0, columns - 1) * gap,
    height: slidersPanelHeightPx(columns, sliderCount),
  }
}

export function clampSliderColumns(count: number) {
  return Math.min(maxSliderColumns(), Math.max(minSliderColumns(), count))
}

export function columnCountFromWidth(width: number) {
  const colW = sliderColumnWidthPx()
  const gap = layoutGap()
  const step = colW + gap
  const estimated = Math.round((width + gap) / step)
  return clampSliderColumns(estimated)
}

export function chunkIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const count = clampSliderColumns(columnCount)
  const columns = Array.from({ length: count }, () => [] as T[])
  const perCol = Math.ceil(items.length / count)
  let index = 0

  for (let col = 0; col < count; col++) {
    for (let row = 0; row < perCol && index < items.length; row++) {
      columns[col].push(items[index])
      index++
    }
  }

  return columns
}
