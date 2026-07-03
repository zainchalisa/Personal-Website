import { photographyAppIcon } from '../photographyAppIcon'
import type { AppIconSize } from './NativeSquircleIcon'
import { AppIconImage } from './AppIconImage'

type PhotographyAppIconImageProps = {
  size?: AppIconSize
}

export function PhotographyAppIconImage({ size = 'desktop' }: PhotographyAppIconImageProps) {
  return <AppIconImage src={photographyAppIcon} size={size} objectPosition="center 35%" />
}
