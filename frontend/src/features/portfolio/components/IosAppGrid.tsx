import { IOS_GRID_APPS, runIosHomeAppAction } from '../iosHomeApps'
import type { DesktopFolderId } from '../desktopTypes'
import iosStyles from '../IosLayout.module.css'
import { IosAppIcon } from './IosAppIcon'

type IosAppGridProps = {
  onOpenApp: (id: DesktopFolderId, sourceEl?: HTMLElement | null) => void
  registerIcon?: (id: DesktopFolderId, el: HTMLElement | null) => void
}

export function IosAppGrid({ onOpenApp, registerIcon }: IosAppGridProps) {
  return (
    <div className={iosStyles.appGrid} role="list" aria-label="Apps">
      {IOS_GRID_APPS.map((app) => {
        const openId = app.action.type === 'open' ? app.action.id : null
        return (
        <button
          key={app.id}
          type="button"
          className={iosStyles.gridItem}
          role="listitem"
          onClick={(e) => {
            const iconEl = e.currentTarget.querySelector('[data-ios-icon]')
            runIosHomeAppAction(app.action, (id) =>
              onOpenApp(id, iconEl instanceof HTMLElement ? iconEl : e.currentTarget),
            )
          }}
          aria-label={app.label}
        >
          <IosAppIcon
            app={app}
            size="grid"
            registerRef={openId ? (el) => registerIcon?.(openId, el) : undefined}
          />
          <span className={iosStyles.gridLabel}>{app.label}</span>
        </button>
        )
      })}
    </div>
  )
}
