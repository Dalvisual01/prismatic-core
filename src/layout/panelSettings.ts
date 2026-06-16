import type { AppTitleSize } from "../components/AppTitle"
import {
  getButtonMetrics,
  BUTTON_ELLIPSE_HEIGHT,
  BUTTON_WIDTH_MIN,
  type ButtonSize,
} from "../components/ui/Button"
import { SLIDER_OUTER_HEIGHT } from "../components/ui/Slider"
import {
  imageModulesFromSize,
  imagePreviewSizePx,
} from "../workspace/imageLayout"
import {
  columnCountFromWidth,
  slidersPanelHeightPx,
} from "../workspace/slidersLayout"
import type { PanelId, PanelSize } from "../workspace/types"

export type PanelLayoutSettings = {
  buttonSize?: ButtonSize
  titleSize?: AppTitleSize
  imageModules?: number
  sliderColumns?: number
}

export type PanelSettingsMap = Record<PanelId, PanelLayoutSettings>

export function buttonSizeFromPanelSize(size?: PanelSize): ButtonSize | undefined {
  if (!size) return undefined
  if (size.height >= BUTTON_ELLIPSE_HEIGHT - 8) return "large"
  if (size.height <= SLIDER_OUTER_HEIGHT + 2) {
    return size.width >= BUTTON_WIDTH_MIN - 4 ? "medium" : "small"
  }
  return undefined
}

export function titleSizeFromPanelSize(size?: PanelSize): AppTitleSize | undefined {
  if (!size) return undefined
  return size.height > 40 ? "large" : "small"
}

export function derivePanelSettingsFromSnapshot(
  sizes: Record<PanelId, PanelSize> | undefined,
  sliderCountByPanelId?: Record<PanelId, number>,
): PanelSettingsMap {
  if (!sizes) return {}

  const settings: PanelSettingsMap = {}

  for (const [id, size] of Object.entries(sizes)) {
    const patch: PanelLayoutSettings = {}

    const imageModules = imageModulesFromSize(size.width)
    if (
      size.width === size.height &&
      Math.abs(imagePreviewSizePx(imageModules) - size.width) <= 2
    ) {
      patch.imageModules = imageModules
    }

    const sliderColumns = columnCountFromWidth(size.width)
    const sliderCount = sliderCountByPanelId?.[id] ?? 1
    const expectedSliderHeight = slidersPanelHeightPx(sliderColumns, sliderCount)
    if (
      !patch.imageModules &&
      Math.abs(expectedSliderHeight - size.height) <= 4
    ) {
      patch.sliderColumns = sliderColumns
    }

    const buttonSize = buttonSizeFromPanelSize(size)
    const isButtonHeight = size.height >= 65 && size.height <= 125
    if (!patch.imageModules && !patch.sliderColumns && buttonSize && isButtonHeight) {
      const metrics = getButtonMetrics(buttonSize)
      const expectedHeight = metrics.height
      if (
        Math.abs(size.height - expectedHeight) <= 4 &&
        (buttonSize === "large"
          ? Math.abs(size.width - (metrics.width ?? size.width)) <= 4
          : size.width >= (metrics.minWidth ?? 0) - 8)
      ) {
        patch.buttonSize = buttonSize
      }
    }

    const titleSize = titleSizeFromPanelSize(size)
    if (
      !patch.imageModules &&
      !patch.sliderColumns &&
      !patch.buttonSize &&
      titleSize
    ) {
      patch.titleSize = titleSize
    }

    if (Object.keys(patch).length > 0) {
      settings[id] = patch
    }
  }

  return settings
}
