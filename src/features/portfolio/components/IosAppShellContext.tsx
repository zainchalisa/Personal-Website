import { createContext, useContext } from 'react'

type IosAppShellContextValue = {
  requestClose: () => void
  closeLocked: boolean
}

export const IosAppShellContext = createContext<IosAppShellContextValue | null>(null)

export function useIosAppShell() {
  const ctx = useContext(IosAppShellContext)
  if (!ctx) {
    throw new Error('useIosAppShell must be used within PortfolioPhoneLayout')
  }
  return ctx
}
