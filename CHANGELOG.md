# Changelog

## 0.2.1 — 2026-06-15

### Added

- `Button` `variant` prop: `"cta"` (default), `"frame"` (stroke-only secondary), `"save"` (filled export CTA)
- `saveButtonBg` prop for custom save ellipse asset (`url("/assets/save-button-bg.svg")` by default on `save`)
- Size constants: `BUTTON_FRAME_WIDTH`, `BUTTON_FRAME_HEIGHT`, `BUTTON_SAVE_WIDTH`, `BUTTON_SAVE_HEIGHT`

### Changed

- Playground button demo shows all three variants side by side

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
