import { useEffect, type ReactNode } from 'react'
import { IconChevronLeft } from '@tabler/icons-react'
import type { PortfolioTheme } from '../portfolioTheme'
import iosStyles from '../IosLayout.module.css'
import { IosStatusBar } from './IosStatusBar'

type IosAppPushProps = {
  title: string
  theme: PortfolioTheme
  onThemeChange: (theme: PortfolioTheme) => void
  onClose: () => void
  closeDisabled?: boolean
  hideNav?: boolean
  children: ReactNode
}

export function IosAppPush({
  title,
  theme,
  onThemeChange,
  onClose,
  closeDisabled = false,
  hideNav = false,
  children,
}: IosAppPushProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className={iosStyles.appPush} role="dialog" aria-label={title || 'App'}>
      <IosStatusBar theme={theme} onThemeChange={onThemeChange} variant="app" />
      {!hideNav && (
        <header className={iosStyles.appPushNav}>
          <button
            type="button"
            className={iosStyles.appPushBack}
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Back to home"
          >
            <IconChevronLeft aria-hidden />
          </button>
          <h1 className={iosStyles.appPushTitle}>{title}</h1>
        </header>
      )}
      <main className={iosStyles.appPushContent}>{children}</main>
    </div>
  )
}
