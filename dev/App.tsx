import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Button,
  CreativeCanvas,
  FloatingHelp,
  ImageComponent,
  ImagePanel,
  PrismaticProvider,
  Radio,
  Slider,
  SlidersPanel,
  WorkspacePanel,
  WorkspaceShell,
  imagePreviewSizePx,
  usePrismaticStore,
  type SketchFactory,
} from "../src/index"
import { playgroundSketch } from "./sketch"
import { ThemeControls } from "./ThemeControls"
import type { PrismaticThemeInput } from "../src/theme/tokens"

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5b4bff"/>
          <stop offset="50%" stop-color="#ff5b8a"/>
          <stop offset="100%" stop-color="#ffc85b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#g)"/>
    </svg>`,
  )

type ComponentKind = "button" | "slider" | "radio" | "image"

type PlaygroundPanel = {
  id: string
  kind: ComponentKind
}

const COMPONENT_CATALOG: { kind: ComponentKind; label: string; description: string }[] = [
  { kind: "button", label: "Button", description: "Ellipse CTA" },
  { kind: "slider", label: "Slider", description: "Range control" },
  { kind: "radio", label: "Radio", description: "Option list" },
  { kind: "image", label: "Image preview", description: "Source picker" },
]

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "demo-button": { x: 360, y: 120 },
  "demo-slider": { x: 360, y: 300 },
}

function PanelChrome({
  title,
  onRemove,
  children,
}: {
  title: string
  onRemove: () => void
  children: ReactNode
}) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)

  if (!workspaceMode) {
    return (
      <div className="workspace-hover-zone pointer-events-auto">{children}</div>
    )
  }

  return (
    <div className="workspace-hover-zone workspace-panel pointer-events-auto flex flex-col gap-3 rounded-[var(--radius)] bg-black/40 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] lowercase tracking-wide text-white/70">{title}</span>
        <button
          type="button"
          className="workspace-controls rounded-full px-2 py-0.5 text-[10px] lowercase text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
        >
          remove
        </button>
      </div>
      {children}
    </div>
  )
}

function PlaygroundPanelContent({
  panelId,
  kind,
  sliderValue,
  onSliderChange,
  radioValue,
  onRadioChange,
  imageSrc,
  onImageReplace,
  onRemove,
}: {
  panelId: string
  kind: ComponentKind
  sliderValue: number
  onSliderChange: (value: number) => void
  radioValue: number
  onRadioChange: (index: number) => void
  imageSrc: string
  onImageReplace: (file: File) => void
  onRemove: () => void
}) {
  const label = COMPONENT_CATALOG.find((c) => c.kind === kind)?.label ?? kind

  switch (kind) {
    case "button":
      return (
        <PanelChrome title={label} onRemove={onRemove}>
          <div className="flex flex-col items-start gap-4">
            <Button variant="frame">upload image</Button>
            <Button variant="save">save result</Button>
            <Button variant="cta">generic cta</Button>
          </div>
        </PanelChrome>
      )
    case "slider":
      return (
        <PanelChrome title={label} onRemove={onRemove}>
          <SlidersPanel panelId={panelId}>
            <Slider
              label="Amount"
              value={sliderValue}
              min={0}
              max={1}
              step={0.01}
              displayValue={(v) => v.toFixed(2)}
              onChange={onSliderChange}
            />
          </SlidersPanel>
        </PanelChrome>
      )
    case "radio":
      return (
        <PanelChrome title={label} onRemove={onRemove}>
          <Radio
            items={["option a", "option b", "option c"]}
            value={radioValue}
            onChange={onRadioChange}
          />
        </PanelChrome>
      )
    case "image":
      return (
        <PanelChrome title={label} onRemove={onRemove}>
          <ImagePanel panelId={panelId}>
            <ImageComponent
              src={imageSrc}
              kind="image"
              fileName="gradient-sample.svg"
              sizeKB={12}
              size={imagePreviewSizePx(6)}
              onReplace={onImageReplace}
            />
          </ImagePanel>
        </PanelChrome>
      )
  }
}

export function App() {
  const [theme, setTheme] = useState<PrismaticThemeInput>({})
  const storeInit = useMemo(
    () => ({
      initialPositions: INITIAL_POSITIONS,
    }),
    [],
  )
  const config = useMemo(() => ({ theme }), [theme])

  return (
    <PrismaticProvider config={config} storeInit={storeInit}>
      <CreativeCanvas createSketch={playgroundSketch as SketchFactory} />
      <Playground theme={theme} onThemeChange={setTheme} />
    </PrismaticProvider>
  )
}

function Playground({
  theme,
  onThemeChange,
}: {
  theme: PrismaticThemeInput
  onThemeChange: (theme: PrismaticThemeInput) => void
}) {
  const useStore = usePrismaticStore()
  const setUiGroupPosition = useStore((s) => s.setUiGroupPosition)
  const counterRef = useRef(0)
  const [panels, setPanels] = useState<PlaygroundPanel[]>([
    { id: "demo-button", kind: "button" },
    { id: "demo-slider", kind: "slider" },
  ])
  const [sliderValue, setSliderValue] = useState(0.42)
  const [radioValue, setRadioValue] = useState(0)
  const [imageSrc, setImageSrc] = useState(PLACEHOLDER_IMAGE)

  const addPanel = useCallback(
    (kind: ComponentKind) => {
      counterRef.current += 1
      const id = `${kind}-${counterRef.current}`
      const index = counterRef.current
      setUiGroupPosition(id, {
        x: 360 + (index % 4) * 32,
        y: 96 + index * 72,
      })
      setPanels((current) => [...current, { id, kind }])
    },
    [setUiGroupPosition],
  )

  const removePanel = useCallback((id: string) => {
    setPanels((current) => current.filter((panel) => panel.id !== id))
  }, [])

  const onImageReplace = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setImageSrc((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev)
      return url
    })
  }, [])

  return (
    <>
      <aside className="pointer-events-auto fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col border-r border-[var(--prismatic-border-subtle)] bg-[var(--prismatic-overlay-bg)] backdrop-blur-md">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-[13px] lowercase tracking-[-0.26px] text-white">playground</p>
          <p className="mt-1 text-[11px] lowercase leading-snug text-white/55">
            Add components to the canvas, interact with them anytime, and press{" "}
            <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/80">w</kbd> to drag and
            arrange panels.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
            components
          </p>
          <ul className="mb-5 flex flex-col gap-1.5">
            {COMPONENT_CATALOG.map(({ kind, label, description }) => (
              <li key={kind}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/8"
                  onClick={() => addPanel(kind)}
                >
                  <span className="text-[12px] lowercase text-white">{label}</span>
                  <span className="text-[10px] lowercase text-white/45">{description}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
            theme
          </p>
          <ThemeControls theme={theme} onChange={onThemeChange} />
        </div>

        <div className="border-t border-white/10 px-4 py-3 text-[10px] lowercase leading-relaxed text-white/45">
          <p>
            <kbd className="rounded bg-white/10 px-1 text-white/70">w</kbd> workspace
          </p>
          <p>
            <kbd className="rounded bg-white/10 px-1 text-white/70">r</kbd> reset canvas
          </p>
        </div>
      </aside>

      <WorkspaceShell>
        {panels.map((panel) => (
          <WorkspacePanel key={panel.id} id={panel.id}>
            <PlaygroundPanelContent
              panelId={panel.id}
              kind={panel.kind}
              sliderValue={sliderValue}
              onSliderChange={setSliderValue}
              radioValue={radioValue}
              onRadioChange={setRadioValue}
              imageSrc={imageSrc}
              onImageReplace={onImageReplace}
              onRemove={() => removePanel(panel.id)}
            />
          </WorkspacePanel>
        ))}

        <FloatingHelp
          fallbackPosition={{ x: window.innerWidth - 48, y: 24 }}
          tooltip={(workspaceMode) => (
            <div className="space-y-1.5 text-[12px] leading-snug">
              <p className="text-white/95">
                {workspaceMode ? "workspace mode on" : "workspace mode off"}
              </p>
              <p>
                <kbd className="rounded bg-white/15 px-1">w</kbd> toggle workspace
              </p>
              <p>
                <kbd className="rounded bg-white/15 px-1">r</kbd> reset canvas view
              </p>
              <p className="text-white/70">drag panels when workspace is on</p>
            </div>
          )}
        />
      </WorkspaceShell>
    </>
  )
}
