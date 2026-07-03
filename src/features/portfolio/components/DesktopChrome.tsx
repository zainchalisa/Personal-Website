import { useEffect, useState } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import desktopStyles from '../Desktop.module.css'
import type { PortfolioTheme } from '../portfolioTheme'
import { DeviceBatteryIndicator } from '@/shared/components/DeviceBatteryIndicator'
import { SITE_OWNER_FULL_NAME } from '@/shared/config/siteIdentity'
import { SOCIAL_LINKS } from '@/shared/config/socialLinkItems'

function formatMenuTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function DesktopMenuBar({
  theme,
  onThemeChange,
}: {
  theme: PortfolioTheme
  onThemeChange: (theme: PortfolioTheme) => void
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className={desktopStyles.menuBar}>
      <div className={desktopStyles.menuBarLeft}>
        <span className={desktopStyles.menuPear} aria-hidden>
          🍐
        </span>
        <span className={desktopStyles.menuBrand}>{SITE_OWNER_FULL_NAME}</span>
      </div>

      <div className={desktopStyles.menuBarRight}>
        <nav className={desktopStyles.menuConnect} aria-label="Contact links">
          {SOCIAL_LINKS.map(({ id, label, path, Icon, external }) => (
            <a
              key={id}
              className={desktopStyles.menuSocialLink}
              href={path}
              aria-label={label}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <Icon />
              <span className={desktopStyles.menuSocialLabel}>{label}</span>
            </a>
          ))}
        </nav>

        <div className={desktopStyles.menuDivider} aria-hidden />

        <div className={desktopStyles.menuSystem} aria-label="System status">
          <button
            type="button"
            className={desktopStyles.themeBtn}
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'light' ? <IconSun aria-hidden /> : <IconMoon aria-hidden />}
          </button>
          <DeviceBatteryIndicator />
          <span className={desktopStyles.menuTime}>{formatMenuTime(now)}</span>
        </div>
      </div>
    </header>
  )
}
