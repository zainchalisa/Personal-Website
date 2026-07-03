import type { AboutView } from './aboutContent'
import type { DesktopFolderId, DesktopWindowId } from './desktopTypes'
import type { PortfolioTheme } from './portfolioTheme'
import type { BoardRegionId } from '@/features/photography/components/pinboardData'

const STORAGE_KEY = 'portfolio-session-v1'

export type WindowPosition = { x: number; y: number }
export type WindowSize = { width: number; height: number }

export type PhotographySessionSlice = {
  activeRegionId: BoardRegionId | null
  cam: { x: number; y: number; tX: number; tY: number }
  zoom: { scale: number; tScale: number }
  slideshow: {
    country: string
    slideIndex: number
    slideDirection: 1 | -1
  } | null
}

export type AboutSessionSlice = {
  view: AboutView
  activeMovieIdx: number | null
  activeMusicIdx: number | null
  activePlaceIdx: number | null
}

export type ProjectsSessionSlice = {
  selectedProjectSlug: string | null
}

export type PortfolioSessionV1 = {
  v: 1
  openWindows: Record<DesktopWindowId, boolean>
  focusedWindow: DesktopWindowId | null
  selectedFolder: DesktopFolderId | null
  zOrder: DesktopWindowId[]
  theme?: PortfolioTheme
  windows?: {
    positions: Partial<Record<DesktopWindowId, WindowPosition>>
    sizes: Partial<Record<DesktopWindowId, WindowSize>>
    minimized: Partial<Record<DesktopWindowId, boolean>>
    maximized: Partial<Record<DesktopWindowId, boolean>>
  }
  photography?: PhotographySessionSlice
  about?: AboutSessionSlice
  projects?: ProjectsSessionSlice
}

const CLOSED_WINDOWS: Record<DesktopWindowId, boolean> = {
  about: false,
  projects: false,
  photography: false,
}

export function readPortfolioSession(): PortfolioSessionV1 | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PortfolioSessionV1
    if (parsed?.v !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function writePortfolioSession(next: PortfolioSessionV1): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* private mode / quota */
  }
}

export function patchPortfolioSession(
  patch: Partial<Omit<PortfolioSessionV1, 'v'>>,
): void {
  const current = readPortfolioSession()
  writePortfolioSession({
    v: 1,
    openWindows: current?.openWindows ?? CLOSED_WINDOWS,
    focusedWindow: current?.focusedWindow ?? null,
    selectedFolder: current?.selectedFolder ?? null,
    zOrder: current?.zOrder ?? [],
    ...current,
    ...patch,
  })
}

export function flushPortfolioSession(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    sessionStorage.setItem(STORAGE_KEY, raw)
  } catch {
    /* noop */
  }
}
