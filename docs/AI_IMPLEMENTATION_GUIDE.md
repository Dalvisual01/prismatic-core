# AI Implementation Guide

Prismatic is designed to be migrated into apps by humans and AI agents. This
guide is the knowledge base an implementer should read before moving an existing
creative coding tool onto `@prismatic/core`.

## Framework Intent

Prismatic owns the reusable shell for generative graphics tools:

- React provider and runtime config
- p5 canvas mounting through `CreativeCanvas`
- workspace overlay, draggable panels, snapping, pan, and zoom
- themed UI primitives such as `Slider`, `Button`, `Radio`, and `ImageComponent`
- source loading, canvas export, work-resolution scaling, and background-tab pause

The consuming app still owns the creative behavior:

- p5 sketch code and shaders
- presets, parameter state, and control mapping
- source assets and project-specific file handling
- default panel layout for that app

Keep that boundary clear. Move generic UI, layout, and canvas lifecycle behavior
into the framework; keep artwork-specific rendering logic in the app.

## Migration Pipeline

1. Install `@prismatic/core` and import `@prismatic/core/style.css` from the app.
2. Create a `prismatic.config.ts` for workspace, canvas, shortcut, and theme rules.
3. Wrap the app in `PrismaticProvider`.
4. Mount the sketch with `CreativeCanvas`.
5. Render controls inside `WorkspaceShell` and `WorkspacePanel`.
6. Bridge React state into the p5 sketch through getter functions, not React hooks
   inside `draw()`.
7. Use `CreativeCanvasHandle.loadSource()` for image or video changes.
8. Use `CreativeCanvasHandle.saveCanvas()` for exports.
9. Add `CanvasResolutionControl` when the app needs lower-cost live rendering.

## Measurement Rules

The most important rendering rule is to separate logical measurements from
backing-buffer measurements.

Use logical measurements for composition:

- canvas layout and artwork coordinates
- shader grid spacing, line widths, margins, bands, masks, and UI-aligned marks
- `p.width`, `p.height`, and the `u_logicalResolution` shader uniform

Use backing-buffer measurements only for pixel-level work:

- `gl_FragCoord` normalization
- texture sampling UVs
- anti-aliasing calculations
- pixel density, work-resolution cost, and full-resolution export paths

Do not multiply composition distances by the active canvas resolution scale. A
70px grid, 36px footer band, or 1px logical line should look the same at `1.0x`,
`0.5x`, and `0.25x` work resolution. Only the render cost and sharpness should
change.

Shader convention:

```glsl
vec2 backingUV = gl_FragCoord.xy / u_backingResolution;
vec2 logicalCoord = (gl_FragCoord.xy + 0.5) / u_backingResolution * u_logicalResolution;
```

Use `backingUV` for texture sampling. Use `logicalCoord` for visual measurements
that must stay stable across resolution scales.

For custom p5 graphics buffers, read the active scale with
`p.getPrismaticResolutionScale?.()` and resolve pixel sizes with
`p.getPrismaticCanvasSize?.(logicalWidth, logicalHeight)` when you need explicit
backing dimensions.

## Canvas Lifecycle Rules

`CreativeCanvas` manages the p5 lifecycle. Implementers should not create a
second render loop around it.

- Put continuous rendering in `p.draw`.
- Use `p.updateImage` or app-specific sketch hooks for external source changes.
- Let `CreativeCanvas` handle `createCanvas`, `resizeCanvas`, resolution scaling,
  and full-resolution export.
- When the browser tab is hidden, `CreativeCanvas` pauses p5 with `noLoop()` and
  cancels canvas animation frames. No active tab means no canvas or shader
  activity. Rendering resumes when the tab becomes visible again.

If a sketch starts its own timers, web workers, video processing, or manual
`requestAnimationFrame` loops, it must also respect page visibility and stop work
while `document.hidden` is true.

## State And Controls

React controls should update normal React or external store state. The sketch
should read that state through stable getter functions:

```ts
const createSketch = createMySketch({
  getParams: () => paramsRef.current,
})
```

Avoid subscribing to React state inside p5. Avoid recreating the p5 instance for
ordinary slider changes.

## Layout Rules

Use the framework workspace primitives for all movable UI:

- `WorkspaceShell` as the full-screen workspace layer
- `WorkspacePanel` for draggable panels
- `ImagePanel` for image/source previews
- `SlidersPanel` for slider groups
- `FloatingHelp` for the help affordance

In workspace mode, interactive panel content must not show hover or focus
states. Mark draggable panel primitives with `data-prismatic-interactive` and gate
JS-driven hover/active state with `usePrismaticInteraction()`. Only elements
with class `workspace-controls` stay clickable.
define a stable default layout without hardcoding layout behavior into framework
components.

### Layout mode

Apps should keep a committed layout module (for example `src/layout.ts`) and
import it into `PrismaticProvider` via `layoutSnapshotToStoreInit()`.

Run `npm run layout` (`vite --mode layout`) to edit that layout visually.
Workspace behaves the same as normal dev — toggle with `w`, then click
**save layout** when you are ready. The snapshot is written to the layout module
and used for normal dev and production builds.

Use the `prismaticLayoutPlugin` from `@prismatic/core/vite/layout` and set
`import.meta.env.PRISMATIC_LAYOUT_MODE` when `mode === "layout"`.

## Implementation Checklist

Before considering a migration complete:

- The app imports `@prismatic/core/style.css`.
- The app wraps UI in `PrismaticProvider`.
- The canvas is mounted through `CreativeCanvas`.
- Panels use workspace primitives instead of app-specific drag wrappers.
- Shader composition uses logical measurements.
- Backing-buffer measurements are isolated to sampling, AA, and export paths.
- Source loading goes through `loadSource()`.
- Exports go through `saveCanvas()`.
- The sketch does not keep independent work running while the tab is hidden.
- App-specific rendering logic remains outside the framework package.
