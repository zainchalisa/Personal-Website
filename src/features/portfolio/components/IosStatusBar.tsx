import { IconMoon, IconSun } from '@tabler/icons-react'
import type { PortfolioTheme } from '../portfolioTheme'
import iosStyles from '../IosLayout.module.css'
import { IosStatusIndicators } from './IosStatusIndicators'

type IosStatusBarProps = {
  theme: PortfolioTheme
  onThemeChange: (theme: PortfolioTheme) => void
}

export function IosStatusBar({ theme, onThemeChange }: IosStatusBarProps) {
  return (
    <header className={iosStyles.statusBar} aria-label="Status bar">
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
