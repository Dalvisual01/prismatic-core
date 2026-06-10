import { getRuntimeConfig } from "../config"

export function layoutGap() {
  return getRuntimeConfig().workspace.layoutGap
}

export function moduleSize() {
  return getRuntimeConfig().workspace.moduleSize
}

/** @deprecated Use layoutGap() */
export const LAYOUT_GAP = 4

/** @deprecated Use moduleSize() */
export const MODULE = 70

export function moduleSpanPx(modules: number): number {
  if (modules <= 0) return 0
  const mod = moduleSize()
  const gap = layoutGap()
  return modules * mod + (modules - 1) * gap
}
