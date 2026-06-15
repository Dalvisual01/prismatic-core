import type { ReactNode } from "react"
import { WorkspaceDebugOverlay } from "./WorkspaceDebugOverlay"

export type WorkspaceShellProps = {
  children: ReactNode
  showDebugOverlay?: boolean
}

export function WorkspaceShell({
  children,
  showDebugOverlay = true,
}: WorkspaceShellProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {children}
      {showDebugOverlay && <WorkspaceDebugOverlay />}
    </div>
  )
}
