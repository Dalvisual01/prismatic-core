import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react"
import { usePrismaticInteraction } from "../../hooks/usePrismaticStore"
import { SLIDER_OUTER_HEIGHT } from "./Slider"

export type ButtonSize = "small" | "medium" | "large"

export const BUTTON_TEXT_SM =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[13px] leading-[1.1] tracking-[-0.26px] lowercase"

export const BUTTON_TEXT_MD =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[15px] leading-[1.1] tracking-[-0.3px] lowercase"

export const BUTTON_TEXT_LG =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase"

export const BUTTON_ELLIPSE_WIDTH = 274
export const BUTTON_ELLIPSE_HEIGHT = 120

/** Medium uses slider height and large-type minimum width. */
export const BUTTON_HEIGHT_MEDIUM = SLIDER_OUTER_HEIGHT
export const BUTTON_WIDTH_MIN = BUTTON_ELLIPSE_WIDTH

type ButtonSizeMetrics = {
  height: number
  textClass: string
  paddingX: number
  width?: number
  minWidth?: number
}

const SIZE_METRICS: Record<ButtonSize, ButtonSizeMetrics> = {
  small: {
    height: SLIDER_OUTER_HEIGHT,
    textClass: BUTTON_TEXT_SM,
    paddingX: 28,
  },
  medium: {
    height: SLIDER_OUTER_HEIGHT,
    textClass: BUTTON_TEXT_LG,
    paddingX: 40,
    minWidth: BUTTON_ELLIPSE_WIDTH,
  },
  large: {
    width: BUTTON_ELLIPSE_WIDTH,
    height: BUTTON_ELLIPSE_HEIGHT,
    textClass: BUTTON_TEXT_LG,
    paddingX: 0,
  },
}

export function getButtonMetrics(size: ButtonSize = "large") {
  return SIZE_METRICS[size]
}

function hugWidthStyle(metrics: ButtonSizeMetrics): CSSProperties {
  return {
    height: metrics.height,
    paddingLeft: metrics.paddingX,
    paddingRight: metrics.paddingX,
    minWidth: metrics.minWidth ?? Math.round(metrics.height * 1.5),
  }
}

export type ButtonEllipseVisualProps = {
  active: boolean
  children: ReactNode
  size?: ButtonSize
  width?: number
  height?: number
  textClassName?: string
  className?: string
}

export function ButtonEllipseVisual({
  active,
  children,
  size,
  width,
  height,
  textClassName,
  className = "",
}: ButtonEllipseVisualProps) {
  const metrics = size ? getButtonMetrics(size) : null
  const hugWidth = metrics != null && metrics.width == null && width == null
  const resolvedWidth = width ?? metrics?.width
  const resolvedHeight = height ?? metrics?.height ?? BUTTON_ELLIPSE_HEIGHT
  const resolvedTextClass =
    textClassName ?? metrics?.textClass ?? BUTTON_TEXT_LG

  const containerStyle: CSSProperties = hugWidth
    ? hugWidthStyle(metrics!)
    : {
        width: resolvedWidth ?? BUTTON_ELLIPSE_WIDTH,
        height: resolvedHeight,
      }

  return (
    <div
      className={[
        "relative isolate inline-flex items-center justify-center",
        hugWidth ? "w-fit" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={containerStyle}
    >
      <svg
        viewBox={`0 0 ${BUTTON_ELLIPSE_WIDTH} ${BUTTON_ELLIPSE_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <ellipse
          cx="137"
          cy="60"
          rx="136"
          ry="59"
          fill={active ? "var(--prismatic-surface-active)" : "transparent"}
          stroke={active ? "transparent" : "var(--prismatic-accent-stroke)"}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className={`relative z-[2] whitespace-nowrap mix-blend-normal ${active ? "prismatic-text-on-active" : "prismatic-text-muted"} ${resolvedTextClass}`}
      >
        {children}
      </span>
    </div>
  )
}

export type ButtonProps = {
  children: ReactNode
  size?: ButtonSize
  width?: number
  height?: number
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  size = "large",
  width,
  height,
  className = "",
  type = "button",
  disabled,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: ButtonProps) {
  const interactionEnabled = usePrismaticInteraction()
  const metrics = getButtonMetrics(size)
  const hugWidth = metrics.width == null && width == null
  const resolvedWidth = width ?? metrics.width
  const resolvedHeight = height ?? metrics.height
  const [isActive, setIsActive] = useState(false)
  const active = interactionEnabled && !disabled && isActive

  useEffect(() => {
    if (!interactionEnabled) setIsActive(false)
  }, [interactionEnabled])

  const buttonStyle: CSSProperties = hugWidth
    ? { height: resolvedHeight }
    : { width: resolvedWidth, height: resolvedHeight }

  return (
    <button
      type={type}
      disabled={disabled}
      data-prismatic-interactive=""
      className={[
        "relative flex cursor-pointer select-none items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none",
        hugWidth ? "w-fit" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (interactionEnabled && !disabled) setIsActive(true)
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setIsActive(false)
        onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        if (interactionEnabled && !disabled) setIsActive(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsActive(false)
        onBlur?.(e)
      }}
      {...rest}
    >
      <ButtonEllipseVisual
        active={active}
        size={width === undefined && height === undefined ? size : undefined}
        width={resolvedWidth}
        height={resolvedHeight}
      >
        {children}
      </ButtonEllipseVisual>
    </button>
  )
}
