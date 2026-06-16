export type PrismaticBlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"

export const PRISMATIC_BLEND_MODES: PrismaticBlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
]

/** Six base colours — everything else is derived automatically. */
export type PrismaticPalette = {
  /** App page background. */
  background: string
  /** Control chrome — sliders, canvas frame. */
  surface: string
  /** Text, strokes, borders. */
  foreground: string
  /** Active / hover emphasis fills. */
  accent: string
  /** Text on accent fills — button hover, active radio, etc. */
  onAccent: string
  /** Muted fill — slider pill, inactive radio rows. */
  muted: string
}

export type PrismaticPaletteToken = keyof PrismaticPalette

export type PrismaticPaletteBlendModes = Record<
  PrismaticPaletteToken,
  PrismaticBlendMode
>

export const PRISMATIC_PALETTE_TOKEN_KEYS = [
  "background",
  "surface",
  "foreground",
  "accent",
  "onAccent",
  "muted",
] as const satisfies readonly PrismaticPaletteToken[]

export const PRISMATIC_PALETTE_TOKEN_LABELS: Record<
  PrismaticPaletteToken,
  string
> = {
  background: "background",
  surface: "surface",
  foreground: "foreground",
  accent: "accent",
  onAccent: "on accent",
  muted: "muted",
}

function deriveDefaultMuted(surface: string, foreground: string, background: string) {
  const dark = isDarkColor(background)
  return mixColors(surface, foreground, dark ? 0.08 : 0.12)
}

export const DEFAULT_PRISMATIC_PALETTE: PrismaticPalette = {
  background: "#141316",
  surface: "rgb(36, 35, 38)",
  foreground: "#ffffff",
  accent: "#e1e1e1",
  onAccent: "#000000",
  muted: deriveDefaultMuted("rgb(36, 35, 38)", "#ffffff", "#141316"),
}

export const DEFAULT_PRISMATIC_PALETTE_BLEND_MODES: PrismaticPaletteBlendModes = {
  background: "normal",
  surface: "normal",
  foreground: "normal",
  accent: "normal",
  onAccent: "normal",
  muted: "normal",
}

/** Derived token set consumed by components (do not edit manually). */
export type PrismaticTheme = {
  appBackground: string
  canvasBackground: string
  surface: string
  surfaceMuted: string
  surfaceActive: string
  borderSubtle: string
  textPrimary: string
  textMuted: string
  textOnActive: string
  accentStroke: string
  overlayBackground: string
  gridLine: string
  imageMetaBackground: string
  imageMetaBackgroundHover: string
}

export type PrismaticThemeToken = keyof PrismaticTheme

export type PrismaticThemeBlendModes = Record<
  PrismaticThemeToken,
  PrismaticBlendMode
>

export type PrismaticThemeInput =
  | {
      palette?: Partial<PrismaticPalette>
      paletteBlendModes?: Partial<PrismaticPaletteBlendModes>
    }
  | {
      colors?: Partial<PrismaticTheme>
      blendModes?: Partial<PrismaticThemeBlendModes>
    }

export const PRISMATIC_THEME_CSS_VARS = {
  appBackground: "--prismatic-app-bg",
  canvasBackground: "--prismatic-canvas-bg",
  surface: "--prismatic-surface",
  surfaceMuted: "--prismatic-surface-muted",
  surfaceActive: "--prismatic-surface-active",
  borderSubtle: "--prismatic-border-subtle",
  textPrimary: "--prismatic-text-primary",
  textMuted: "--prismatic-text-muted",
  textOnActive: "--prismatic-text-on-active",
  accentStroke: "--prismatic-accent-stroke",
  overlayBackground: "--prismatic-overlay-bg",
  gridLine: "--prismatic-grid-line",
  imageMetaBackground: "--prismatic-image-meta-bg",
  imageMetaBackgroundHover: "--prismatic-image-meta-bg-hover",
} as const satisfies Record<PrismaticThemeToken, string>

function themeBlendModeCssVar(token: PrismaticThemeToken) {
  return `${PRISMATIC_THEME_CSS_VARS[token]}-blend-mode`
}

export type RgbColor = { r: number; g: number; b: number; a: number }

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, value))
}

