# @prismatic/core

Creative coding framework for generative graphics tools — workspace UI, draggable panels, canvas pan/zoom, and tweakpane-style controls built on React + p5.

## Install

### Git dependency (recommended for now)

```json
{
  "dependencies": {
    "@prismatic/core": "github:Dalvisual01/prismatic-core#v0.1.0"
  }
}
```

### Local development

```json
{
  "dependencies": {
    "@prismatic/core": "file:../prismatic-core"
  }
}
```

After installing, build the library if using a git checkout without committed `dist/`:

```bash
cd node_modules/@prismatic/core && npm install && npm run build
```

## Tailwind CSS

Prismatic components use Tailwind utility classes. In Tailwind v4, scan the library bundle from your app CSS:

```css
@import "tailwindcss";
@source "../node_modules/@prismatic/core/dist/index.js";
```

For `file:` dependencies, point `@source` at the library `dist/` path relative to your CSS file.

## Quick start

```tsx
import { useRef } from "react"
import {
  CreativeCanvas,
  PrismaticProvider,
  WorkspacePanel,
  WorkspaceShell,
  Slider,
  type CreativeCanvasHandle,
} from "@prismatic/core"
import { prismaticConfig } from "./prismatic.config"
import { createMySketch } from "./sketch"

export default function App() {
  const canvasRef = useRef<CreativeCanvasHandle>(null)

  return (
    <PrismaticProvider config={prismaticConfig}>
      <CreativeCanvas ref={canvasRef} createSketch={createMySketch} />
      <WorkspaceShell>
        <WorkspacePanel id="controls">
          <Slider label="Amount" value={0.5} min={0} max={1} onChange={() => {}} />
        </WorkspacePanel>
      </WorkspaceShell>
    </PrismaticProvider>
  )
}
```

## Component playground

Run the local UI playground to add components, tweak the theme, and test workspace mode:

```bash
npm run dev:playground
```

Opens at `http://localhost:5173` with a component picker, live theme controls, and workspace shortcuts (`w`, `r`).

## Configuration

Create `prismatic.config.ts` in your project:

```ts
import type { PrismaticConfig } from "@prismatic/core"

export const prismaticConfig: PrismaticConfig = {
  workspace: {
    enabled: true,
    margin: 20,
    moduleSize: 70,
    snapThreshold: 12,
    snapExcludedPanelIds: ["shortcuts"],
  },
  canvas: {
    minZoom: 0.15,
    maxZoom: 12,
    spotlight: false,
    downloadFilePrefix: "output",
  },
  shortcuts: {
    toggleWorkspace: "w",
    resetCanvasView: "r",
  },
  theme: {
    palette: {
      background: "#141316",
      surface: "rgb(36, 35, 38)",
      foreground: "#ffffff",
      accent: "#e1e1e1",
      onAccent: "#000000",
      muted: "#313034",
    },
    paletteBlendModes: {
      foreground: "difference",
    },
  },
}
```

## Theming

You configure **6 palette colours**. Prismatic derives every UI token from them (text opacities, borders, overlays, etc.).

| Palette | Role |
|---------|------|
| `background` | App + canvas base |
| `surface` | Control chrome (sliders, frames) |
| `foreground` | Text, strokes, borders |
| `accent` | Active / hover fill |
| `onAccent` | Text on accent fills (button hover, active radio) |
| `muted` | Slider pill fill, inactive radio rows |

Each palette slot has a `mix-blend-mode`. It applies to **fills and strokes** via `prismatic-bg-*` / `prismatic-border-*` utilities — text always blends `normal` for readability.

Use `npm run dev:playground` to tune the palette, then **copy theme css** — you get the full derived `:root` block ready to paste into your project.

Legacy explicit token overrides still work: `theme: { colors: { textPrimary: "..." } }`.

### App CSS

Import the library stylesheet and wire your page to the same variables:

```css
@import "tailwindcss";
@import "@prismatic/core/style.css";

body {
  background: var(--prismatic-app-bg);
  color: var(--prismatic-text-primary);
}
```

