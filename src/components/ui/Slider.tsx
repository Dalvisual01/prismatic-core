import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { PRISMATIC_SURFACE_FRAME_STYLE } from "../../theme/tokens"

export type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  displayValue?: (value: number) => string
  onChange: (value: number) => void
  /** URL for the top drag handle graphic (optional). */
  lineTopSrc?: string
  /** URL for the bottom drag handle graphic (optional). */
  lineBottomSrc?: string
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

function snapToStep(value: number, min: number, step: number) {
  const steps = Math.round((value - min) / step)
  return min + steps * step
}

/** Figma compact row height; two rows + gap-1 = 60px content; outer frame 70px with p-1 (62px area). */
const ROW_H = 28
const INNER_STACK_H = ROW_H + 4 + ROW_H
const OUTER_H = 70
const OUTER_PAD_Y = 8
const DEFAULT_ROW_H = OUTER_H - OUTER_PAD_Y

/** Inner pill corner radius = --radius − 4px (matches `rounded-[var(--radius-inner)]` on the pill).
 *  Below 2× that, the two rounded ends overlap and the pill looks pinched, so we floor min-width there. */
const INNER_PAD = 4
const FALLBACK_RADIUS = 32

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  displayValue,
  onChange,
  lineTopSrc,
  lineBottomSrc,
}: SliderProps) {
  /** Measures the visual fill region width (left side). */
  const trackAreaRef = useRef<HTMLDivElement>(null)
  /** Full slider hit area (whole component). */
  const hitAreaRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [trackWidthPx, setTrackWidthPx] = useState(0)
  const [innerCornerPx, setInnerCornerPx] = useState(
    FALLBACK_RADIUS - INNER_PAD,
  )
  const [editingValue, setEditingValue] = useState(false)
  const [draftValue, setDraftValue] = useState("")
  const valueInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = trackAreaRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      setTrackWidthPx(el.getBoundingClientRect().width)
    })
    ro.observe(el)
    setTrackWidthPx(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(
      "--radius",
    )
    const parsed = parseFloat(raw)
    if (Number.isFinite(parsed)) setInnerCornerPx(parsed - INNER_PAD)
  }, [])

  const normalized =
    max === min ? 0 : clamp((value - min) / (max - min), 0, 1)

  const shown =
    displayValue?.(value) ??
    (Number.isInteger(step) && step >= 1
      ? String(Math.round(value))
      : value.toFixed(4).replace(/\.?0+$/, ""))

  const isBoolean = min === 0 && max === 1 && step === 1
  const isToggle = isBoolean
  const minLabel = isBoolean ? "false" : String(min)
  const maxLabel = isBoolean ? "true" : String(max)

  useEffect(() => {
    if (!editingValue) return
    valueInputRef.current?.focus()
    valueInputRef.current?.select()
  }, [editingValue])

  const commitDraftValue = useCallback(() => {
    if (isToggle) return
    const raw = Number(draftValue.trim())
    if (!Number.isFinite(raw)) {
      setEditingValue(false)
      setDraftValue("")
      return
    }
    const snapped = snapToStep(raw, min, step)
    const clamped = clamp(snapped, min, max)
    onChange(clamped)
    setEditingValue(false)
    setDraftValue("")
  }, [draftValue, isToggle, max, min, onChange, step])

  const cancelDraftValue = useCallback(() => {
    setEditingValue(false)
    setDraftValue("")
  }, [])

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = hitAreaRef.current ?? trackAreaRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0) return
      const t = clamp((clientX - rect.left) / rect.width, 0, 1)
      const raw = min + t * (max - min)
      const next = snapToStep(raw, min, step)
      const clamped = clamp(next, min, max)
      if (clamped !== value) onChange(clamped)
    },
    [max, min, onChange, step, value],
  )

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isToggle) {
      onChange(value >= 0.5 ? 0 : 1)
      return
    }
    draggingRef.current = true
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isToggle) return
    if (!draggingRef.current) return
    setFromClientX(e.clientX)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isToggle) return
    draggingRef.current = false
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const fillPct = useMemo(() => normalized * 100, [normalized])

  const showRange = hovered || dragging
  const showHandle = hovered || dragging

  /** Visual pill width: matches value; never narrower than 2× the inner corner radius (else the rounded ends overlap). */
  const pillWidthStyle = useMemo(() => {
    const minPx = innerCornerPx * 2
    if (fillPct <= 0) return { width: "0%" as const, minWidth: undefined as string | undefined }
    if (fillPct >= 100) return { width: "100%" as const, minWidth: undefined as string | undefined }
    if (trackWidthPx <= 0) return { width: `${fillPct}%`, minWidth: undefined as string | undefined }
    const minPct = (minPx / trackWidthPx) * 100
    const visualPct = Math.max(fillPct, minPct)
    return {
      width: `${visualPct}%`,
      minWidth: visualPct === minPct && fillPct < minPct ? `${minPx}px` : undefined,
    }
  }, [fillPct, trackWidthPx, innerCornerPx])

  const stackHeight = showRange ? INNER_STACK_H : DEFAULT_ROW_H
  const topRowHeight = showRange ? ROW_H : DEFAULT_ROW_H
  const topRowHeightStyle = { height: topRowHeight, minHeight: topRowHeight }
  const bottomRowHeightStyle = { height: ROW_H, minHeight: ROW_H }

  return (
    <div
      className="prismatic-surface-frame relative box-border flex w-full flex-col justify-center overflow-hidden rounded-[var(--radius)] p-1"
      style={{
        ...PRISMATIC_SURFACE_FRAME_STYLE,
        height: OUTER_H,
        minHeight: OUTER_H,
        maxHeight: OUTER_H,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Full-size interaction layer so you can drag from anywhere on the slider. */}
      <div
        ref={hitAreaRef}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        tabIndex={0}
        className={`absolute inset-0 z-10 touch-none select-none rounded-[var(--radius)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--prismatic-border-subtle)] ${
          isToggle ? "cursor-pointer" : "cursor-ew-resize"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (isToggle) {
            if (e.key !== " " && e.key !== "Enter") return
            e.preventDefault()
            onChange(value >= 0.5 ? 0 : 1)
            return
          }
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
          e.preventDefault()
          const dir = e.key === "ArrowRight" ? 1 : -1
          const delta = step * dir * (e.shiftKey ? 10 : 1)
          const next = clamp(snapToStep(value + delta, min, step), min, max)
          if (next !== value) onChange(next)
        }}
      />

      <div
        className="relative z-0 flex shrink-0 flex-col gap-1 transition-[height] duration-300 ease-out"
        style={{ height: stackHeight, minHeight: stackHeight, maxHeight: stackHeight }}
      >
        {/* Row 1 — always visible */}
        <div
          className="flex shrink-0 items-center pr-[18px] transition-[height] duration-300 ease-out"
          style={topRowHeightStyle}
        >
          <div
            ref={trackAreaRef}
            className="relative flex min-h-0 flex-1 items-stretch"
            style={topRowHeightStyle}
          >
            {/* Fill pill (visual width) */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 rounded-[var(--radius-inner)] ${
                showRange ? "bg-transparent" : "prismatic-bg-surface-muted"
              }`}
              style={{
                width: pillWidthStyle.width,
                minWidth: pillWidthStyle.minWidth,
              }}
              aria-hidden
            >
              <div
                className={`absolute inset-y-0 right-0 z-[2] w-0 transition-opacity duration-300 ease-out ${
                  showHandle ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden
              >
                {lineTopSrc && (
                  <div className="absolute right-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 translate-x-1/2 rotate-90">
                    <img
                      src={lineTopSrc}
                      alt=""
                      className="block h-full w-full max-w-none"
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Foreground label (full width, never clipped by fill) */}
            <div className="relative z-[1] flex w-full min-w-0 items-center pl-[18px] pr-3">
              <p className="min-w-0 truncate font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] prismatic-text-primary lowercase">
                {label}
              </p>
            </div>
          </div>

          <div
            className="relative z-20 flex shrink-0 items-center pl-2"
            style={topRowHeightStyle}
          >
            {editingValue && !isToggle ? (
              <input
                ref={valueInputRef}
                value={draftValue}
                inputMode="decimal"
                className="w-[120px] bg-transparent text-right font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] prismatic-text-primary tabular-nums outline-none"
                onChange={(e) => setDraftValue(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitDraftValue}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitDraftValue()
                  }
                  if (e.key === "Escape") {
                    e.preventDefault()
                    cancelDraftValue()
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="cursor-text text-right font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] prismatic-text-primary tabular-nums"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  if (isToggle) return
                  setDraftValue(String(value))
                  setEditingValue(true)
                }}
              >
                {shown}
              </button>
            )}
          </div>
        </div>

        {/* Row 2 — rendered only while active so the default state stays one tall pill. */}
        <div
          className="flex shrink-0 items-center overflow-hidden pr-[18px] transition-[max-height,opacity] duration-300 ease-out"
          style={{
            ...bottomRowHeightStyle,
            maxHeight: showRange ? ROW_H : 0,
            opacity: showRange ? 1 : 0,
          }}
          aria-hidden={!showRange}
        >
          <div className="flex min-h-0 flex-1 items-stretch" style={bottomRowHeightStyle}>
            <div className="relative flex min-h-0 flex-1 items-stretch" style={bottomRowHeightStyle}>
              {/* Fill pill (visual width) */}
              <div
                className="prismatic-bg-surface-muted pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-[var(--radius-inner-sm)] backdrop-blur-[14.649px] [corner-shape:round]"
                style={{
                  width: pillWidthStyle.width,
                  minWidth: pillWidthStyle.minWidth,
                }}
                aria-hidden
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="flex h-[18.015px] w-0 items-center justify-center">
                    <div className="flex-none rotate-90">
                      <div className="relative h-0 w-[18.015px]">
                        {lineBottomSrc && (
                          <div className="absolute inset-[-1.72px_0_0_0]">
                            <img
                              src={lineBottomSrc}
                              alt=""
                              className="block size-full max-w-none"
                              draggable={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground min label (full width, never clipped by fill) */}
              <div className="relative z-[1] flex w-full min-w-0 items-center pl-[18px] pr-3">
                <p className="font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] prismatic-text-primary tabular-nums lowercase">
                  {minLabel}
                </p>
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none flex shrink-0 items-center justify-end pl-2"
            style={bottomRowHeightStyle}
          >
            <p className="font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] prismatic-text-primary tabular-nums lowercase">
              {maxLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
