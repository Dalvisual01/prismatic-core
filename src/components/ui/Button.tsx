import { useState, type ButtonHTMLAttributes, type ReactNode } from "react"

export const BUTTON_TEXT_LG =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase"

export const BUTTON_ELLIPSE_WIDTH = 274
export const BUTTON_ELLIPSE_HEIGHT = 120

export type ButtonEllipseVisualProps = {
  active: boolean
  children: ReactNode
  width?: number
  height?: number
  className?: string
}

export function ButtonEllipseVisual({
  active,
  children,
  width = BUTTON_ELLIPSE_WIDTH,
  height = BUTTON_ELLIPSE_HEIGHT,
  className = "",
}: ButtonEllipseVisualProps) {
  return (
    <div
      className={`relative isolate flex items-center justify-center ${className}`}
      style={{ width, height }}
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
        className={`relative z-[2] mix-blend-normal ${active ? "prismatic-text-on-active" : "prismatic-text-muted"} ${BUTTON_TEXT_LG}`}
      >
        {children}
      </span>
    </div>
  )
}

export type ButtonProps = {
  children: ReactNode
  width?: number
  height?: number
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  width = BUTTON_ELLIPSE_WIDTH,
  height = BUTTON_ELLIPSE_HEIGHT,
  className = "",
  type = "button",
  disabled,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: ButtonProps) {
  const [isActive, setIsActive] = useState(false)
  const active = !disabled && isActive

  return (
    <button
      type={type}
      disabled={disabled}
      className={`relative flex cursor-pointer select-none items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none ${className}`}
      style={{ width, height }}
      onMouseEnter={(e) => {
        if (!disabled) setIsActive(true)
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setIsActive(false)
        onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        if (!disabled) setIsActive(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsActive(false)
        onBlur?.(e)
      }}
      {...rest}
    >
      <ButtonEllipseVisual active={active} width={width} height={height}>
        {children}
      </ButtonEllipseVisual>
    </button>
  )
}
