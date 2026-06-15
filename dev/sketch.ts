import type { SketchFactory } from "../src/canvas/types"
import { getRuntimeTheme, parseColor } from "../src/theme/tokens"

export const playgroundSketch: SketchFactory = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
  }

  p.draw = () => {
    const theme = getRuntimeTheme()
    const canvas = parseColor(theme.canvasBackground)
    const grid = parseColor(theme.gridLine)

    p.background(canvas.r, canvas.g, canvas.b)
    p.stroke(grid.r, grid.g, grid.b, grid.a * 255)
    p.strokeWeight(1)
    const step = 70
    for (let x = 0; x <= p.width; x += step) p.line(x, 0, x, p.height)
    for (let y = 0; y <= p.height; y += step) p.line(0, y, p.width, y)
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }
}
