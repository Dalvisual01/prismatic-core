import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { prismaticLayoutPlugin } from "./src/vite/prismaticLayoutPlugin"

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const layoutFile = path.resolve(rootDir, "dev/layout.ts")

export default defineConfig(({ mode }) => {
  const layoutMode = mode === "layout"

  return {
    plugins: [
      react(),
      tailwindcss(),
      layoutMode &&
        prismaticLayoutPlugin({
          layoutFile,
        }),
    ].filter(Boolean),
    root: path.resolve(rootDir, "dev"),
    resolve: {
      alias: {
        "@prismatic/core": path.resolve(rootDir, "src/index.ts"),
      },
    },
    define: {
      "import.meta.env.PRISMATIC_LAYOUT_MODE": JSON.stringify(layoutMode),
    },
    server: {
      port: layoutMode ? 5174 : 5173,
      open: true,
    },
  }
})
