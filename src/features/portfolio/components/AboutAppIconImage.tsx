import { aboutAppIcon } from '../aboutAppIcon'
import type { AppIconSize } from './NativeSquircleIcon'
import { AppIconImage } from './AppIconImage'

type AboutAppIconImageProps = {
  size?: AppIconSize
}

export function AboutAppIconImage({ size = 'desktop' }: AboutAppIconImageProps) {
  return <AppIconImage src={aboutAppIcon} size={size} objectPosition="center 18%" />
}
