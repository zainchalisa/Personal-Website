import styles from './AppIconImage.module.css'
import type { AppIconSize } from './NativeSquircleIcon'
import { NativeSquircleIcon } from './NativeSquircleIcon'

type AppIconImageProps = {
  src: string
  size?: AppIconSize
  objectPosition?: string
}

export function AppIconImage({
  src,
  size = 'desktop',
  objectPosition = 'center center',
}: AppIconImageProps) {
  return (
    <NativeSquircleIcon size={size}>
      <div className={`${styles.plate} ${styles.platePhoto}`}>
        <img
          className={styles.photo}
          src={src}
          alt=""
          draggable={false}
          style={{ objectPosition }}
        />
      </div>
    </NativeSquircleIcon>
  )
}
