import { useEffect, useState } from "react"
import { usePrismaticStore } from "../../hooks/usePrismaticStore"
import {
  CANVAS_RESOLUTION_SCALES,
  type CanvasResolutionScale,
} from "../../canvas/resolution"
import { PRISMATIC_SURFACE_FRAME_STYLE } from "../../theme/tokens"

const SCALE_LABEL: Record<CanvasResolutionScale, string> = {
  1: "1.0×",
  0.5: "0.5×",
  0.25: "0.25×",
}

export type CanvasResolutionControlProps = {
  label?: string
  className?: string
}

export function CanvasResolutionControl({
  label = "canvas resolution",
  className = "",
}: CanvasResolutionControlProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)
  const scale = useStore((s) => s.canvasResolutionScale)
  const setScale = useStore((s) => s.setCanvasResolutionScale)
  const activeIndex = Math.max(0, CANVAS_RESOLUTION_SCALES.indexOf(scale))
  const [hoveredScale, setHoveredScale] = useState<CanvasResolutionScale | null>(
    null,
  )

  useEffect(() => {
    if (!workspaceMode) return
    setHoveredScale(null)
  }, [workspaceMode])

  return (
    <div
      className={[
        "group/resolution prismatic-surface-frame relative isolate flex h-[70px] w-[70px] flex-col items-center gap-1 overflow-visible rounded-[32px] p-1 [corner-shape:squircle]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={PRISMATIC_SURFACE_FRAME_STYLE}
      data-prismatic-control="canvas-resolution"
      data-workspace-mode={workspaceMode ? "" : undefined}
    >
      <div
        className="prismatic-resolution-tooltip pointer-events-none absolute left-1/2 top-[-54px] z-50 w-max max-w-[230px] -translate-x-1/2 rounded-lg bg-[#242326] px-3 py-2 shadow-lg"
        role="tooltip"
      >
        <p className="font-['PP_Neue_Montreal',system-ui,sans-serif] text-[13px] leading-[1.1] tracking-[-0.26px] text-white">
          export uses full resolution
        </p>
        <div className="absolute left-1/2 bottom-[-7px] h-0 w-0 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#242326]" />
      </div>

      <div
        className="pointer-events-none absolute left-1 top-[6px] z-0 h-[18px] w-[62px] transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(0, ${activeIndex * 20}px, 0)` }}
        aria-hidden
      >
        <svg
          key={activeIndex}
          viewBox="0 0 62 18"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="prismatic-resolution-ellipse size-full overflow-visible"
        >
          <ellipse
            cx="31"
            cy="8.5"
            rx="30.5"
            ry="8.5"
            fill="none"
            stroke="var(--prismatic-surface-active)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute left-1 top-[6px] flex flex-col items-center gap-[2px] overflow-hidden rounded-[17px]"
        style={{ mixBlendMode: "difference" }}
        aria-hidden
      >
        {CANVAS_RESOLUTION_SCALES.map((candidate) => (
          <div
            key={candidate}
            className={[
              "flex h-[18px] w-[62px] items-center justify-center font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] lowercase transition-opacity duration-150",
              hoveredScale === candidate && candidate !== scale
                ? "opacity-70"
                : "opacity-100",
            ].join(" ")}
          >
            <span className="block text-[rgba(255,255,255,0.9)]">
              {SCALE_LABEL[candidate]}
            </span>
          </div>
        ))}
      </div>

      <div
        className="relative z-20 mt-[2px] flex flex-col items-center gap-[2px] overflow-hidden rounded-[17px]"
        role="radiogroup"
        aria-label={label}
      >
        {CANVAS_RESOLUTION_SCALES.map((candidate) => {
          return (
            <button
              key={candidate}
              type="button"
              role="radio"
              aria-label={SCALE_LABEL[candidate]}
              aria-checked={candidate === scale}
              tabIndex={workspaceMode ? -1 : 0}
              className={[
                "h-[18px] w-[62px] rounded-[17px] bg-transparent outline-none",
                workspaceMode
                  ? "pointer-events-none cursor-grab"
                  : "cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30",
              ].join(" ")}
              onPointerEnter={() => {
                if (workspaceMode || candidate === scale) return
                setHoveredScale(candidate)
              }}
              onPointerLeave={() => setHoveredScale(null)}
              onPointerDown={(e) => {
                if (workspaceMode) return
                e.stopPropagation()
              }}
              onFocus={() => {
                if (workspaceMode || candidate === scale) return
                setHoveredScale(candidate)
              }}
              onBlur={() => setHoveredScale(null)}
              onClick={() => {
                if (workspaceMode) return
                setScale(candidate)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
