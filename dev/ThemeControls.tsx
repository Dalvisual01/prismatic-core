import {
  PRISMATIC_COLOR_MODES,
  type PrismaticColorMode,
} from "../src/theme/tokens"

type ThemeControlsProps = {
  colorMode: PrismaticColorMode
  onChange: (colorMode: PrismaticColorMode) => void
}

export function ThemeControls({ colorMode, onChange }: ThemeControlsProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] leading-snug text-white/45">
        Pick a built-in colour mode. Set the same value on{" "}
        <code className="text-white/60">colorMode</code> in your project config.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PRISMATIC_COLOR_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={colorMode === mode}
            className={`rounded-full border px-2.5 py-1 text-[10px] lowercase transition-colors ${
              colorMode === mode
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 text-white/75 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => onChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}
