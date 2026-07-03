import type { DesktopFolderId } from '../desktopTypes'
import iosStyles from '../IosLayout.module.css'
import { IosAppGrid } from './IosAppGrid'
import { HomeWidgets } from './HomeWidgets'

type IosHomeScreenProps = {
  onOpenApp: (id: DesktopFolderId, sourceEl?: HTMLElement | null) => void
  registerIcon?: (id: DesktopFolderId, el: HTMLElement | null) => void
}

export function IosHomeScreen({ onOpenApp, registerIcon }: IosHomeScreenProps) {
  return (
    <div className={iosStyles.homeScreen}>
      <HomeWidgets />
      <div className={iosStyles.homeScreenBody}>
        <IosAppGrid onOpenApp={onOpenApp} registerIcon={registerIcon} />
      </div>
    </div>
  )
}
