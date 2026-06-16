import { usePrismaticStore } from "../hooks/usePrismaticStore"
import { useLayoutPersistence } from "./useLayoutPersistence"

export function LayoutModeChrome() {
  const useStore = usePrismaticStore()
  const { status, error, saveLayout } = useLayoutPersistence(useStore)
  const isSaving = status === "saving"

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-white/15 bg-[var(--prismatic-overlay-bg)] px-4 py-2 text-[11px] lowercase tracking-wide text-white/85 shadow-lg backdrop-blur-md">
        <span className="text-white">layout mode</span>
        <span className="text-white/35">·</span>
        <span className="text-white/55">press w to toggle workspace</span>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void saveLayout()}
          className="pointer-events-auto rounded-full bg-white/15 px-3 py-1 text-white transition-colors hover:bg-white/25 disabled:opacity-50"
        >
          {isSaving ? "saving…" : "save layout"}
        </button>
        {status === "saved" ? (
          <span className="text-white/65">saved</span>
        ) : null}
        {status === "error" ? (
          <span className="text-[var(--prismatic-accent)]">{error ?? "save failed"}</span>
        ) : null}
      </div>
    </div>
  )
}
