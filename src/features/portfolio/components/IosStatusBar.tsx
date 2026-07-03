import { useEffect, useState } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import type { PortfolioTheme } from '../portfolioTheme'
import iosStyles from '../IosLayout.module.css'
import { IosStatusIndicators } from './IosStatusIndicators'

function formatStatusTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

type IosStatusBarProps = {
  theme: PortfolioTheme
  onThemeChange: (theme: PortfolioTheme) => void
  variant?: 'home' | 'app'
}

export function IosStatusBar({ theme, onThemeChange, variant = 'home' }: IosStatusBarProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className={`${iosStyles.statusBar}${variant === 'app' ? ` ${iosStyles.statusBarApp}` : ''}`}
      aria-label="Status bar"
    >
      <span className={iosStyles.statusTime}>{formatStatusTime(now)}</span>
      <div className={iosStyles.statusRight}>
        <button
          type="button"
          className={iosStyles.statusThemeBtn}
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'light' ? <IconSun aria-hidden /> : <IconMoon aria-hidden />}
        </button>
        <IosStatusIndicators />
      </div>
    </header>
  )
}
