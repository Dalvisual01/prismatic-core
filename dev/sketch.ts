import type p5 from "p5"
import type { CanvasResolutionSize } from "../src/canvas/resolution"
import type { P5WithSketch, SketchFactory } from "../src/canvas/types"

const VERT = `#version 300 es
precision mediump float;

in vec3 aPosition;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`

const SOURCE_FRAG = `#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_backingResolution;
uniform vec2 u_logicalResolution;
uniform vec2 u_imageSize;
uniform float u_time;

out vec4 fragColor;

float distToLine(float coord, float spacing) {
  float m = mod(coord, spacing);
  return min(m, spacing - m);
}

float lineMask(float coord, float spacing, float width, float aa) {
  float d = distToLine(coord, spacing);
  return 1.0 - smoothstep(width, width + aa, d);
}

vec2 coverUV(vec2 uv, vec2 imageSize, vec2 canvasSize) {
  float imageAspect = imageSize.x / imageSize.y;
  float canvasAspect = canvasSize.x / canvasSize.y;
  vec2 scale = vec2(1.0);

  if (canvasAspect > imageAspect) {
    scale.y = imageAspect / canvasAspect;
  } else {
    scale.x = canvasAspect / imageAspect;
  }

  return (uv - 0.5) / scale + 0.5;
}

void main() {
  vec2 backingUV = gl_FragCoord.xy / u_backingResolution;
  vec2 logicalCoord = (gl_FragCoord.xy + 0.5) / u_backingResolution * u_logicalResolution;
  vec2 imageUV = coverUV(backingUV, u_imageSize, u_logicalResolution);
  float wave = sin(imageUV.y * 14.0 + u_time * 1.6) * 0.01;
  imageUV.x += wave;

  if (imageUV.x < 0.0 || imageUV.x > 1.0 || imageUV.y < 0.0 || imageUV.y > 1.0) {
    fragColor = vec4(0.08, 0.02, 0.03, 1.0);
    return;
  }

  vec4 color = texture(u_image, imageUV);

  // Measure everything in logical pixels so composition stays fixed across work scales.
  float logicalPixel = max(
    u_logicalResolution.x / u_backingResolution.x,
    u_logicalResolution.y / u_backingResolution.y
  );
  float aa = max(0.75, logicalPixel);

  float gridWide = max(
    lineMask(logicalCoord.x, 70.0, 1.0, aa),
    lineMask(logicalCoord.y, 70.0, 1.0, aa)
  );

  float stripeBand = step(u_logicalResolution.y - 36.0, logicalCoord.y) *
    (1.0 - step(u_logicalResolution.y - 12.0, logicalCoord.y)) *
    (1.0 - step(220.0, logicalCoord.x));
  float gridFine = lineMask(logicalCoord.x, 2.0, 1.0, aa) * stripeBand;

  float grid = max(gridWide * 0.14, gridFine * 0.35);

  fragColor = vec4(color.rgb + vec3(grid), 1.0);
}
`

const POST_FRAG = `#version 300 es
precision mediump float;

uniform sampler2D u_tex;
uniform vec2 u_backingResolution;
uniform vec2 u_logicalResolution;
uniform float u_amount;
uniform float u_time;

out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_backingResolution;
  vec2 logicalCoord = uv * u_logicalResolution;
  float amount = clamp(u_amount, 0.0, 1.0);
  float aberration = amount * 0.012;

  float r = texture(u_tex, uv + vec2(aberration, 0.0)).r;
  float g = texture(u_tex, uv).g;
  float b = texture(u_tex, uv - vec2(aberration, 0.0)).b;
  vec3 color = vec3(r, g, b);

  vec2 centered = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(centered, centered) * (0.25 + amount * 0.45);
  color *= clamp(vignette, 0.0, 1.0);

  float grain = hash(logicalCoord + u_time * 60.0);
  color += (grain - 0.5) * amount * 0.12;

  fragColor = vec4(color, 1.0);
}
`

export type PlaygroundSketchHooks = {
  getAmount: () => number
}

const resolveBufferSize = (
  p: P5WithSketch,
  logicalWidth: number,
  logicalHeight: number,
): CanvasResolutionSize =>
  p.getPrismaticCanvasSize?.(logicalWidth, logicalHeight) ?? {
    scale: 1,
    logicalWidth,
    logicalHeight,
    pixelWidth: logicalWidth,
    pixelHeight: logicalHeight,
  }

