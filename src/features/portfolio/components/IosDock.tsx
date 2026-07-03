import { IOS_DOCK_APPS, runIosHomeAppAction } from '../iosHomeApps'
import type { DesktopFolderId } from '../desktopTypes'
import iosStyles from '../IosLayout.module.css'
import { IosAppIcon } from './IosAppIcon'

type IosDockProps = {
  onOpenApp: (id: DesktopFolderId, sourceEl?: HTMLElement | null) => void
  registerIcon?: (id: DesktopFolderId, el: HTMLElement | null) => void
}

export function IosDock({ onOpenApp, registerIcon }: IosDockProps) {
  return (
    <nav className={iosStyles.dock} aria-label="Dock">
      {IOS_DOCK_APPS.map((app) => {
        const openId = app.action.type === 'open' ? app.action.id : null
        return (
        <button
          key={app.id}
          type="button"
          className={iosStyles.dockItem}
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
            size="dock"
            registerRef={openId ? (el) => registerIcon?.(openId, el) : undefined}
          />
        </button>
        )
      })}
    </nav>
  )
}
