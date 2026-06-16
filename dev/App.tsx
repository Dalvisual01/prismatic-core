import { useCallback, useMemo, useRef, useState, type MutableRefObject } from "react"
import {
  AppTitle,
  AppTitlePanel,
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

function DopelgangerMark() {
  return (
    <svg
      viewBox="0 0 298.246 61.3968"
      aria-hidden
      className="h-full w-auto"
    >
      <path
        fill="currentColor"
        d="M107.706 22.1677C107.848 22.3118 107.948 22.4924 107.997 22.6902L109.751 29.8293C109.818 30.1012 109.783 30.3886 109.652 30.6352L107.001 35.636C106.83 35.958 106.824 36.3446 106.985 36.6719L108.305 39.3571C108.518 39.7896 108.434 40.3121 108.098 40.6541L107.241 41.5265C106.93 41.8429 106.833 42.3169 106.994 42.7332L108.411 46.3871C108.564 46.7826 108.485 47.2324 108.206 47.5491L101.569 55.0838C101.203 55.4999 100.592 55.5787 100.135 55.2688L96.8507 53.0415C96.1169 52.5438 95.134 53.079 95.134 53.9763V60.2727C95.134 61.0037 94.4588 61.54 93.7618 61.3626L73.2793 56.1487C72.5941 55.9743 72.2438 55.1991 72.5597 54.5564L75.1624 49.2604C75.4315 48.7129 74.9764 48.086 74.3829 48.1866L66.4808 49.5267C65.7743 49.6465 65.3328 48.7735 65.8392 48.2582L70.6873 43.3262C71.1511 42.8544 70.8227 42.0476 70.1668 42.0476H60.4506C59.762 42.0476 59.4503 41.1717 59.9793 40.7232L69.0891 32.9999C69.5115 32.6419 69.4131 31.9563 68.9078 31.736L58.388 27.15C57.7512 26.8724 57.8095 25.935 58.4756 25.7414L68.6737 22.7769C69.2422 22.6117 69.397 21.8664 68.9427 21.4813L60.3627 14.2076C59.7966 13.7277 60.1978 12.7931 60.9285 12.8894L73.0094 14.4822C73.449 14.5402 73.8389 14.1926 73.8402 13.7416L73.8709 2.88853C73.8729 2.18163 74.7478 1.87078 75.1818 2.42276L80.7611 9.51788C81.1256 9.98135 81.8498 9.84992 82.0343 9.28683L84.9092 0.512357C85.1166 -0.120648 85.9727 -0.182559 86.266 0.414232L90.7526 9.54278C90.9932 10.0324 91.652 10.1025 91.987 9.6741L96.7632 3.56613C97.1924 3.01726 98.0612 3.31596 98.0753 4.01721L98.24 12.2567C98.2439 12.4502 98.3212 12.6347 98.4559 12.7715L107.706 22.1677Z"
      />
      <path
        fill="currentColor"
        d="M117.554 51.1652C116.732 50.9967 116.27 50.1115 116.6 49.3355L125.295 28.904C125.345 28.7863 125.412 28.6764 125.493 28.5777L135.247 16.7488C135.963 15.8803 135.349 14.5659 134.227 14.5659H123.128C122.16 14.5659 121.85 13.254 122.716 12.8167L136.365 5.91918C136.51 5.84619 136.666 5.80038 136.827 5.78402L151.249 4.31691C151.794 4.26153 152.316 4.5482 152.564 5.03854L154.898 9.65103C154.986 9.82641 155.113 9.97986 155.267 10.1003L160.311 14.0281C160.381 14.0828 160.445 14.1445 160.503 14.2122L166.412 21.1143C166.619 21.3561 166.733 21.6645 166.733 21.9835V26.7705C166.733 27.1349 166.882 27.4834 167.144 27.7348L174.298 34.5928L181.403 42.3493C181.628 42.5953 181.753 42.9175 181.753 43.2519V44.163C181.753 44.516 181.614 44.8546 181.366 45.1044L178.092 48.4009C177.912 48.5826 177.683 48.708 177.434 48.7621L169.086 50.5704C168.812 50.6297 168.527 50.6003 168.27 50.4863L152.775 43.5902C152.384 43.4164 151.934 43.4425 151.566 43.6604L148.5 45.4748C148.283 45.6033 148.107 45.7913 147.992 46.0169L143.211 55.4263C142.941 55.9592 142.35 56.2453 141.767 56.1258L117.554 51.1652Z"
      />
      <path
        fill="currentColor"
        d="M283.893 13.576C284.101 13.7877 284.384 13.9066 284.678 13.9066H297.136C297.749 13.9066 298.246 14.4119 298.246 15.0352V15.6014C298.246 15.8242 298.181 16.042 298.06 16.2274L294.429 21.7622C294.305 21.9522 294.126 22.0993 293.918 22.1841L284.916 25.8438C284.495 26.0152 284.218 26.4302 284.218 26.8917V31.2946C284.218 31.4304 284.243 31.5652 284.29 31.6923L287.051 39.1466C287.26 39.71 286.997 40.3408 286.453 40.58L284.888 41.2691C284.481 41.4479 284.218 41.8548 284.218 42.3048V44.1923C284.218 44.3675 284.178 44.5403 284.101 44.697L280.577 51.8605C280.359 52.3036 279.882 52.5504 279.401 52.469L269.479 50.7885C268.803 50.6738 268.186 51.2043 268.186 51.9017V57.0304C268.186 57.742 267.546 58.276 266.86 58.1374L246.522 54.0323C245.737 53.8738 245.37 52.9483 245.827 52.2805L251.076 44.6166C251.295 44.2971 251.336 43.8856 251.185 43.5277L248.231 36.5115C248.175 36.3793 248.095 36.2592 247.995 36.1575L242.459 30.5318C242.251 30.3201 242.134 30.033 242.134 29.7337V20.2832C242.134 20.108 242.174 19.9352 242.251 19.7785L246.062 12.0333C246.115 11.9248 246.185 11.8257 246.27 11.74L249.825 8.12638C250.033 7.91472 250.15 7.62765 250.15 7.32832V4.47458C250.15 4.05903 250.482 3.72216 250.89 3.72216H254.079C254.132 3.72216 254.184 3.71837 254.236 3.71082L267.843 1.73549C268.067 1.70303 268.295 1.74064 268.497 1.8433L276.041 5.67738C276.148 5.73163 276.245 5.80302 276.33 5.8888L283.893 13.576Z"
      />
      <path
        fill="currentColor"
        d="M5.45288 37.3962C5.5166 37.2261 5.53847 37.0428 5.5166 36.8622L3.09412 16.8562C3.05689 16.5487 3.14692 16.2394 3.34293 16.0012L14.0521 2.99106C14.2877 2.7049 14.6482 2.55525 15.0148 2.59147L35.0919 4.57572C35.1954 4.58595 35.2998 4.57406 35.3984 4.54084L39.672 3.10091C40.2513 2.90573 40.8025 3.46276 40.6093 4.04825L39.338 7.90252C39.2214 8.25611 39.3798 8.64256 39.7096 8.80924L42.8649 10.4037C42.9678 10.4557 43.0813 10.4828 43.1963 10.4828H47.4661C48.0579 10.4828 48.4109 11.1494 48.0826 11.6471L45.3224 15.832C45.1012 16.1674 45.0747 16.5969 45.253 16.9574L46.7901 20.0653C46.8672 20.2213 46.9073 20.3933 46.9073 20.5676V27.069C46.9073 27.2908 46.9723 27.5077 47.094 27.6922L50.4361 32.7583C50.6573 33.0938 50.6838 33.5233 50.5054 33.8839L49.1578 36.6079C48.9696 36.9885 48.5847 37.2289 48.1637 37.2289H46.0762C45.4623 37.2289 44.9646 37.7318 44.9646 38.3523V48.7469C44.9646 48.9213 45.0048 49.0932 45.0819 49.2492L46.3344 51.7816C46.6368 52.3931 46.3333 53.1335 45.6916 53.3497L41.479 54.7686C41.2207 54.8556 40.9399 54.8438 40.6897 54.7354L29.0256 49.6831C28.2922 49.3654 27.4763 49.9092 27.4763 50.7157V57.2774C27.4763 57.9865 26.8343 58.5182 26.1464 58.3789L0.893696 53.2652C0.220731 53.1289 -0.170421 52.4149 0.0724947 51.7661L5.45288 37.3962Z"
      />
      <path
        fill="currentColor"
        d="M228.719 32.1236C228.688 32.3172 228.708 32.5156 228.775 32.6991L231.695 40.6039C231.888 41.1278 231.675 41.7169 231.193 41.9866L229.244 43.079C228.891 43.2768 228.672 43.6547 228.672 44.0652V51.8665C228.672 52.4454 228.241 52.9299 227.676 52.9866L224.449 53.3103C224.291 53.3261 224.132 53.3072 223.983 53.255L218.388 51.3028C217.871 51.1224 217.302 51.3546 217.05 51.8489L214.144 57.5525C213.917 57.9981 213.428 58.2365 212.945 58.137L194.465 54.3269C193.832 54.1964 193.444 53.5427 193.623 52.9106L196.143 44.0438C196.256 43.6469 196.146 43.219 195.858 42.929L184.522 31.5424C184.251 31.2708 184.137 30.8766 184.218 30.4987L188.576 10.3356C188.647 10.0064 188.859 9.72705 189.154 9.57433L204.073 1.8463C204.31 1.72347 204.583 1.692 204.841 1.75767L218.972 5.35397C219.218 5.41656 219.435 5.5635 219.587 5.77012L230.254 20.2478C230.434 20.4922 230.509 20.8008 230.461 21.1026L228.719 32.1236Z"
      />
    </svg>
  )
}

const playgroundLogo = <DopelgangerMark />
const playgroundTitle = "dopelganger"
const playgroundSubtitle = "by 5heads"

type ComponentKind = "title" | "button" | "slider" | "radio" | "image" | "resolution"

type PlaygroundPanel = {
  id: string
  kind: ComponentKind
}

const COMPONENT_CATALOG: { kind: ComponentKind; label: string; description: string }[] = [
  { kind: "title", label: "App title", description: "Small identity label" },
  { kind: "button", label: "Button", description: "Ellipse CTA" },
  { kind: "slider", label: "Slider", description: "Range control" },
  { kind: "radio", label: "Radio", description: "Option list" },
  { kind: "image", label: "Image preview", description: "Source picker" },
  { kind: "resolution", label: "Resolution", description: "Canvas work scale" },
]

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "demo-title": { x: 24, y: 24 },
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
    case "title":
      return (
        <AppTitlePanel
          panelId={panelId}
          title={playgroundTitle}
          subtitle={playgroundSubtitle}
          logo={playgroundLogo}
          className="select-none"
        />
      )
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
    { id: "demo-title", kind: "title" },
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
          <AppTitle
            title={playgroundTitle}
            subtitle={playgroundSubtitle}
            logo={playgroundLogo}
          />
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
