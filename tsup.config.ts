import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom", "react/jsx-runtime", "zustand", "p5"],
    treeshake: true,
  },
  {
    entry: ["src/vite/prismaticLayoutPlugin.ts"],
    outDir: "dist/vite",
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    platform: "node",
    external: ["vite"],
    treeshake: true,
  },
])
