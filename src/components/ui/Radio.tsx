import { useState } from "react"
import { usePrismaticInteraction } from "../../hooks/usePrismaticStore"

const EXPANDED_W = "304.012px"
const TEXT_CLASS =
  "font-['PP_Neue_Montreal',system-ui,sans-serif] text-[17.897px] leading-[1.1] tracking-[-0.3579px] text-center whitespace-nowrap"

type RadioRowProps = {
  label: string
  isActive: boolean
  onClick: () => void
}

function RadioRow({ label, isActive, onClick }: RadioRowProps) {
  const bg = isActive
    ? "prismatic-bg-surface-active hover:opacity-80"
    : "prismatic-bg-surface-muted"

  return (
    <button
      type="button"
      data-prismatic-interactive=""
      onClick={onClick}
      style={{
        minWidth: isActive ? EXPANDED_W : undefined,
      }}
      className={`group/radio flex h-9 min-w-0 cursor-pointer items-center px-2.5 outline-none transition-[min-width,background-color] duration-200 ease-out hover:min-w-[304.012px] ${bg}`}
    >
      <span
        className={`${TEXT_CLASS} ${isActive ? "prismatic-text-on-active" : "prismatic-text-primary"}`}
      >
        {label}
      </span>
    </button>
  )
}

export type RadioProps = {
  items: string[]
  value?: number
  defaultActiveIndex?: number
  onChange?: (index: number) => void
  className?: string
}

export function Radio({
  items,
  value,
  defaultActiveIndex = 0,
  onChange,
  className = "",
}: RadioProps) {
  const [internalActive, setInternalActive] = useState(defaultActiveIndex)
  const active = value ?? internalActive

  const select = (index: number) => {
    if (value === undefined) setInternalActive(index)
    onChange?.(index)
  }

  return (
    <div className={`flex flex-col items-start ${className}`}>
      {items.map((label, i) => (
        <RadioRow
          key={`${label}-${i}`}
          label={label}
          isActive={i === active}
          onClick={() => select(i)}
        />
      ))}
    </div>
  )
}
