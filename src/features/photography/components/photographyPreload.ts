import { isImageCached, preloadImages } from '@/shared/lib/preloadImage'
import type { BoardRegionLayout } from './pinboardData'
import type { PinboardPhoto } from './photographyPhotos'

const FIRST_BATCH_DESKTOP = 16
const FIRST_BATCH_MOBILE = 4
const REGION_WARM_PER_COUNTRY_DESKTOP = 6
const REGION_WARM_PER_COUNTRY_MOBILE = 1

export type PhotographyPreloadOptions = {
  mobile?: boolean
}

function scheduleIdle(task: () => void, mobile: boolean): void {
  if (mobile) {
    window.setTimeout(task, 200)
    return
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(task, { timeout: 2500 })
  } else {
    window.setTimeout(task, 50)
  }
}

/** Preload the first screenful of a country gallery, then the rest when idle. */
export function preloadCountryGallery(
  photos: readonly PinboardPhoto[],
  options?: PhotographyPreloadOptions,
): void {
  const mobile = options?.mobile ?? false
  const sources = photos.map((photo) => photo.src).filter((src): src is string => Boolean(src))
  if (sources.length === 0) return

  const firstBatch = mobile ? FIRST_BATCH_MOBILE : FIRST_BATCH_DESKTOP
  preloadImages(sources.slice(0, firstBatch))
  if (mobile) return

  const rest = sources.slice(firstBatch)
  if (rest.length > 0) scheduleIdle(() => preloadImages(rest), false)
}

/** Warm the first few photos for every country in a region after a region switch. */
export function preloadRegionGallery(
  region: BoardRegionLayout,
  options?: PhotographyPreloadOptions,
): void {
  const mobile = options?.mobile ?? false
  const perCountry = mobile ? REGION_WARM_PER_COUNTRY_MOBILE : REGION_WARM_PER_COUNTRY_DESKTOP

  for (const { card } of region.countries) {
    const sources = card.photos
      .map((photo) => photo.src)
      .filter((src): src is string => Boolean(src))
      .slice(0, perCountry)
    preloadImages(sources)
  }
}

/** Preload any slideshow photos that are not cached yet. */
export function preloadSlideshowRemainder(
  photos: readonly PinboardPhoto[],
  options?: PhotographyPreloadOptions,
): void {
  if (options?.mobile) return

  const sources = photos
    .map((photo) => photo.src)
    .filter((src): src is string => Boolean(src && !isImageCached(src)))
  if (sources.length === 0) return
  scheduleIdle(() => preloadImages(sources), false)
}
