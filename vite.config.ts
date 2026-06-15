import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: path.resolve(rootDir, "dev"),
  resolve: {
    alias: {
      "@prismatic/core": path.resolve(rootDir, "src/index.ts"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
