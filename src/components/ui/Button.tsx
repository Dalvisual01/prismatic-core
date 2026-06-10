import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ButtonVariant = "save" | "frame"

export type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  /** Background image URL for the save variant. */
  saveButtonBg?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  variant = "save",
  saveButtonBg = 'url("/assets/save-button-bg.svg")',
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const size =
    variant === "save"
      ? "h-[113px] w-[216px] rounded-[var(--radius)]"
      : "h-[120px] w-[194px] rounded-[var(--radius)]"

  return (
    <button
      type={type}
      className={`group relative flex cursor-pointer select-none items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none ${size} ${className}`}
      {...rest}
    >
      <span className="absolute inset-0 flex items-center justify-center mix-blend-difference transform-gpu transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform group-hover:scale-[1.02] group-active:scale-[0.98] group-disabled:scale-100">
        {variant === "save" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: saveButtonBg }}
          />
        )}
        <span className="relative z-[1] text-center font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] text-black lowercase">
          {children}
        </span>
      </span>
    </button>
  )
}
