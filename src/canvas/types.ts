import type p5 from "p5"
import type { CanvasResolutionScale, CanvasResolutionSize } from "./resolution"

export type PreviewKind = "image" | "video"

export type P5WithSketch = p5 & {
  updateImage?: (img: p5.Image) => void
  updateVideo?: (url: string) => void
  getPrismaticResolutionScale?: () => CanvasResolutionScale
  getPrismaticCanvasSize?: (
    logicalWidth: number,
    logicalHeight: number,
  ) => CanvasResolutionSize
  resizePrismaticCanvas?: () => void
  exportPrismaticCanvasDataUrl?: () => Promise<string | null>
}

export type SketchFactory = (p: P5WithSketch) => void
