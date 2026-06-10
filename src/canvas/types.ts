import type p5 from "p5"

export type PreviewKind = "image" | "video"

export type P5WithSketch = p5 & {
  updateImage?: (img: p5.Image) => void
  updateVideo?: (url: string) => void
}

export type SketchFactory = (p: P5WithSketch) => void
