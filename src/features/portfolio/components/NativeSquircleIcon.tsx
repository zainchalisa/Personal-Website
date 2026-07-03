import type { ReactNode } from 'react'
import styles from './AppIconImage.module.css'

export type AppIconSize = 'desktop' | 'iosGrid' | 'iosDock'

const SIZE_CLASS: Record<AppIconSize, string> = {
  desktop: styles.sizeDesktop,
  iosGrid: styles.sizeIosGrid,
  iosDock: styles.sizeIosDock,
}

type NativeSquircleIconProps = {
  size?: AppIconSize
  children: ReactNode
}

export function NativeSquircleIcon({ size = 'desktop', children }: NativeSquircleIconProps) {
  return (
    <div className={`${styles.nativeIcon} ${SIZE_CLASS[size]}`}>
      {children}
      <div className={styles.gloss} aria-hidden />
      <div className={styles.rim} aria-hidden />
    </div>
  )
}
