import {
  getImageMeta,
  isImageLoadReady,
  preloadImageMeta,
  preloadImages,
  retainDecodedImages,
  type PreloadedImage,
} from '@/lib/preloadImage'
import {
  markPhotographyUrlFailed,
  markPhotographyUrlOk,
  photographyDisplayMissing,
  slideshowCandidateUrls,
} from './photographyVariants'
import type { BoardRegionLayout } from './pinboardData'
import type { PinboardPhoto } from './photographyPhotos'

/** Sliding window: previous 1 + current + next 3 (matches 3 / 4 / 5 / 6 / 7 / 8 around 5). */
const WINDOW_BACK = 2
const WINDOW_AHEAD = 3
const RETAIN_BACK = 3
const RETAIN_AHEAD = 4

export type PhotographyPreloadOptions = {
  mobile?: boolean
}

export function slideshowPhotoUrls(photo: PinboardPhoto): string[] {
  return slideshowCandidateUrls(photo.src, photo.originalSrc)
}

export async function resolveSlideshowPhotoMeta(
  displaySrc: string,
  originalSrc?: string | null,
): Promise<PreloadedImage> {
  const ordered = slideshowCandidateUrls(displaySrc, originalSrc)

  const cached = ordered.find((url) => isImageLoadReady(url))
  if (cached) return getImageMeta(cached)!

  let lastFailed: PreloadedImage | null = null
  for (const url of ordered) {
    const meta = await preloadImageMeta(url)
    if (meta.width > 1 && meta.height > 1) {
      markPhotographyUrlOk(url)
      return meta
    }
    markPhotographyUrlFailed(url)
    lastFailed = meta
  }

  return lastFailed ?? { src: displaySrc, width: 1, height: 1, orientation: 'square' }
}

export function preloadSlideshowPhoto(photo: PinboardPhoto): void {
  void resolveSlideshowPhotoMeta(photo.src ?? '', photo.originalSrc)
}

/**
 * Warm the opening window of a country gallery (current + next 3 + prev).
 * The sliding window handles the rest as the user navigates.
 */
export function preloadCountryGallery(
  photos: readonly PinboardPhoto[],
  _options?: PhotographyPreloadOptions,
): void {
  preloadNearbySlideshowPhotos(photos, 0)
}

/**
 * Warm the first *display* photo per country. Never falls back to originals —
 * those are too large to prefetch across a whole region.
 */
export function preloadRegionGallery(
  region: BoardRegionLayout,
  _options?: PhotographyPreloadOptions,
): void {
  if (photographyDisplayMissing()) return
  for (const { card } of region.countries) {
    const src = card.photos[0]?.src
    if (!src) continue
    void preloadImageMeta(src).then((meta) => {
      if (meta.width > 1) markPhotographyUrlOk(src)
      else markPhotographyUrlFailed(src)
    })
  }
}

/** Warm card thumbs for every country in a region (cheap, runs on region focus). */
export function preloadRegionCardThumbs(region: BoardRegionLayout): void {
  const sources = region.countries
    .map((layout) => layout.card.previewPhoto?.thumbSrc ?? layout.card.previewPhoto?.src)
    .filter((src): src is string => Boolean(src))
  preloadImages(sources)
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.max(0, Math.min(length - 1, index))
}

function windowIndexes(length: number, index: number): number[] {
  const current = clampIndex(index, length)
  const ordered: number[] = [current]
  for (let ahead = 1; ahead <= WINDOW_AHEAD; ahead++) {
    const i = current + ahead
    if (i < length) ordered.push(i)
  }
  for (let back = 1; back <= WINDOW_BACK; back++) {
    const i = current - back
    if (i >= 0) ordered.push(i)
  }
  return ordered
}

function retainUrls(
  photos: readonly PinboardPhoto[],
  index: number,
): Set<string> {
  const current = clampIndex(index, photos.length)
  const keep = new Set<string>()
  const from = Math.max(0, current - RETAIN_BACK)
  const to = Math.min(photos.length - 1, current + RETAIN_AHEAD)
  for (let i = from; i <= to; i++) {
    for (const url of slideshowPhotoUrls(photos[i])) keep.add(url)
  }
  return keep
}

/**
 * Maintain a sliding preload window around `slideIndex`.
 * Priority: current → next 1–3 → previous. Does not fetch the rest of the album.
 */
export function preloadNearbySlideshowPhotos(
  photos: readonly PinboardPhoto[],
  slideIndex: number,
): void {
  if (photos.length === 0) return

  retainDecodedImages(retainUrls(photos, slideIndex))

  for (const i of windowIndexes(photos.length, slideIndex)) {
    const photo = photos[i]
    if (photo) preloadSlideshowPhoto(photo)
  }
}
