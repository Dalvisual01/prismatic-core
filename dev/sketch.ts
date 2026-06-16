import type { SketchFactory } from "../src/canvas/types"
import { getRuntimeTheme, parseColor } from "../src/theme/tokens"

type CanvasBackbuffer = {
  width: number
  height: number
}

const getBackbufferSize = (p: Parameters<SketchFactory>[0]): CanvasBackbuffer => {
  const ctx = p.drawingContext as CanvasRenderingContext2D | undefined
  const canvas = ctx?.canvas
  return {
    width: canvas?.width ?? 0,
    height: canvas?.height ?? 0,
  }
}

export const playgroundSketch: SketchFactory = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
  }

  p.draw = () => {
    const theme = getRuntimeTheme()
    const canvas = parseColor(theme.canvasBackground)
    const grid = parseColor(theme.gridLine)
    const scale = p.getPrismaticResolutionScale?.() ?? 1
    const backbuffer = getBackbufferSize(p)
    const t = p.millis() * 0.001

    p.background(canvas.r, canvas.g, canvas.b)

    // A fill-rate-heavy animated field: resolution changes should affect this cost.
    p.noStroke()
    p.blendMode(p.ADD)
    const orbCount = 180
    for (let i = 0; i < orbCount; i += 1) {
      const a = i * 0.618 + t * (0.28 + (i % 7) * 0.018)
      const r = 120 + (i % 17) * 18 + Math.sin(t * 0.6 + i) * 34
      const x = p.width * 0.5 + Math.cos(a) * r + Math.sin(t + i * 0.11) * 90
      const y = p.height * 0.5 + Math.sin(a * 1.17) * r
      const size = 44 + (i % 9) * 18
      p.fill(
        70 + (i % 3) * 46,
        110 + (i % 5) * 24,
        180 + (i % 4) * 16,
        9,
      )
      p.circle(x, y, size)
    }
    p.blendMode(p.BLEND)

    p.stroke(grid.r, grid.g, grid.b, grid.a * 255)
    p.strokeWeight(1)
    const step = 70
    for (let x = 0; x <= p.width; x += step) p.line(x, 0, x, p.height)
    for (let y = 0; y <= p.height; y += step) p.line(0, y, p.width, y)

    // Hairline calibration stripes make half/quarter resolution visibly softer.
    p.stroke(255, 255, 255, 58)
    for (let x = 24; x < 224; x += 2) {
      p.line(x, p.height - 32, x, p.height - 16)
    }

    p.noStroke()
    p.fill(0, 0, 0, 150)
    p.rect(18, 18, 314, 122, 18)
    p.fill(255, 255, 255, 230)
    p.textFont("system-ui, sans-serif")
    p.textSize(13)
    p.text("resolution proof sketch", 34, 44)
    p.fill(255, 255, 255, 170)
    p.textSize(11)
    p.text(`work scale: ${scale === 1 ? "full" : scale === 0.5 ? "half" : "quarter"}`, 34, 68)
    p.text(`logical canvas: ${p.width} x ${p.height}`, 34, 88)
    p.text(`backing pixels: ${backbuffer.width} x ${backbuffer.height}`, 34, 108)
    p.text(`fps: ${p.frameRate().toFixed(1)}`, 34, 128)
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }
}