const getBackbufferSize = (p: P5WithSketch) => {
  const canvas = (p as p5 & { canvas?: HTMLCanvasElement }).canvas
  return {
    width: canvas?.width ?? 0,
    height: canvas?.height ?? 0,
  }
}

const createTestPattern = (p: P5WithSketch) => {
  const size = 1024
  const img = p.createImage(size, size)
  img.loadPixels()
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (x + y * size) * 4
      const wave = Math.sin(x * 0.02) * 0.5 + Math.cos(y * 0.018) * 0.5
      img.pixels[index] = 70 + x / size * 140 + wave * 24
      img.pixels[index + 1] = 40 + y / size * 90 + wave * 18
      img.pixels[index + 2] = 150 + (1 - x / size) * 80
      img.pixels[index + 3] = 255
    }
  }
  img.updatePixels()
  return img
}

export function createPlaygroundSketch({
  getAmount,
}: PlaygroundSketchHooks): SketchFactory {
  return (p: P5WithSketch) => {
    let sourceImage: p5.Image | null = null
    let pendingImage: p5.Image | null = null
    let pgSource: p5.Graphics | null = null
    let pgPost: p5.Graphics | null = null
    let sourceShader: p5.Shader | null = null
    let postShader: p5.Shader | null = null
    let lastScale = -1

    p.updateImage = (img) => {
      pendingImage = img
    }

    const ensureBuffers = () => {
      const scale = p.getPrismaticResolutionScale?.() ?? 1
      if (
        pgSource &&
        pgPost &&
        scale === lastScale &&
        pgSource.width === p.width &&
        pgSource.height === p.height
      ) {
        return
      }

      lastScale = scale
      pgSource?.remove()
      pgPost?.remove()

      pgSource = p.createGraphics(p.width, p.height, p.WEBGL)
      pgPost = p.createGraphics(p.width, p.height, p.WEBGL)
      sourceShader = p.createShader(VERT, SOURCE_FRAG)
      postShader = p.createShader(VERT, POST_FRAG)
    }

    const drawFullscreenShader = (
      gfx: p5.Graphics,
      shader: p5.Shader,
      uniforms: () => void,
    ) => {
      gfx.clear()
      gfx.push()
      gfx.shader(shader)
      uniforms()
      gfx.noStroke()
      gfx.rect(0, 0, 10, 10)
      gfx.pop()
    }

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL)
      p.frameRate(30)
      sourceImage = createTestPattern(p)
      ensureBuffers()
    }

    p.draw = () => {
      if (pendingImage) {
        sourceImage = pendingImage
        pendingImage = null
      }

      ensureBuffers()

      const source = sourceImage
      const buffer = pgSource
      const post = pgPost
      const sourceProgram = sourceShader
      const postProgram = postShader

      if (!source || !buffer || !post || !sourceProgram || !postProgram) {
        p.background(20, 19, 22)
        return
      }

      const bufferSize = resolveBufferSize(p, p.width, p.height)
      const amount = getAmount()
      const t = p.millis() * 0.001

      drawFullscreenShader(buffer, sourceProgram, () => {
        sourceProgram.setUniform("u_backingResolution", [
          bufferSize.pixelWidth,
          bufferSize.pixelHeight,
        ])
        sourceProgram.setUniform("u_logicalResolution", [p.width, p.height])
        sourceProgram.setUniform("u_imageSize", [source.width, source.height])
        sourceProgram.setUniform("u_time", t)
        sourceProgram.setUniform("u_image", source)
      })

      drawFullscreenShader(post, postProgram, () => {
        postProgram.setUniform("u_backingResolution", [
          bufferSize.pixelWidth,
          bufferSize.pixelHeight,
        ])
        postProgram.setUniform("u_logicalResolution", [p.width, p.height])
        postProgram.setUniform("u_amount", amount)
        postProgram.setUniform("u_time", t)
        postProgram.setUniform("u_tex", buffer)
      })

      p.background(20, 19, 22)
      p.push()
      p.translate(-p.width / 2, -p.height / 2)
      p.image(post, 0, 0, p.width, p.height)
      p.pop()
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
      lastScale = -1
      ensureBuffers()
    }
  }
}

export const playgroundSketch: SketchFactory = createPlaygroundSketch({
  getAmount: () => 0.42,
})

export { getBackbufferSize, resolveBufferSize }
