# Changelog

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
