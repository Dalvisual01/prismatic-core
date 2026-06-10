# @prismatic/core

Creative coding framework for generative graphics tools — workspace UI, draggable panels, canvas pan/zoom, and tweakpane-style controls built on React + p5.

## Install

### Git dependency (recommended for now)

```json
{
  "dependencies": {
    "@prismatic/core": "github:YOUR_ORG/prismatic-core#v0.1.0"
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
}
```

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

Optional asset props for app-specific SVGs:

```tsx
<Slider lineTopSrc="/assets/slider-line-top.svg" lineBottomSrc="..." />
<Button saveButtonBg='url("/assets/save-button-bg.svg")' />
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

1. Update `CHANGELOG.md`
2. `npm run build` (commits `dist/` for git consumers)
3. `git tag v0.x.x && git push origin v0.x.x`
4. Bump tag in consuming apps: `npm install`

## Example app

[pic-stretch](../pic-stretch%20copy) is the reference consumer — shader playground with workspace mode, image preview, and slider presets.
