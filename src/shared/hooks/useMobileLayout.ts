import { isMobileDevice } from '@/shared/lib/isMobileDevice'
import { PHONE_LAYOUT_QUERY, useMediaQuery } from './useMediaQuery'

/** Mobile layout: always on iOS & Android phones/tablets; otherwise when viewport is narrow. */
export function useMobileLayout(): boolean {
  const matchesNarrowViewport = useMediaQuery(PHONE_LAYOUT_QUERY)
  return isMobileDevice() || matchesNarrowViewport
}

export function prefersMobileLayout(): boolean {
  if (typeof window === 'undefined') return false
  return isMobileDevice() || window.matchMedia(PHONE_LAYOUT_QUERY).matches
}
