import { useId, useRef, useState, type KeyboardEvent } from "react"
import type { PreviewKind } from "../../canvas/types"
import { imageComponentMetrics } from "../../workspace/imageLayout"

export type ImageComponentProps = {
  src: string
  kind: PreviewKind
  fileName: string
  sizeKB: number
  size: number
  onReplace: (file: File) => void
}

const TEXT_LG =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[18px] leading-[1.1] tracking-[-0.36px] lowercase"
const TEXT_SM =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[12px] leading-[1.1] tracking-[-0.24px] lowercase"

export function ImageComponent({
  src,
  kind,
  fileName,
  sizeKB,
  size,
  onReplace,
}: ImageComponentProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isActive, setIsActive] = useState(false)
  const metrics = imageComponentMetrics(size)

  const shortName =
    fileName.length > 42 ? `${fileName.slice(0, 39)}…` : fileName

  const openPicker = () => inputRef.current?.click()

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openPicker()
    }
  }

  return (
    <div
      className="group relative shrink-0 cursor-pointer rounded-[500px] outline-none [corner-shape:round]"
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-label="Replace source image or video"
      onClick={openPicker}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-full transition-[filter] duration-200 [corner-shape:round]"
        style={{ filter: `blur(${isActive ? 0 : metrics.blur}px)` }}
      >
        {kind === "video" ? (
          <video
            src={src}
            muted
            loop
            playsInline
            autoPlay
            className="block size-full max-w-none object-cover"
          />
        ) : (
          <img
            alt=""
            src={src}
            className="block size-full max-w-none object-cover"
          />
        )}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          paddingLeft: metrics.paddingX,
          paddingRight: metrics.paddingX,
          paddingTop: metrics.paddingY,
          paddingBottom: metrics.paddingY,
        }}
      >
        <div
          className={[
            "flex w-full max-w-[274px] flex-col justify-center rounded-[var(--radius)] border border-solid border-white bg-[rgba(212,212,212,0.2)] pl-[18px] pr-[12px] text-[rgba(212,212,212,0.9)] backdrop-blur-[10px] transition-[background-color,border-color] duration-200 group-hover:border-transparent group-hover:bg-[rgba(255,255,255,0.5)] group-hover:text-[rgba(255,255,255,0.9)]",
            metrics.showFileSize ? "gap-2 py-3" : "py-2.5",
          ].join(" ")}
          style={{
            width: metrics.metaWidth,
            height: metrics.metaHeight,
          }}
        >
          <p
            className={[
              "line-clamp-2",
              metrics.compactFilename ? "max-h-[28px]" : "max-h-[44px]",
              metrics.compactFilename ? TEXT_SM : TEXT_LG,
            ].join(" ")}
          >
            {shortName}
          </p>
          {metrics.showFileSize && (
            <p className={TEXT_SM}>{sizeKB} kb</p>
          )}
        </div>
        <div
          className="relative flex w-full max-w-[274px] items-center justify-center"
          style={{
            width: metrics.metaWidth,
            height: metrics.replaceHeight,
          }}
        >
          <svg
            viewBox="0 0 274 120"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full"
          >
            <ellipse
              cx="137"
              cy="60"
              rx="136"
              ry="59"
              fill={isActive ? "white" : "transparent"}
              stroke={isActive ? "transparent" : "white"}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span
            className={`relative z-[1] text-[rgba(212,212,212,0.9)] ${TEXT_LG}`}
          >
            replace
          </span>
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onReplace(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}
