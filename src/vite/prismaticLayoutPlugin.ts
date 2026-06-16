/// <reference types="node" />

import fs from "node:fs"
import path from "node:path"
import type { Plugin } from "vite"
import { formatLayoutModule, type PrismaticLayoutSnapshot } from "../layout/snapshot"

export type PrismaticLayoutPluginOptions = {
  /** Absolute path to the layout module that dev/build should import. */
  layoutFile: string
  /** POST endpoint used by layout mode persistence. */
  endpoint?: string
}

const DEFAULT_ENDPOINT = "/__prismatic/save-layout"

export function prismaticLayoutPlugin(
  options: PrismaticLayoutPluginOptions,
): Plugin {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT
  const layoutFile = path.resolve(options.layoutFile)

  return {
    name: "prismatic-layout",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || req.url !== endpoint) {
          next()
          return
        }

        let body = ""
        req.on("data", (chunk) => {
          body += chunk
        })
        req.on("end", () => {
          try {
            const snapshot = JSON.parse(body) as PrismaticLayoutSnapshot
            fs.mkdirSync(path.dirname(layoutFile), { recursive: true })
            fs.writeFileSync(layoutFile, formatLayoutModule(snapshot), "utf8")
            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ ok: true, file: layoutFile }))
          } catch (cause) {
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                ok: false,
                error: cause instanceof Error ? cause.message : String(cause),
              }),
            )
          }
        })
      })
    },
  }
}
