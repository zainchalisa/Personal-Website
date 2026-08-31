import type { ComponentType } from 'react'
import type { Icon } from '@tabler/icons-react'
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconMail,
} from '@tabler/icons-react'
import type { DesktopFolderId } from './desktopTypes'
import { SOCIAL_LINK_PATHS } from '@/config/socialLinks'
import { TerminalMark } from './components/TerminalMark'

type IosMarkComponent = ComponentType<{ className?: string; tone?: 'light' | 'muted' }>

type IosIconGradient =
  | 'about'
  | 'projects'
  | 'photography'
  | 'github'
  | 'linkedin'
  | 'mail'

export type IosHomeAppAction =
  | { type: 'open'; id: DesktopFolderId }
  | { type: 'link'; href: string; external: boolean }

export type IosHomeApp = {
  id: string
  label: string
  Icon?: Icon
  Mark?: IosMarkComponent
  gradient: IosIconGradient
  action: IosHomeAppAction
}

const socialById = Object.fromEntries(SOCIAL_LINK_PATHS.map((link) => [link.id, link])) as Record<
  'github' | 'linkedin' | 'email',
  (typeof SOCIAL_LINK_PATHS)[number]
>

export const IOS_GRID_APPS: IosHomeApp[] = [
  {
    id: 'about',
    label: 'About',
    gradient: 'about',
    action: { type: 'open', id: 'about' },
  },
  {
    id: 'projects',
    label: 'Projects',
    Mark: TerminalMark,
    gradient: 'projects',
    action: { type: 'open', id: 'projects' },
  },
  {
    id: 'photography',
    label: 'Photography',
    gradient: 'photography',
    action: { type: 'open', id: 'photography' },
  },
  {
    id: 'github',
    label: 'GitHub',
    Icon: IconBrandGithub,
    gradient: 'github',
    action: {
      type: 'link',
      href: socialById.github.path,
      external: socialById.github.external,
    },
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: IconBrandLinkedin,
    gradient: 'linkedin',
    action: {
      type: 'link',
      href: socialById.linkedin.path,
      external: socialById.linkedin.external,
    },
  },
  {
    id: 'mail',
    label: 'Mail',
    Icon: IconMail,
    gradient: 'mail',
    action: {
      type: 'link',
      href: socialById.email.path,
      external: socialById.email.external,
    },
  },
]

const IOS_DOCK_APP_IDS = ['about', 'projects', 'photography'] as const

export const IOS_DOCK_APPS = IOS_DOCK_APP_IDS.map(
  (id) => IOS_GRID_APPS.find((app) => app.id === id)!,
)

export function runIosHomeAppAction(
  action: IosHomeAppAction,
  onOpenApp: (id: DesktopFolderId) => void,
) {
  if (action.type === 'open') {
    onOpenApp(action.id)
    return
  }

  if (action.external) {
    window.open(action.href, '_blank', 'noopener,noreferrer')
    return
  }

  // mailto: must use same-tab navigation so iOS/Android open the system mail app.
  window.location.assign(action.href)
}
