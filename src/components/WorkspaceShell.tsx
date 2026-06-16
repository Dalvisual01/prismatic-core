import type { ReactNode } from "react"
import { usePrismaticStore } from "../hooks/usePrismaticStore"
import { WorkspaceDebugOverlay } from "./WorkspaceDebugOverlay"

export type WorkspaceShellProps = {
  children: ReactNode
  showDebugOverlay?: boolean
}

export function WorkspaceShell({
  children,
  showDebugOverlay = true,
}: WorkspaceShellProps) {
  const useStore = usePrismaticStore()
  const workspaceMode = useStore((s) => s.workspaceMode)

  return (
    <div
      data-workspace-mode={workspaceMode ? "" : undefined}
      className={`pointer-events-none fixed inset-0 ${workspaceMode ? "z-30" : "z-10"}`}
    >
      {children}
      {showDebugOverlay && <WorkspaceDebugOverlay />}
    </div>
  )
}
