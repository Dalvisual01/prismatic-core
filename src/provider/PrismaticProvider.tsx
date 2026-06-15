import {
  createContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import type { StoreApi, UseBoundStore } from "zustand"
import {
  resolvePrismaticConfig,
  setRuntimeConfig,
  type PrismaticConfig,
} from "../config"
import { prismaticThemeToCssProperties } from "../theme/tokens"
import {
  createPrismaticStore,
  type PrismaticStoreInit,
  type PrismaticStoreState,
} from "../store/createPrismaticStore"

export const PrismaticStoreContext =
  createContext<UseBoundStore<StoreApi<PrismaticStoreState>> | null>(null)

export type PrismaticProviderProps = {
  config?: PrismaticConfig
  storeInit?: PrismaticStoreInit
  children: ReactNode
}

export function PrismaticProvider({
  config,
  storeInit,
  children,
}: PrismaticProviderProps) {
  const resolvedConfig = useMemo(() => resolvePrismaticConfig(config), [config])
  const themeStyle = useMemo(
    () =>
      prismaticThemeToCssProperties(
        resolvedConfig.theme,
        resolvedConfig.themeBlendModes,
      ),
    [resolvedConfig.theme, resolvedConfig.themeBlendModes],
  )

  const store = useMemo(
    () => createPrismaticStore(storeInit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    setRuntimeConfig(resolvedConfig)
  }, [resolvedConfig])

  useEffect(() => {
    const root = document.documentElement
    const previous = new Map<string, string>()

    for (const [cssVar, value] of Object.entries(themeStyle)) {
      previous.set(cssVar, root.style.getPropertyValue(cssVar))
      root.style.setProperty(cssVar, value)
    }

    return () => {
      for (const [cssVar, value] of previous) {
        if (value) root.style.setProperty(cssVar, value)
        else root.style.removeProperty(cssVar)
      }
    }
  }, [themeStyle])

  return (
    <PrismaticStoreContext.Provider value={store}>
      <div className="prismatic-root contents" style={themeStyle}>
        {children}
      </div>
    </PrismaticStoreContext.Provider>
  )
}
