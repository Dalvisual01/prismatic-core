import { useContext } from "react"
import type { StoreApi, UseBoundStore } from "zustand"
import { PrismaticStoreContext } from "../provider/PrismaticProvider"
import type { PrismaticStoreState } from "../store/createPrismaticStore"

export function usePrismaticStore(): UseBoundStore<StoreApi<PrismaticStoreState>> {
  const store = useContext(PrismaticStoreContext)
  if (!store) {
    throw new Error("usePrismaticStore must be used within PrismaticProvider")
  }
  return store
}

export function useWorkspaceMode() {
  const useStore = usePrismaticStore()
  return useStore((s) => s.workspaceMode)
}

/** False in workspace mode — use to skip hover/focus/active UI on draggable panels. */
export function usePrismaticInteraction() {
  const workspaceMode = useWorkspaceMode()
  return !workspaceMode
}

export function usePanelPosition(id: string) {
  const useStore = usePrismaticStore()
  return useStore((s) => s.uiPositions[id])
}
