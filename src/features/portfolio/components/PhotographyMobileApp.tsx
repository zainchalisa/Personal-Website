import type { PortfolioTheme } from '../portfolioTheme'
import PhotographyPinboard from '@/features/photography/components/PhotographyPinboard'
import { useIosAppShell } from './IosAppShellContext'
import { TerminalTitleBar } from './TerminalTitleBar'
import '@/features/photography/photography.css'
import styles from './PhotographyMobile.module.css'

type PhotographyMobileAppProps = {
  theme: PortfolioTheme
}

export function PhotographyMobileApp({ theme }: PhotographyMobileAppProps) {
  const { requestClose, closeLocked } = useIosAppShell()

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
