import { isImageCached, preloadImages } from '@/shared/lib/preloadImage'
import type { BoardRegionLayout } from './pinboardData'
import type { PinboardPhoto } from './photographyPhotos'

const FIRST_BATCH = 16
const REGION_WARM_PER_COUNTRY = 6

function scheduleIdle(task: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(task, { timeout: 2500 })
  } else {
    window.setTimeout(task, 50)
  }
}

/** Preload the first screenful of a country gallery, then the rest when idle. */
export function preloadCountryGallery(photos: readonly PinboardPhoto[]): void {
  const sources = photos.map((photo) => photo.src).filter((src): src is string => Boolean(src))
  if (sources.length === 0) return

  preloadImages(sources.slice(0, FIRST_BATCH))
  const rest = sources.slice(FIRST_BATCH)
  if (rest.length > 0) scheduleIdle(() => preloadImages(rest))
}

/** Warm the first few photos for every country in a region after a region switch. */
export function preloadRegionGallery(region: BoardRegionLayout): void {
  for (const { card } of region.countries) {
    const sources = card.photos
      .map((photo) => photo.src)
      .filter((src): src is string => Boolean(src))
      .slice(0, REGION_WARM_PER_COUNTRY)
    preloadImages(sources)
  }
}

/** Preload any slideshow photos that are not cached yet. */
export function preloadSlideshowRemainder(photos: readonly PinboardPhoto[]): void {
  const sources = photos
    .map((photo) => photo.src)
    .filter((src): src is string => Boolean(src && !isImageCached(src)))
  if (sources.length === 0) return
  scheduleIdle(() => preloadImages(sources))
}
