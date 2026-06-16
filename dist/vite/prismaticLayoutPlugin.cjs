'use strict';

var fs = require('fs');
var path = require('path');
var react = require('react');
require('react/jsx-runtime');
require('zustand');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var fs__default = /*#__PURE__*/_interopDefault(fs);
var path__default = /*#__PURE__*/_interopDefault(path);

// src/vite/prismaticLayoutPlugin.ts

// src/theme/tokens.ts
function deriveDefaultMuted(surface, foreground, background) {
  const dark = isDarkColor(background);
  return mixColors(surface, foreground, dark ? 0.08 : 0.12);
}
var DEFAULT_PRISMATIC_PALETTE = {
  background: "#141316",
  surface: "rgb(36, 35, 38)",
  foreground: "#ffffff",
  accent: "#e1e1e1",
  onAccent: "#000000",
  muted: deriveDefaultMuted("rgb(36, 35, 38)", "#ffffff", "#141316")
};
var DEFAULT_PRISMATIC_PALETTE_BLEND_MODES = {
  background: "normal",
  surface: "normal",
  foreground: "normal",
  accent: "normal",
  onAccent: "normal",
  muted: "normal"
};
function clampChannel(value) {
  return Math.min(255, Math.max(0, value));
}
function parseColor(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const normalized = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.padEnd(6, "0").slice(0, 6);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] != null ? Number(rgbMatch[4]) : 1
    };
  }
  return { r: 20, g: 19, b: 22, a: 1 };
}
function colorToRgbaString({ r, g, b, a }) {
  const channels = [r, g, b].map((channel) => Math.round(channel));
  return a < 1 ? `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${a})` : `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}
function withAlpha(color, alpha) {
  const { r, g, b } = parseColor(color);
  return colorToRgbaString({ r, g, b, a: alpha });
}
function mixColors(a, b, amount) {
  const left = parseColor(a);
  const right = parseColor(b);
  const t = Math.min(1, Math.max(0, amount));
  return colorToRgbaString({
    r: left.r + (right.r - left.r) * t,
    g: left.g + (right.g - left.g) * t,
    b: left.b + (right.b - left.b) * t,
    a: left.a + (right.a - left.a) * t
  });
}
function shadeColor(color, amount) {
  const { r, g, b, a } = parseColor(color);
  const factor = 1 + amount;
  return colorToRgbaString({
    r: clampChannel(r * factor),
    g: clampChannel(g * factor),
    b: clampChannel(b * factor),
    a
  });
}
function colorLuminance(color) {
  const { r, g, b } = parseColor(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function contrastOn(color) {
  return colorLuminance(color) > 0.55 ? "#000000" : "#ffffff";
}
function isDarkColor(color) {
  return colorLuminance(color) < 0.5;
}
function resolvePrismaticPalette(palette) {
  const resolved = {
    ...DEFAULT_PRISMATIC_PALETTE,
    ...palette
  };
  if (palette?.onAccent == null && palette?.accent != null) {
    resolved.onAccent = contrastOn(resolved.accent);
  }
  if (palette?.muted == null) {
    resolved.muted = deriveDefaultMuted(
      resolved.surface,
      resolved.foreground,
      resolved.background
    );
  }
  return resolved;
}
function resolvePrismaticPaletteBlendModes(blendModes) {
  return {
    ...DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
    ...blendModes
  };
}
function deriveThemeFromPalette(palette) {
  const dark = isDarkColor(palette.background);
  return {
    appBackground: palette.background,
    canvasBackground: shadeColor(palette.background, dark ? -0.06 : -0.04),
    surface: palette.surface,
    surfaceMuted: palette.muted,
    surfaceActive: palette.accent,
    borderSubtle: withAlpha(palette.foreground, 0.1),
    textPrimary: withAlpha(palette.foreground, 0.9),
    textMuted: withAlpha(palette.foreground, 0.85),
    textOnActive: palette.onAccent,
    accentStroke: palette.foreground,
    overlayBackground: withAlpha(
      dark ? palette.background : palette.foreground,
      dark ? 0.75 : 0.72
    ),
    gridLine: withAlpha(palette.foreground, 0.05),
    imageMetaBackground: withAlpha(palette.foreground, dark ? 0.12 : 0.08),
    imageMetaBackgroundHover: withAlpha(palette.foreground, dark ? 0.28 : 0.16)
  };
}
function deriveBlendModesFromPalette(paletteBlendModes) {
  return {
    appBackground: paletteBlendModes.background,
    canvasBackground: paletteBlendModes.background,
    surface: paletteBlendModes.surface,
    surfaceMuted: paletteBlendModes.muted,
    surfaceActive: paletteBlendModes.accent,
    borderSubtle: paletteBlendModes.foreground,
    textPrimary: "normal",
    textMuted: "normal",
    textOnActive: "normal",
    accentStroke: paletteBlendModes.foreground,
    overlayBackground: paletteBlendModes.background,
    gridLine: "normal",
    imageMetaBackground: paletteBlendModes.surface,
    imageMetaBackgroundHover: paletteBlendModes.surface
  };
}
var DEFAULT_PRISMATIC_THEME = deriveThemeFromPalette(
  DEFAULT_PRISMATIC_PALETTE
);
var DEFAULT_PRISMATIC_THEME_BLEND_MODES = deriveBlendModesFromPalette(
  DEFAULT_PRISMATIC_PALETTE_BLEND_MODES
);
function isExplicitThemeInput(theme) {
  return false;
}
function isPaletteThemeInput(theme) {
  return false;
}
function normalizeThemeInput(theme) {
  if (isPaletteThemeInput()) {
    const palette2 = resolvePrismaticPalette(theme.palette);
    const paletteBlendModes2 = resolvePrismaticPaletteBlendModes(
      theme.paletteBlendModes
    );
    return {
      palette: palette2,
      paletteBlendModes: paletteBlendModes2,
      colors: deriveThemeFromPalette(palette2),
      blendModes: deriveBlendModesFromPalette(paletteBlendModes2)
    };
  }
  if (isExplicitThemeInput()) {
    const colors = {
      ...DEFAULT_PRISMATIC_THEME,
      ...theme.colors
    };
    const blendModes = {
      ...DEFAULT_PRISMATIC_THEME_BLEND_MODES,
      ...theme.blendModes
    };
    return {
      palette: DEFAULT_PRISMATIC_PALETTE,
      paletteBlendModes: DEFAULT_PRISMATIC_PALETTE_BLEND_MODES,
      colors,
      blendModes
    };
  }
  const palette = DEFAULT_PRISMATIC_PALETTE;
  const paletteBlendModes = DEFAULT_PRISMATIC_PALETTE_BLEND_MODES;
  return {
    palette,
    paletteBlendModes,
    colors: deriveThemeFromPalette(palette),
    blendModes: deriveBlendModesFromPalette(paletteBlendModes)
  };
}
normalizeThemeInput();
react.createContext(null);

// src/layout/snapshot.ts
function formatLayoutModule(snapshot) {
  const body = JSON.stringify(snapshot, null, 2);
  return [
    `import type { PrismaticLayoutSnapshot } from "@prismatic/core"`,
    ``,
    `/** Auto-generated by \`npm run layout\`. Edits here become the default layout for dev and build. */`,
    `export const PRISMATIC_LAYOUT: PrismaticLayoutSnapshot = ${body}`,
    ``
  ].join("\n");
}

// src/vite/prismaticLayoutPlugin.ts
var DEFAULT_ENDPOINT = "/__prismatic/save-layout";
function prismaticLayoutPlugin(options) {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const layoutFile = path__default.default.resolve(options.layoutFile);
  return {
    name: "prismatic-layout",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || req.url !== endpoint) {
          next();
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            const snapshot = JSON.parse(body);
            fs__default.default.mkdirSync(path__default.default.dirname(layoutFile), { recursive: true });
            fs__default.default.writeFileSync(layoutFile, formatLayoutModule(snapshot), "utf8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, file: layoutFile }));
          } catch (cause) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                ok: false,
                error: cause instanceof Error ? cause.message : String(cause)
              })
            );
          }
        });
      });
    }
  };
}

exports.prismaticLayoutPlugin = prismaticLayoutPlugin;
//# sourceMappingURL=prismaticLayoutPlugin.cjs.map
//# sourceMappingURL=prismaticLayoutPlugin.cjs.map