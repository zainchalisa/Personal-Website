import { useEffect } from 'react'
import { preloadNearbySlideshowPhotos } from './photographyPreload'
import type { PinboardPhoto } from './photographyPhotos'

type UseSlideshowImagesOptions = {
  active?: boolean
}

/**
 * Keeps a sliding window of decoded slideshow images around `index`.
 * Current ± neighbors are warmed asynchronously; the rest of the album is not.
 */
export function useSlideshowImages(
  photos: readonly PinboardPhoto[] | null | undefined,
  index: number,
  options?: UseSlideshowImagesOptions,
): void {
  const active = options?.active ?? true

  useEffect(() => {
    if (!active || !photos || photos.length === 0) return
    preloadNearbySlideshowPhotos(photos, index)
  }, [active, photos, index])
}