### p5 sketches

Read the resolved theme inside your sketch factory:

```ts
import { getRuntimeTheme, parseColor } from "@prismatic/core"

p.draw = () => {
  const { r, g, b } = parseColor(getRuntimeTheme().canvasBackground)
  p.background(r, g, b)
}
```

### Export CSS

Generate the same `:root` block in code:

```ts
import { formatPrismaticThemeCss, resolvePrismaticConfig } from "@prismatic/core"

const { theme, themeBlendModes } = resolvePrismaticConfig(prismaticConfig)
const css = formatPrismaticThemeCss(theme, themeBlendModes)
```

### Presets

```ts
import { PRISMATIC_THEME_PRESETS, type PrismaticConfig } from "@prismatic/core"

export const prismaticConfig: PrismaticConfig = {
  theme: PRISMATIC_THEME_PRESETS.find((p) => p.id === "sand")!.theme,
}
```

Paste copied CSS from the playground into your stylesheet, or pass `palette` in config and let `PrismaticProvider` apply it at runtime.

## Canvas sketch factory

Pass a p5 sketch factory to `CreativeCanvas`. Poll app state inside the sketch via getters (no React subscriptions in the render loop):

```ts
import type { SketchFactory } from "@prismatic/core"
import { createSketch } from "./sketch"
import { useMyStore } from "./state"

export const createMySketch: SketchFactory = (p) =>
  createSketch({
    getParams: () => useMyStore.getState().params,
  })(p)
```

`CreativeCanvasHandle` exposes:

- `loadSource(url, "image" | "video")`
- `saveCanvas(filename?)`

## Workspace panels

| Component | Purpose |
|-----------|---------|
| `WorkspaceShell` | Full-screen overlay container + snap debug overlay |
| `WorkspacePanel` | Draggable, snap-aligned panel wrapper |
| `ImagePanel` | Resizable image preview (module grid) |
| `SlidersPanel` | Multi-column slider layout |
| `FloatingHelp` | Auto-placed help icon (excluded from snap) |

## UI primitives

`Slider`, `Button`, `Radio`, `ImageComponent` — styled controls for generative tool UIs.

### Button variants

| `variant` | Use case | Default size | Visual |
|-----------|----------|--------------|--------|
| `"cta"` | Playground / generic CTA | 274×120 | Theme outline → filled on hover |
| `"frame"` | Secondary actions (upload, reset) | 194×120 | Stroke-only ellipse, difference-blend label |
| `"save"` | Primary export/save | 216×113 | Always-filled ellipse, difference-blend label |

```tsx
<Button variant="frame" onClick={onUpload}>upload image</Button>
<Button variant="save" onClick={onSave}>save result</Button>
<Button variant="cta">generic cta</Button>

// Custom save asset (optional — defaults to /assets/save-button-bg.svg)
<Button variant="save" saveButtonBg='url("/assets/save-button-bg.svg")'>
  save result
</Button>
```

Optional asset props for app-specific SVGs:

```tsx
<Slider lineTopSrc="/assets/slider-line-top.svg" lineBottomSrc="..." />
```

## Layout utilities

Export panel positions/sizes from your app (see `pic-stretch` example `picStretchLayout.ts`):

```ts
import { createDefaultUiPositions, DEFAULT_UI_SIZES } from "./layout"

<PrismaticProvider
  storeInit={{
    initialPositions: createDefaultUiPositions(),
    initialSizes: DEFAULT_UI_SIZES,
  }}
>
```

## Releases

See **[RELEASING.md](./RELEASING.md)** for the full step-by-step guide (version bump, build, tag, push, update consumers).

Quick summary:

1. Bump `package.json` version
2. Update `CHANGELOG.md`
3. `npm run build` and commit `dist/`
4. `git push origin main && git tag v0.x.x && git push origin v0.x.x`
5. Bump `#v0.x.x` in consuming apps and `npm install`

## Example app

[pic-stretch](../pic-stretch%20copy) is the reference consumer — shader playground with workspace mode, image preview, and slider presets.