export function parseColor(value: string): RgbColor {
  const trimmed = value.trim()

  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1)
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex.padEnd(6, "0").slice(0, 6)
    const r = Number.parseInt(normalized.slice(0, 2), 16)
    const g = Number.parseInt(normalized.slice(2, 4), 16)
    const b = Number.parseInt(normalized.slice(4, 6), 16)
    return { r, g, b, a: 1 }
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  )
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] != null ? Number(rgbMatch[4]) : 1,
    }
  }

  return { r: 20, g: 19, b: 22, a: 1 }
}

export function colorToRgbaString({ r, g, b, a }: RgbColor) {
  const channels = [r, g, b].map((channel) => Math.round(channel))
  return a < 1
    ? `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${a})`
    : `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
}

export function withAlpha(color: string, alpha: number) {
  const { r, g, b } = parseColor(color)
  return colorToRgbaString({ r, g, b, a: alpha })
}

export function mixColors(a: string, b: string, amount: number) {
  const left = parseColor(a)
  const right = parseColor(b)
  const t = Math.min(1, Math.max(0, amount))

  return colorToRgbaString({
    r: left.r + (right.r - left.r) * t,
    g: left.g + (right.g - left.g) * t,
    b: left.b + (right.b - left.b) * t,
    a: left.a + (right.a - left.a) * t,
  })
}

export function shadeColor(color: string, amount: number) {
  const { r, g, b, a } = parseColor(color)
  const factor = 1 + amount

  return colorToRgbaString({
    r: clampChannel(r * factor),
    g: clampChannel(g * factor),
    b: clampChannel(b * factor),
    a,
  })
}

export function colorLuminance(color: string) {
  const { r, g, b } = parseColor(color)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function contrastOn(color: string) {
  return colorLuminance(color) > 0.55 ? "#000000" : "#ffffff"
}

export function isDarkColor(color: string) {
  return colorLuminance(color) < 0.5
}

export function resolvePrismaticPalette(
  palette?: Partial<PrismaticPalette>,
): PrismaticPalette {
  const resolved = {
    ...DEFAULT_PRISMATIC_PALETTE,
    ...palette,
  }

  if (palette?.onAccent == null && palette?.accent != null) {
    resolved.onAccent = contrastOn(resolved.accent)
  }

  if (palette?.muted == null) {
    resolved.muted = deriveDefaultMuted(
      resolved.surface,
      resolved.foreground,
      resolved.background,
    )
  }

  return resolved
}

export function resolvePrismaticPaletteBlendModes(
  blendModes?: Partial<PrismaticPaletteBlendModes>,
): PrismaticPaletteBlendModes {
  return {
    ...DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
    ...blendModes,
  }
}

export function deriveThemeFromPalette(palette: PrismaticPalette): PrismaticTheme {
  const dark = isDarkColor(palette.background)

  return {
    appBackground: palette.background,
    canvasBackground: shadeColor(palette.background, dark ? -0.06 : -0.04),
    surface: palette.surface,
    surfaceMuted: palette.muted,
    surfaceActive: palette.accent,
    borderSubtle: withAlpha(palette.foreground, 0.1),
    textPrimary: withAlpha(palette.foreground, 0.9),
    textMuted: withAlpha(palette.foreground, 0.85),
    textOnActive: palette.onAccent,
    accentStroke: palette.foreground,
    overlayBackground: withAlpha(
      dark ? palette.background : palette.foreground,
      dark ? 0.75 : 0.72,
    ),
    gridLine: withAlpha(palette.foreground, 0.05),
    imageMetaBackground: withAlpha(palette.foreground, dark ? 0.12 : 0.08),
    imageMetaBackgroundHover: withAlpha(palette.foreground, dark ? 0.28 : 0.16),
  }
}

export function deriveBlendModesFromPalette(
  paletteBlendModes: PrismaticPaletteBlendModes,
): PrismaticThemeBlendModes {
  return {
    appBackground: paletteBlendModes.background,
    canvasBackground: paletteBlendModes.background,
    surface: paletteBlendModes.surface,
    surfaceMuted: paletteBlendModes.muted,
    surfaceActive: paletteBlendModes.accent,
    borderSubtle: paletteBlendModes.foreground,
    textPrimary: "normal",
    textMuted: "normal",
    textOnActive: "normal",
    accentStroke: paletteBlendModes.foreground,
    overlayBackground: paletteBlendModes.background,
    gridLine: "normal",
    imageMetaBackground: paletteBlendModes.surface,
    imageMetaBackgroundHover: paletteBlendModes.surface,
  }
}

export const DEFAULT_PRISMATIC_THEME = deriveThemeFromPalette(
  DEFAULT_PRISMATIC_PALETTE,
)

export const DEFAULT_PRISMATIC_THEME_BLEND_MODES = deriveBlendModesFromPalette(
  DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
)

function isExplicitThemeInput(
  theme: Partial<PrismaticTheme> | PrismaticThemeInput | undefined,
): theme is { colors?: Partial<PrismaticTheme>; blendModes?: Partial<PrismaticThemeBlendModes> } {
  if (!theme) return false
  return "colors" in theme || "blendModes" in theme
}

function isPaletteThemeInput(
  theme: Partial<PrismaticTheme> | PrismaticThemeInput | undefined,
): theme is {
  palette?: Partial<PrismaticPalette>
  paletteBlendModes?: Partial<PrismaticPaletteBlendModes>
} {
  if (!theme) return false
  return "palette" in theme || "paletteBlendModes" in theme
}

export function normalizeThemeInput(
  theme?: Partial<PrismaticTheme> | PrismaticThemeInput,
): {
  palette: PrismaticPalette
  paletteBlendModes: PrismaticPaletteBlendModes
  colors: PrismaticTheme
  blendModes: PrismaticThemeBlendModes
} {
  if (isPaletteThemeInput(theme)) {
    const palette = resolvePrismaticPalette(theme.palette)
    const paletteBlendModes = resolvePrismaticPaletteBlendModes(
      theme.paletteBlendModes,
    )
    return {
      palette,
      paletteBlendModes,
      colors: deriveThemeFromPalette(palette),
      blendModes: deriveBlendModesFromPalette(paletteBlendModes),
    }
  }

  if (isExplicitThemeInput(theme)) {
    const colors = {
      ...DEFAULT_PRISMATIC_THEME,
      ...theme.colors,
    }
    const blendModes = {
      ...DEFAULT_PRISMATIC_THEME_BLEND_MODES,
      ...theme.blendModes,
    }
    return {
      palette: DEFAULT_PRISMATIC_PALETTE,
      paletteBlendModes: DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
      colors,
      blendModes,
    }
  }

  if (theme && Object.keys(theme).length > 0) {
    const colors = {
      ...DEFAULT_PRISMATIC_THEME,
      ...theme,
    }
    return {
      palette: DEFAULT_PRISMATIC_PALETTE,
      paletteBlendModes: DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
      colors,
      blendModes: DEFAULT_PRISMATIC_THEME_BLEND_MODES,
    }
  }

  const palette = DEFAULT_PRISMATIC_PALETTE
  const paletteBlendModes = DEFAULT_PRISMATIC_PALETTE_BLEND_MODES
  return {
    palette,
    paletteBlendModes,
    colors: deriveThemeFromPalette(palette),
    blendModes: deriveBlendModesFromPalette(paletteBlendModes),
  }
}

export function resolvePrismaticTheme(
  theme?: Partial<PrismaticTheme>,
): PrismaticTheme {
  return normalizeThemeInput(theme).colors
}

export function prismaticThemeToCssProperties(
  colors: PrismaticTheme,
  blendModes: PrismaticThemeBlendModes = DEFAULT_PRISMATIC_THEME_BLEND_MODES,
): Record<string, string> {
  const properties: Record<string, string> = {}
  const tokens = Object.keys(PRISMATIC_THEME_CSS_VARS) as PrismaticThemeToken[]

  for (const token of tokens) {
    properties[PRISMATIC_THEME_CSS_VARS[token]] = colors[token]
    properties[themeBlendModeCssVar(token)] = blendModes[token]
  }

  return properties
}

export function formatPrismaticThemeCss(
  colors: PrismaticTheme,
  blendModes: PrismaticThemeBlendModes = DEFAULT_PRISMATIC_THEME_BLEND_MODES,
  palette?: PrismaticPalette,
  paletteBlendModes?: PrismaticPaletteBlendModes,
): string {
  const tokens = Object.keys(PRISMATIC_THEME_CSS_VARS) as PrismaticThemeToken[]
  const rootVars = tokens.flatMap((token) => [
    `  ${PRISMATIC_THEME_CSS_VARS[token]}: ${colors[token]};`,
    `  ${themeBlendModeCssVar(token)}: ${blendModes[token]};`,
  ])

  const paletteComment = palette
    ? [
        "/* palette */",
        `/* background: ${palette.background}; */`,
        `/* surface: ${palette.surface}; */`,
        `/* foreground: ${palette.foreground}; */`,
        `/* accent: ${palette.accent}; */`,
        `/* onAccent: ${palette.onAccent}; */`,
        `/* muted: ${palette.muted}; */`,
        ...(paletteBlendModes
          ? [
              `/* foreground blend: ${paletteBlendModes.foreground}; */`,
            ]
          : []),
        "",
      ]
    : []

  return [
    ...paletteComment,
    ":root {",
    ...rootVars,
    "}",
    "",
    "body {",
    "  background: var(--prismatic-app-bg);",
    "  mix-blend-mode: var(--prismatic-app-bg-blend-mode, normal);",
    "  color: var(--prismatic-text-primary);",
    "}",
  ].join("\n")
}

export type PrismaticColorMode = "default" | "sand"

export const PRISMATIC_COLOR_MODES = ["default", "sand"] as const satisfies readonly PrismaticColorMode[]

export const PRISMATIC_COLOR_MODE_THEMES: Record<
  PrismaticColorMode,
  PrismaticThemeInput
> = {
  default: {},
  sand: {
    palette: {
      background: "#ece6dc",
      surface: "rgb(248, 244, 238)",
      foreground: "#1f1b16",
      accent: "#f8f4ee",
      onAccent: "#1f1b16",
    },
    paletteBlendModes: {
      foreground: "normal",
    },
  },
}

export type PrismaticThemePreset = {
  id: PrismaticColorMode
  label: string
  theme: PrismaticThemeInput
}

/** @deprecated Use `PRISMATIC_COLOR_MODES` and `colorMode` on `PrismaticConfig`. */
export const PRISMATIC_THEME_PRESETS: PrismaticThemePreset[] =
  PRISMATIC_COLOR_MODES.map((id) => ({
    id,
    label: id,
    theme: PRISMATIC_COLOR_MODE_THEMES[id],
  }))

type RuntimeThemeState = {
  palette: PrismaticPalette
  paletteBlendModes: PrismaticPaletteBlendModes
  colors: PrismaticTheme
  blendModes: PrismaticThemeBlendModes
}

let runtimeTheme: RuntimeThemeState = normalizeThemeInput()

export function setRuntimeTheme(
  colors: PrismaticTheme,
  blendModes: PrismaticThemeBlendModes = DEFAULT_PRISMATIC_THEME_BLEND_MODES,
) {
  runtimeTheme = {
    ...runtimeTheme,
    colors,
    blendModes,
  }
}

export function setRuntimePalette(
  palette: PrismaticPalette,
  paletteBlendModes: PrismaticPaletteBlendModes = DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
) {
  runtimeTheme = {
    palette,
    paletteBlendModes,
    colors: deriveThemeFromPalette(palette),
    blendModes: deriveBlendModesFromPalette(paletteBlendModes),
  }
}

export function getRuntimeTheme(): PrismaticTheme {
  return runtimeTheme.colors
}

export function getRuntimeThemeBlendModes(): PrismaticThemeBlendModes {
  return runtimeTheme.blendModes
}

export function getRuntimePalette(): PrismaticPalette {
  return runtimeTheme.palette
}

/** Squircle corner utilities from `@prismatic/core/style.css` — same presets as Slider. */
export const PRISMATIC_CORNERS_CLASS = "prismatic-corners"
export const PRISMATIC_CORNERS_INNER_CLASS = "prismatic-corners-inner"
export const PRISMATIC_CORNERS_INNER_SM_CLASS = "prismatic-corners-inner-sm"
export const PRISMATIC_CORNERS_CANVAS_FRAME_CLASS =
  "prismatic-corners-canvas-frame"

/** Layered surface + border fill. Pair with `prismatic-surface-frame` for blend mode. */
export const PRISMATIC_SURFACE_FRAME_STYLE = {
  backgroundImage:
    "linear-gradient(90deg, var(--prismatic-surface) 0%, var(--prismatic-surface) 100%), linear-gradient(90deg, var(--prismatic-border-subtle) 0%, var(--prismatic-border-subtle) 100%)",
} as const
