import { getRuntimeConfig } from "../config"
import { moduleSpanPx } from "./modules"
import type { PanelSize } from "./types"

export function imagePreviewModulesList() {
  return getRuntimeConfig().layout.imagePreviewModules
}

export function defaultImageModules() {
  return getRuntimeConfig().layout.defaultImageModules
}

export function imageDesignSize() {
  return getRuntimeConfig().layout.imageDesignSize
}

export const IMAGE_PREVIEW_MODULES = [3, 5, 6] as const
export type ImagePreviewModules = (typeof IMAGE_PREVIEW_MODULES)[number]

export const MIN_IMAGE_MODULES = IMAGE_PREVIEW_MODULES[0]
export const MAX_IMAGE_MODULES = IMAGE_PREVIEW_MODULES[IMAGE_PREVIEW_MODULES.length - 1]
export const DEFAULT_IMAGE_MODULES: ImagePreviewModules = 6
export const IMAGE_DESIGN_SIZE = 436

export function imagePreviewSizePx(modules: number): number {
  return moduleSpanPx(clampImageModules(modules))
}

export function imagePanelSize(modules: number): PanelSize {
  const side = imagePreviewSizePx(modules)
  return { width: side, height: side }
}

export function clampImageModules(modules: number): number {
  const allowed = [...imagePreviewModulesList()]
  let best = allowed[0] ?? 3
  let bestDist = Infinity

  for (const candidate of allowed) {
    const dist = Math.abs(candidate - modules)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }

  return best
}

export function imageModulesFromSize(px: number): number {
  const allowed = [...imagePreviewModulesList()]
  let best = allowed[0] ?? 3
  let bestDist = Infinity

  for (const modules of allowed) {
    const side = imagePreviewSizePx(modules)
    const dist = Math.abs(side - px)
    if (dist < bestDist) {
      bestDist = dist
      best = modules
    }
  }

  return best
}

export function imageComponentMetrics(size: number) {
  const design = imageDesignSize()
  const r = size / design
  const smallestSize = imagePreviewSizePx(MIN_IMAGE_MODULES)
  const showFileSize = size >= design
  const compactFilename = size <= smallestSize

  return {
    metaWidth: Math.round(274 * r),
    metaHeight: showFileSize ? Math.round(70 * r) : undefined,
    replaceHeight: Math.round(120 * r),
    blur: Math.max(12, Math.round(44 * r)),
    paddingX: Math.round(20 * r),
    paddingY: Math.round(10 * r),
    showFileSize,
    compactFilename,
  }
}
