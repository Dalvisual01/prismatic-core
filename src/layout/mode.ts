declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface ImportMetaEnv {
    readonly PRISMATIC_LAYOUT_MODE?: string | boolean
  }
}

export function isLayoutMode(): boolean {
  const value = import.meta.env?.PRISMATIC_LAYOUT_MODE
  return value === true || value === "true"
}
