import type { Icon } from '@tabler/icons-react'
import type { ComponentType } from 'react'
import styles from './AppIconImage.module.css'
import type { AppIconSize } from './NativeSquircleIcon'
import { NativeSquircleIcon } from './NativeSquircleIcon'
import { TerminalMark } from './TerminalMark'

type IosMarkComponent = ComponentType<{ className?: string; tone?: 'light' | 'muted' }>

export type GradientIconTone = 'projects' | 'github' | 'linkedin' | 'mail'

const GRADIENT_CLASS: Record<GradientIconTone, string> = {
  projects: styles.gradientProjects,
  github: styles.gradientGithub,
  linkedin: styles.gradientLinkedin,
  mail: styles.gradientMail,
}

type GradientAppIconProps = {
  size?: AppIconSize
  tone: GradientIconTone
  Icon?: Icon
  Mark?: IosMarkComponent
}

export function GradientAppIcon({ size = 'desktop', tone, Icon, Mark }: GradientAppIconProps) {
  return (
    <NativeSquircleIcon size={size}>
      <div className={`${styles.plate} ${GRADIENT_CLASS[tone]}`}>
        <div className={styles.glyph}>
          {Mark ? (
            <Mark
              className={styles.markTerminal}
              tone="light"
            />
          ) : Icon ? (
            <Icon stroke={1.75} aria-hidden />
          ) : null}
        </div>
      </div>
    </NativeSquircleIcon>
  )
}

type ProjectsAppIconProps = {
  size?: AppIconSize
}

export function ProjectsAppIcon({ size = 'desktop' }: ProjectsAppIconProps) {
  return <GradientAppIcon size={size} tone="projects" Mark={TerminalMark} />
}
