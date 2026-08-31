import type { DesktopWindowId } from './desktopTypes'

export type WindowSize = { width: number; height: number }

/**
 * Minimum window sizes derived from fixed chrome + readable content areas.
 * About: topbar + preview + filter + full timeline stack.
 * Finder: title bar + toolbar + sidebar + at least one grid row of icons.
 */
const WINDOW_MIN_SIZES: Record<DesktopWindowId, WindowSize> = {
  about: { width: 600, height: 420 },
  projects: { width: 920, height: 620 },
  photography: { width: 640, height: 480 },
}

export function getWindowMinSize(id: DesktopWindowId): WindowSize {
  return WINDOW_MIN_SIZES[id]
}
