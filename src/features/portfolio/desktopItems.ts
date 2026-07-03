import type { DesktopFolderId } from './desktopTypes'
import type { DesktopAppVariant } from './components/DesktopApp'

export type DesktopItemConfig =
  | { id: DesktopFolderId; label: string; kind: 'app'; variant: DesktopAppVariant }

export const DESKTOP_ITEMS: DesktopItemConfig[] = [
  { id: 'about', label: 'About', kind: 'app', variant: 'about' },
  { id: 'projects', label: 'Projects', kind: 'app', variant: 'projects' },
  { id: 'photography', label: 'Photography', kind: 'app', variant: 'photography' },
]

export const IOS_APP_TITLES: Record<DesktopFolderId, string> = {
  about: 'About',
  projects: 'Projects',
  photography: 'Photography',
}
