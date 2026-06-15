import { useMemo, useState } from "react"
import {
  PRISMATIC_BLEND_MODES,
  PRISMATIC_PALETTE_TOKEN_KEYS,
  PRISMATIC_PALETTE_TOKEN_LABELS,
  PRISMATIC_THEME_PRESETS,
  colorToRgbaString,
  formatPrismaticThemeCss,
  normalizeThemeInput,
  parseColor,
  resolvePrismaticPalette,
  resolvePrismaticPaletteBlendModes,
  type PrismaticBlendMode,
  type PrismaticPaletteToken,
  type PrismaticThemeInput,
} from "../src/theme/tokens"

type ThemeControlsProps = {
  theme: PrismaticThemeInput
  onChange: (theme: PrismaticThemeInput) => void
}

function toColorInputValue(value: string) {
  const { r, g, b } = parseColor(value)
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`
}

function PaletteRow({
  token,
  color,
  blendMode,
  onColorChange,
  onBlendModeChange,
}: {
  token: PrismaticPaletteToken
  color: string
  blendMode: PrismaticBlendMode
  onColorChange: (value: string) => void
  onBlendModeChange: (value: PrismaticBlendMode) => void
}) {
  return (
    <li className="rounded-lg border border-white/8 bg-white/3 p-2">
      <div className="mb-1.5 text-[10px] lowercase text-white/70">
        {PRISMATIC_PALETTE_TOKEN_LABELS[token]}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toColorInputValue(color)}
          className="h-7 w-9 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent p-0"
          onChange={(e) => onColorChange(e.target.value)}
        />
        <input
          type="text"
          value={color}
          spellCheck={false}
          className="min-w-0 flex-1 rounded border border-white/10 bg-black/20 px-2 py-1 font-mono text-[9px] text-white/85 outline-none focus:border-white/25"
          onChange={(e) => onColorChange(e.target.value)}
        />
        <select
          value={blendMode}
          className="max-w-[88px] rounded border border-white/10 bg-black/20 px-1.5 py-1 text-[9px] lowercase text-white/80 outline-none"
          onChange={(e) => onBlendModeChange(e.target.value as PrismaticBlendMode)}
        >
          {PRISMATIC_BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
    </li>
  )
}

export function ThemeControls({ theme, onChange }: ThemeControlsProps) {
  const [copied, setCopied] = useState(false)
  const resolved = useMemo(() => normalizeThemeInput(theme), [theme])
  const css = useMemo(
    () =>
      formatPrismaticThemeCss(
        resolved.colors,
        resolved.blendModes,
        resolved.palette,
        resolved.paletteBlendModes,
      ),
    [resolved],
  )

  const setPaletteColor = (token: PrismaticPaletteToken, value: string) => {
    const palette = resolvePrismaticPalette(theme.palette)
    onChange({
      palette: { ...palette, [token]: value },
      paletteBlendModes: resolvePrismaticPaletteBlendModes(theme.paletteBlendModes),
    })
  }

  const setPaletteBlendMode = (
    token: PrismaticPaletteToken,
    value: PrismaticBlendMode,
  ) => {
    const paletteBlendModes = resolvePrismaticPaletteBlendModes(
      theme.paletteBlendModes,
    )
    onChange({
      palette: resolvePrismaticPalette(theme.palette),
      paletteBlendModes: { ...paletteBlendModes, [token]: value },
    })
  }

  const copyCss = async () => {
    await navigator.clipboard.writeText(css)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] leading-snug text-white/45">
        Six palette colours drive every UI token. Muted controls slider pill fills.
        Blend modes apply to fills and strokes only — never text.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PRISMATIC_THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] lowercase text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => onChange(preset.theme)}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] lowercase text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          onClick={() => onChange({})}
        >
          reset
        </button>
      </div>

      <ul className="space-y-2">
        {PRISMATIC_PALETTE_TOKEN_KEYS.map((token) => (
          <PaletteRow
            key={token}
            token={token}
            color={resolved.palette[token]}
            blendMode={resolved.paletteBlendModes[token]}
            onColorChange={(value) => {
              const parsed = parseColor(value)
              const current = parseColor(resolved.palette[token])
              const next =
                value.startsWith("#") || value.startsWith("rgb")
                  ? value
                  : colorToRgbaString({ ...parsed, a: current.a })
              setPaletteColor(token, next)
            }}
            onBlendModeChange={(value) => setPaletteBlendMode(token, value)}
          />
        ))}
      </ul>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <button
          type="button"
          className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[10px] lowercase text-white transition-colors hover:bg-white/12"
          onClick={() => void copyCss()}
        >
          {copied ? "copied css" : "copy theme css"}
        </button>
        <textarea
          readOnly
          value={css}
          spellCheck={false}
          className="h-40 w-full resize-y rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[9px] leading-relaxed text-white/70 outline-none"
        />
      </div>
    </div>
  )
}
