import { useEffect, useRef, useState } from "react"
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

const TOOLTIP_DELAY_MS = 1500

export type CanvasResolutionControlProps = {
  label?: string
  className?: string
}

export function CanvasResolutionControl({
  label = "canvas resolution",
  className = "",
}: CanvasResolutionControlProps) {
  const useStore = usePrismaticStore()
  const scale = useStore((s) => s.canvasResolutionScale)
  const setScale = useStore((s) => s.setCanvasResolutionScale)
  const activeIndex = Math.max(0, CANVAS_RESOLUTION_SCALES.indexOf(scale))
  const [hoveredScale, setHoveredScale] = useState<CanvasResolutionScale | null>(
    null,
  )
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTooltipTimer = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = null
    }
  }

  const scheduleTooltip = () => {
    clearTooltipTimer()
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipOpen(true)
      tooltipTimerRef.current = null
    }, TOOLTIP_DELAY_MS)
  }

  const hideTooltip = () => {
    clearTooltipTimer()
    setTooltipOpen(false)
  }

  useEffect(() => () => clearTooltipTimer(), [])

  return (
    <div
      className={[
        "workspace-controls group/resolution prismatic-surface-frame relative isolate flex h-[70px] w-[70px] flex-col items-center gap-1 overflow-visible rounded-[32px] p-1 [corner-shape:squircle]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={PRISMATIC_SURFACE_FRAME_STYLE}
      data-prismatic-control="canvas-resolution"
      onPointerEnter={scheduleTooltip}
      onPointerLeave={hideTooltip}
      onFocus={scheduleTooltip}
      onBlur={hideTooltip}
    >
      <div
        className={[
          "absolute left-1/2 top-[-54px] z-50 w-max max-w-[230px] -translate-x-1/2 rounded-lg bg-[#242326] px-3 py-2 shadow-lg transition-[opacity,transform] duration-150",
          tooltipOpen
            ? "translate-y-[-2px] opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
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
              className="h-[18px] w-[62px] cursor-pointer rounded-[17px] bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-white/30"
              onPointerEnter={() => {
                if (candidate !== scale) setHoveredScale(candidate)
              }}
              onPointerLeave={() => setHoveredScale(null)}
              onPointerDown={(e) => e.stopPropagation()}
              onFocus={() => {
                if (candidate !== scale) setHoveredScale(candidate)
              }}
              onBlur={() => setHoveredScale(null)}
              onClick={() => setScale(candidate)}
            />
          )
        })}
      </div>
    </div>
  )
}
