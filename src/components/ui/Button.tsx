import { useState, type ButtonHTMLAttributes, type ReactNode } from "react"

export const BUTTON_TEXT_LG =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase"

/** Playground / generic CTA — outline at rest, filled on hover. */
export const BUTTON_ELLIPSE_WIDTH = 274
export const BUTTON_ELLIPSE_HEIGHT = 120

/** Secondary actions — stroke-only ellipse, difference-blend label. */
export const BUTTON_FRAME_WIDTH = 194
export const BUTTON_FRAME_HEIGHT = 120

/** Primary export/save — always-filled ellipse, difference-blend label. */
export const BUTTON_SAVE_WIDTH = 216
export const BUTTON_SAVE_HEIGHT = 113

export type ButtonVariant = "cta" | "frame" | "save"

const DEFAULT_SIZE: Record<ButtonVariant, { width: number; height: number }> = {
  cta: { width: BUTTON_ELLIPSE_WIDTH, height: BUTTON_ELLIPSE_HEIGHT },
  frame: { width: BUTTON_FRAME_WIDTH, height: BUTTON_FRAME_HEIGHT },
  save: { width: BUTTON_SAVE_WIDTH, height: BUTTON_SAVE_HEIGHT },
}

const SCALE_LAYER =
  "transform-gpu transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform group-hover:scale-[1.02] group-active:scale-[0.98] group-disabled:scale-100"

export type ButtonEllipseVisualProps = {
  variant?: ButtonVariant
  active: boolean
  children: ReactNode
  width?: number
  height?: number
  className?: string
  /** Background image for `save` variant (CSS `url(...)`). */
  saveButtonBg?: string
}

export function ButtonEllipseVisual({
  variant = "cta",
  active,
  children,
  width = BUTTON_ELLIPSE_WIDTH,
  height = BUTTON_ELLIPSE_HEIGHT,
  className = "",
  saveButtonBg,
}: ButtonEllipseVisualProps) {
  const useDifferenceBlend = variant === "frame" || variant === "save"
  const showSvg = variant !== "save" || !saveButtonBg

  const fill =
    variant === "frame"
      ? "transparent"
      : variant === "save"
        ? "var(--prismatic-accent-stroke)"
        : active
          ? "var(--prismatic-surface-active)"
          : "transparent"

  const stroke =
    variant === "save" || (variant === "cta" && active)
      ? "transparent"
      : "var(--prismatic-accent-stroke)"

  const textClass = useDifferenceBlend
    ? `text-black ${BUTTON_TEXT_LG}`
    : `${active ? "prismatic-text-on-active" : "prismatic-text-muted"} ${BUTTON_TEXT_LG}`

  return (
    <div
      className={`relative isolate flex items-center justify-center ${variant !== "cta" ? SCALE_LAYER : ""} ${className}`}
      style={{ width, height }}
    >
      {variant === "save" && saveButtonBg && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: saveButtonBg }}
        />
      )}
      {showSvg && (
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
            fill={fill}
            stroke={stroke}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      <span
        className={`relative z-[2] text-center ${useDifferenceBlend ? "mix-blend-difference" : "mix-blend-normal"} ${textClass}`}
      >
        {children}
      </span>
    </div>
  )
}

export type ButtonProps = {
  children: ReactNode
  /** `cta` — theme outline/fill on hover. `frame` — stroke-only secondary. `save` — filled export CTA. */
  variant?: ButtonVariant
  /** CSS background image for `save` variant, e.g. `url("/assets/save-button-bg.svg")`. */
  saveButtonBg?: string
  width?: number
  height?: number
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  variant = "cta",
  saveButtonBg = 'url("/assets/save-button-bg.svg")',
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
  const [isActive, setIsActive] = useState(false)
  const active = !disabled && isActive
  const defaults = DEFAULT_SIZE[variant]
  const resolvedWidth = width ?? defaults.width
  const resolvedHeight = height ?? defaults.height

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${variant !== "cta" ? "group" : ""} relative flex cursor-pointer select-none items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none ${className}`}
      style={{ width: resolvedWidth, height: resolvedHeight }}
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
      <ButtonEllipseVisual
        variant={variant}
        active={active}
        width={resolvedWidth}
        height={resolvedHeight}
        saveButtonBg={variant === "save" ? saveButtonBg : undefined}
      >
        {children}
      </ButtonEllipseVisual>
    </button>
  )
}
