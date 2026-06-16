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

### Layout mode

Use layout mode to drag panels and persist their default positions for dev and production builds:

```bash
npm run layout
```

This launches the same app with a layout toolbar at the bottom. Toggle workspace with `w` as usual, arrange panels, then click **save layout** to write positions, sizes, and image/slider layout settings to your app layout module (for example `src/layout.ts`). Import that snapshot in `PrismaticProvider` for normal `npm run dev` and build.

```ts
import { PRISMATIC_LAYOUT } from "./layout"
import { isLayoutMode, layoutSnapshotToStoreInit } from "@prismatic/core"

<PrismaticProvider
  storeInit={layoutSnapshotToStoreInit(PRISMATIC_LAYOUT, {
    layoutMode: isLayoutMode(),
  })}
>
```

Wire the Vite plugin in layout mode:

```ts
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { prismaticLayoutPlugin } from "@prismatic/core/vite/layout"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.PRISMATIC_LAYOUT_MODE": JSON.stringify(mode === "layout"),
  },
  plugins: [
    // ...your plugins
    mode === "layout" &&
      prismaticLayoutPlugin({
        layoutFile: path.resolve(rootDir, "src/layout.ts"),
      }),
  ].filter(Boolean),
}))
```

```json
{
  "scripts": {
    "dev": "vite",
    "layout": "vite --mode layout"
  }
}
```

## AI implementation guide

Prismatic is intended to be migrated into apps by humans and AI agents. Read
**[AI_IMPLEMENTATION_GUIDE.md](./docs/AI_IMPLEMENTATION_GUIDE.md)** before
moving app code into the framework. It documents the framework/app boundary,
the migration pipeline, canvas lifecycle rules, and the logical-vs-backing
measurement rule for resolution-safe shaders.

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
  colorMode: "default",
}
```

## Theming

Set `colorMode` on your config — two built-in looks are included:

| Mode | Description |
|------|-------------|
| `default` | Dark UI (current look) |
| `sand` | Light warm UI |

```ts
export const prismaticConfig: PrismaticConfig = {
  colorMode: "sand",
  // ...
}
```

Prismatic applies the palette as CSS custom properties automatically via `PrismaticProvider`. Import the stylesheet in your app:

```css
@import "tailwindcss";
@import "@prismatic/core/style.css";

body {
  background: var(--prismatic-app-bg);
  color: var(--prismatic-text-primary);
}
```

For advanced overrides, you can still pass `theme: { palette: { ... } }` — it takes precedence over `colorMode`.

Legacy explicit token overrides also work: `theme: { colors: { textPrimary: "..." } }`.

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

### Canvas resolution

Use `CanvasResolutionControl` to switch the working resolution between full,
half, and quarter size. The canvas keeps the same on-screen dimensions, while
the p5 backing buffer and loaded source images are reduced to lower the render
cost.

```tsx
import { CanvasResolutionControl } from "@prismatic/core"

<CanvasResolutionControl />
```

Inside a sketch, call `p.getPrismaticResolutionScale?.()` when custom buffers or
source processing need to follow the active resolution scale.

`saveCanvas()` always captures a full-resolution render, even when the current
working resolution is half or quarter.

## Workspace panels

| Component | Purpose |
|-----------|---------|
| `WorkspaceShell` | Full-screen overlay container + snap debug overlay |
| `WorkspacePanel` | Draggable, snap-aligned panel wrapper |
| `ImagePanel` | Resizable image preview (module grid) |
| `ButtonPanel` | Resizable ellipse button with `S` / `M` / `L` size controls |
| `SlidersPanel` | Multi-column slider layout |
| `FloatingHelp` | Auto-placed help icon (excluded from snap) |

## UI primitives

`Slider`, `Button`, `ButtonPanel`, `Radio`, `ImageComponent`, `AppTitle`, `AppTitlePanel` —
styled controls and identity primitives for generative tool UIs.

`Button` defaults to the large fixed ellipse (`274×120`). Pass `size="medium"` for large
type at slider height (`70px`) with a minimum width of `274px` that grows to hug longer
labels, or `size="small"` for small type at slider height with content-hugging width.

Use `ButtonPanel` inside `WorkspacePanel` when the button should be resizable in
workspace mode. It adds the same hover controls and resize handle pattern as
`ImagePanel`, with `S` / `M` / `L` size choices.

```tsx
import { Button, ButtonPanel, WorkspacePanel } from "@prismatic/core"

<Button size="medium" onClick={save}>save</Button>

<WorkspacePanel id="save">
  <ButtonPanel onClick={save}>save</ButtonPanel>
</WorkspacePanel>
```

Use `AppTitle` to show the app name in the workspace or surrounding chrome. The
small title style is the default; pass `size="large"` only when the title should
take more visual weight. Logo images keep their proportions and follow the text
block height for the selected size. Pass `subtitle` for a stacked title/byline
lockup.

Use `AppTitlePanel` inside `WorkspacePanel` when the title should be resizable in
workspace mode. It adds the same hover controls and resize handle pattern as
`ImagePanel`, but exposes only `S` and `M` size choices.

```tsx
import { AppTitle, AppTitlePanel, WorkspacePanel } from "@prismatic/core"

<AppTitle title="dopelganger" subtitle="by 5heads" logoSrc="/logo.svg" />

<WorkspacePanel id="title">
  <AppTitlePanel title="dopelganger" subtitle="by 5heads" logoSrc="/logo.svg" />
</WorkspacePanel>
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
