import type { IosHomeApp } from '../iosHomeApps'
import { AboutAppIconImage } from './AboutAppIconImage'
import { GradientAppIcon, type GradientIconTone } from './GradientAppIcon'
import { PhotographyAppIconImage } from './PhotographyAppIconImage'

const GRADIENT_TONE: Partial<Record<string, GradientIconTone>> = {
  projects: 'projects',
  github: 'github',
  linkedin: 'linkedin',
  mail: 'mail',
}

type IosAppIconProps = {
  app: IosHomeApp
  size?: 'grid' | 'dock'
  registerRef?: (el: HTMLDivElement | null) => void
}

export function IosAppIcon({ app, size = 'grid', registerRef }: IosAppIconProps) {
  const iconSize = size === 'dock' ? 'iosDock' : 'iosGrid'

  if (app.id === 'about') {
    return (
      <div ref={registerRef} data-ios-icon>
        <AboutAppIconImage size={iconSize} />
      </div>
    )
  }

  if (app.id === 'photography') {
    return (
      <div ref={registerRef} data-ios-icon>
        <PhotographyAppIconImage size={iconSize} />
      </div>
    )
  }

  const tone = GRADIENT_TONE[app.id]
  if (!tone) return null

  return (
    <div ref={registerRef} data-ios-icon>
      <GradientAppIcon
        size={iconSize}
        tone={tone}
        Icon={app.Icon}
        Mark={app.Mark}
      />
    </div>
  )
}
