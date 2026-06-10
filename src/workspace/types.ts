export type PanelId = string

export type PixelPosition = {
  x: number
  y: number
}

export type PanelSize = {
  width: number
  height: number
}

export type PanelRect = PixelPosition & PanelSize

/** @deprecated Use PanelId */
export type UiGroupId = PanelId

/** @deprecated Use PanelSize */
export type UiGroupSize = PanelSize

/** @deprecated Use PanelRect */
export type UiGroupRect = PanelRect
