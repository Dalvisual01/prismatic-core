import { useCallback, useMemo, useRef, useState, type MutableRefObject } from "react"
import {
  Button,
  CanvasResolutionControl,
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
  usePrismaticStore,
  type CreativeCanvasHandle,
} from "../src/index"
import { createPlaygroundSketch } from "./sketch"
import { ThemeControls } from "./ThemeControls"
import type { PrismaticColorMode } from "../src/theme/tokens"

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

type ComponentKind = "button" | "slider" | "radio" | "image" | "resolution"

type PlaygroundPanel = {
  id: string
  kind: ComponentKind
}

const COMPONENT_CATALOG: { kind: ComponentKind; label: string; description: string }[] = [
  { kind: "button", label: "Button", description: "Ellipse CTA" },
  { kind: "slider", label: "Slider", description: "Range control" },
  { kind: "radio", label: "Radio", description: "Option list" },
  { kind: "image", label: "Image preview", description: "Source picker" },
  { kind: "resolution", label: "Resolution", description: "Canvas work scale" },
]

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "demo-button": { x: 360, y: 120 },
  "demo-slider": { x: 360, y: 300 },
  "demo-image": { x: 360, y: 420 },
  "demo-resolution": { x: 360, y: 560 },
}

function ImagePreviewDemo({
  imageSrc,
  onImageReplace,
}: {
  imageSrc: string
  onImageReplace: (file: File) => void
}) {
  return (
    <ImageComponent
      src={imageSrc}
      kind="image"
      fileName="gradient-sample.svg"
      sizeKB={12}
      onReplace={onImageReplace}
    />
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
  onSaveCanvas,
}: {
  panelId: string
  kind: ComponentKind
  sliderValue: number
  onSliderChange: (value: number) => void
  radioValue: number
  onRadioChange: (index: number) => void
  imageSrc: string
  onImageReplace: (file: File) => void
  onSaveCanvas: () => void
}) {
  switch (kind) {
    case "button":
      return <Button onClick={onSaveCanvas}>save</Button>
    case "slider":
      return (
        <SlidersPanel panelId={panelId}>
          <Slider
            label="Post FX"
            value={sliderValue}
            min={0}
            max={1}
            step={0.01}
            displayValue={(v) => v.toFixed(2)}
            onChange={onSliderChange}
          />
        </SlidersPanel>
      )
    case "radio":
      return (
        <Radio
          items={["option a", "option b", "option c"]}
          value={radioValue}
          onChange={onRadioChange}
        />
      )
    case "image":
      return (
        <ImagePanel panelId={panelId}>
          <ImagePreviewDemo imageSrc={imageSrc} onImageReplace={onImageReplace} />
        </ImagePanel>
      )
    case "resolution":
      return <CanvasResolutionControl />
  }
}

export function App() {
  const canvasRef = useRef<CreativeCanvasHandle>(null)
  const sketchParamsRef = useRef({ amount: 0.42 })
  const [colorMode, setColorMode] = useState<PrismaticColorMode>("default")
  const [imageSrc, setImageSrc] = useState(PLACEHOLDER_IMAGE)
  const storeInit = useMemo(
    () => ({
      initialPositions: INITIAL_POSITIONS,
    }),
    [],
  )
  const config = useMemo(
    () => ({
      colorMode,
      canvas: {
        spotlight: true,
      },
    }),
    [colorMode],
  )
  const createSketch = useMemo(
    () =>
      createPlaygroundSketch({
        getAmount: () => sketchParamsRef.current.amount,
      }),
    [],
  )

  const onImageReplace = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setImageSrc((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev)
      return url
    })
    canvasRef.current?.loadSource(url, "image")
  }, [])

  return (
    <PrismaticProvider config={config} storeInit={storeInit}>
      <CreativeCanvas ref={canvasRef} createSketch={createSketch} />
      <Playground
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        onSaveCanvas={() => canvasRef.current?.saveCanvas("shader-playground")}
        imageSrc={imageSrc}
        onImageReplace={onImageReplace}
        sketchParamsRef={sketchParamsRef}
      />
    </PrismaticProvider>
  )
}

function Playground({
  colorMode,
  onColorModeChange,
  onSaveCanvas,
  imageSrc,
  onImageReplace,
  sketchParamsRef,
}: {
  colorMode: PrismaticColorMode
  onColorModeChange: (colorMode: PrismaticColorMode) => void
  onSaveCanvas: () => void
  imageSrc: string
  onImageReplace: (file: File) => void
  sketchParamsRef: MutableRefObject<{ amount: number }>
}) {
  const useStore = usePrismaticStore()
  const setUiGroupPosition = useStore((s) => s.setUiGroupPosition)
  const counterRef = useRef(0)
  const [panels, setPanels] = useState<PlaygroundPanel[]>([
    { id: "demo-button", kind: "button" },
    { id: "demo-slider", kind: "slider" },
    { id: "demo-image", kind: "image" },
    { id: "demo-resolution", kind: "resolution" },
  ])
  const [sliderValue, setSliderValue] = useState(0.42)
  const [radioValue, setRadioValue] = useState(0)

  const handleSliderChange = useCallback(
    (value: number) => {
      sketchParamsRef.current.amount = value
      setSliderValue(value)
    },
    [sketchParamsRef],
  )

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

  return (
    <>
      <aside className="pointer-events-auto fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col border-r border-[var(--prismatic-border-subtle)] bg-[var(--prismatic-overlay-bg)] backdrop-blur-md">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-[13px] lowercase tracking-[-0.26px] text-white">playground</p>
          <p className="mt-1 text-[11px] lowercase leading-snug text-white/55">
            Shader playground with image source and post FX. Press{" "}
            <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/80">w</kbd> to drag
            panels. Switch resolution to stress-test the canvas pipeline.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
            on canvas
          </p>
          {panels.length === 0 ? (
            <p className="mb-5 px-1 text-[10px] lowercase text-white/40">
              no panels yet
            </p>
          ) : (
            <ul className="mb-5 flex flex-col gap-1.5">
              {panels.map((panel) => {
                const label =
                  COMPONENT_CATALOG.find((c) => c.kind === panel.kind)?.label ??
                  panel.kind
                return (
                  <li key={panel.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/8"
                      onClick={() => removePanel(panel.id)}
                    >
                      <span className="text-[12px] lowercase text-white">{label}</span>
                      <span className="text-[10px] lowercase text-white/45">remove</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

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
          <ThemeControls colorMode={colorMode} onChange={onColorModeChange} />
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
              onSliderChange={handleSliderChange}
              radioValue={radioValue}
              onRadioChange={setRadioValue}
              imageSrc={imageSrc}
              onImageReplace={onImageReplace}
              onSaveCanvas={onSaveCanvas}
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
