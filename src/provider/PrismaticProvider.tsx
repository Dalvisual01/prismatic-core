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

  const store = useMemo(
    () => createPrismaticStore(storeInit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    setRuntimeConfig(resolvedConfig)
  }, [resolvedConfig])

  return (
    <PrismaticStoreContext.Provider value={store}>
      {children}
    </PrismaticStoreContext.Provider>
  )
}
