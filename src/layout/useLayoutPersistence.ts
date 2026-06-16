import { useCallback, useRef, useState } from "react"
import type { StoreApi, UseBoundStore } from "zustand"
import type { PrismaticStoreState } from "../store/createPrismaticStore"
import { createLayoutSnapshot } from "./snapshot"

export type LayoutPersistenceStatus = "idle" | "saving" | "saved" | "error"

export type UseLayoutPersistenceOptions = {
  endpoint?: string
}

const DEFAULT_ENDPOINT = "/__prismatic/save-layout"

export function useLayoutPersistence(
  useStore: UseBoundStore<StoreApi<PrismaticStoreState>>,
  { endpoint = DEFAULT_ENDPOINT }: UseLayoutPersistenceOptions = {},
) {
  const [status, setStatus] = useState<LayoutPersistenceStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveLayout = useCallback(async () => {
    const state = useStore.getState()
    const snapshot = createLayoutSnapshot(state)

    setStatus("saving")
    setError(null)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error ?? `Save failed (${response.status})`)
      }

      setStatus("saved")
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => {
        setStatus("idle")
        savedTimerRef.current = null
      }, 1500)
    } catch (cause) {
      setStatus("error")
      setError(cause instanceof Error ? cause.message : "Failed to save layout")
    }
  }, [endpoint, useStore])

  return { status, error, saveLayout }
}
