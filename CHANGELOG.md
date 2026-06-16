# Changelog

## 0.2.2 — 2026-06-16

### Added

- Squircle corner utility classes in `style.css`: `prismatic-corners`, `prismatic-corners-inner`, `prismatic-corners-inner-sm`, `prismatic-corners-canvas-frame`
- Exported `PRISMATIC_CORNERS_*` class name constants for custom UI

### Changed

- `ImageComponent` filename container uses `prismatic-corners-inner` (same squircle preset as sliders)
- `CreativeCanvas` frame and canvas use squircle corner utilities
- `Slider` uses the shared corner utilities instead of pairing Tailwind `rounded-*` with `prismatic-squircle`

## 0.2.1 — 2026-06-15

### Added

- `colorMode` on `PrismaticConfig` — built-in `"default"` (dark) and `"sand"` (light warm) palettes
- `PRISMATIC_COLOR_MODES` and `PRISMATIC_COLOR_MODE_THEMES` exports
- `useImagePanelSize()` hook — `ImageComponent` auto-sizes when rendered inside `ImagePanel`
- Default slider line SVG assets; `lineTopSrc` / `lineBottomSrc` props are now optional
- Squircle corner shape (`prismatic-squircle`) and updated radius tokens (`--radius`, `--radius-inner`, `--radius-inner-sm`)

### Changed

- `ImagePanel` syncs its size to the workspace store and provides size context to children
- `SlidersPanel` panel height follows actual slider count instead of a fixed default
- Playground theme controls simplified to colour-mode picker
- README theming docs updated for `colorMode` workflow

### Deprecated

- `PRISMATIC_THEME_PRESETS` — use `PRISMATIC_COLOR_MODES` and `colorMode` instead

## 0.2.0 — 2026-06-15

### Added

- **Theming system** — configure 6 palette colours; Prismatic derives all UI tokens (text, borders, overlays, blend modes)
- `theme.palette` and `theme.paletteBlendModes` on `PrismaticConfig`
- Theme utilities: `parseColor`, `getRuntimeTheme`, `formatPrismaticThemeCss`, `PRISMATIC_THEME_PRESETS`
- CSS custom properties and `prismatic-*` utility classes in `style.css`
- `ButtonEllipseVisual` component and ellipse-based `Button` (replaces SVG background asset)
- Component playground (`npm run dev:playground`) for live theme tuning and UI preview

### Changed

- All workspace UI components use theme tokens instead of hardcoded colours
- `WorkspaceShell` stays at `z-30` so panels remain interactive outside workspace mode
- `Button` API simplified — removed `variant` and `saveButtonBg` props

## 0.1.0 — 2026-06-10

Initial release extracted from pic-stretch.

### Added

- `PrismaticProvider` + `createPrismaticStore` for workspace layout state
- `PrismaticConfig` — margins, module grid, snap threshold, canvas zoom, shortcuts
- `CreativeCanvas` — p5 mount shell with workspace pan/zoom, optional spotlight mask
- `WorkspaceShell`, `WorkspacePanel`, snap debug overlay
- `ImagePanel`, `SlidersPanel`, `FloatingHelp` auto-placement
- UI primitives: `Slider`, `Button`, `Radio`, `ImageComponent`
- Workspace engine: edge snap, distribution guides, collision resolution, canvas snap
- Layout helpers: `imageLayout`, `slidersLayout`, `createGridLayout`

### Migration

pic-stretch now depends on this package via `file:../prismatic-core`. App-specific shader logic, presets, and default layout remain in the app.
