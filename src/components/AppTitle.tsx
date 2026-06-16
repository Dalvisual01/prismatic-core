import type { CSSProperties, ImgHTMLAttributes, ReactNode } from "react"

export type AppTitleSize = "small" | "large"

export const APP_TITLE_TEXT_SM =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[13px] leading-[1.1] tracking-[-0.26px] lowercase"

export const APP_TITLE_TEXT_LG =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase"

const SIZE_METRICS: Record<
  AppTitleSize,
  {
    textClass: string
    lineHeight: number
    gapClass: string
  }
> = {
  small: {
    textClass: APP_TITLE_TEXT_SM,
    lineHeight: 14,
    gapClass: "gap-1.5",
  },
  large: {
    textClass: APP_TITLE_TEXT_LG,
    lineHeight: 20,
    gapClass: "gap-2",
  },
}

export type AppTitleProps = {
  title: ReactNode
  subtitle?: ReactNode
  size?: AppTitleSize
  logo?: ReactNode
  logoSrc?: string
  logoAlt?: string
  className?: string
  textClassName?: string
  subtitleClassName?: string
  textBlockClassName?: string
  logoClassName?: string
  style?: CSSProperties
  logoImgProps?: Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "alt" | "height"
  >
}

export function AppTitle({
  title,
  subtitle,
  size = "small",
  logo,
  logoSrc,
  logoAlt = "",
  className = "",
  textClassName = "",
  subtitleClassName = "",
  textBlockClassName = "",
  logoClassName = "",
  style,
  logoImgProps,
}: AppTitleProps) {
  const metrics = SIZE_METRICS[size]
  const logoHeight = metrics.lineHeight * (subtitle ? 2 : 1)
  const resolvedLogo =
    logo ??
    (logoSrc ? (
      <img
        src={logoSrc}
        alt={logoAlt}
        height={logoHeight}
        {...logoImgProps}
        className={[logoImgProps?.className, "block h-full w-auto"]
          .filter(Boolean)
          .join(" ")}
      />
    ) : null)

  return (
    <div
      className={[
        "prismatic-text-primary inline-flex w-fit items-center",
        metrics.gapClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {resolvedLogo ? (
        <span
          className={["inline-flex shrink-0 items-center", logoClassName]
            .filter(Boolean)
            .join(" ")}
          style={{ height: logoHeight }}
          aria-hidden={logoSrc && logoAlt === "" ? true : undefined}
        >
          {resolvedLogo}
        </span>
      ) : null}
      <span
        className={["inline-flex flex-col justify-center", textBlockClassName]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={[metrics.textClass, textClassName].filter(Boolean).join(" ")}
        >
          {title}
        </span>
        {subtitle ? (
          <span
            className={[metrics.textClass, subtitleClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  )
}
