import desktopStyles from '../Desktop.module.css'
import { AboutAppIconImage } from './AboutAppIconImage'
import { PhotographyAppIconImage } from './PhotographyAppIconImage'
import { ProjectsAppIcon } from './GradientAppIcon'

export type DesktopAppVariant = 'about' | 'photography' | 'projects'

type DesktopAppProps = {
  label: string
  selected: boolean
  variant?: DesktopAppVariant
  onSelect: () => void
  onOpen: () => void
}

export function DesktopApp({
  label,
  selected,
  variant = 'about',
  onSelect,
  onOpen,
}: DesktopAppProps) {
  return (
    <button
      type="button"
      className={`${desktopStyles.desktopItem}${selected ? ` ${desktopStyles.desktopItemSelected}` : ''}`}
      onClick={onSelect}
      onDoubleClick={onOpen}
      aria-label={`${label} application`}
    >
      <div className={desktopStyles.appIcon} aria-hidden>
        {variant === 'about' ? (
          <AboutAppIconImage size="desktop" />
        ) : variant === 'photography' ? (
          <PhotographyAppIconImage size="desktop" />
        ) : (
          <ProjectsAppIcon size="desktop" />
        )}
      </div>
      <span className={desktopStyles.desktopItemLabel}>{label}</span>
    </button>
  )
}
