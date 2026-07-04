import { useEffect } from 'react'
import type { PortfolioTheme } from '../portfolioTheme'
import PhotographyPinboard from '@/features/photography/components/PhotographyPinboard'
import { useIosAppShell } from './IosAppShellContext'
import { TerminalTitleBar } from './TerminalTitleBar'
import { patchPortfolioSession, readPortfolioSession } from '../portfolioSessionState'
import '@/features/photography/photography.css'
import styles from './PhotographyMobile.module.css'

type PhotographyMobileAppProps = {
  theme: PortfolioTheme
  onThemeChange: (theme: PortfolioTheme) => void
}

export function PhotographyMobileApp({ theme, onThemeChange }: PhotographyMobileAppProps) {
  const { requestClose, closeLocked } = useIosAppShell()

  useEffect(() => {
    const session = readPortfolioSession()
    if (!session?.photography?.slideshow) return
    patchPortfolioSession({
      photography: { ...session.photography, slideshow: null },
    })
  }, [])

  return (
    <div
      className={styles.photoMobile}
      data-photo-theme={theme}
      data-portfolio-theme={theme}
    >
      <TerminalTitleBar
        path="~/photography"
        onRedClick={requestClose}
        closeLocked={closeLocked}
        theme={theme}
        onThemeChange={onThemeChange}
      />

      <div className={styles.photoStage}>
        <div className="photography-page" data-theme={theme}>
          <div className="photography-stage">
            <PhotographyPinboard active theme={theme} variant="mobile" />
          </div>
        </div>
      </div>
    </div>
  )
}
