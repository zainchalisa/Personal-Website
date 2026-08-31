import {
  logImageCacheHit,
  logImageCacheMiss,
  logImageDecode,
  logImageLoadFail,
} from './imageLoadMetrics'

export type ImageOrientation = 'landscape' | 'portrait' | 'square'

export type PreloadedImage = {
  src: string
  width: number
  height: number
  orientation: ImageOrientation
}

type CacheEntry = PreloadedImage & {
  image: HTMLImageElement
  lastAccess: number
}

const MAX_DECODED_IMAGES = 18

const decoded = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<PreloadedImage>>()
const failed = new Set<string>()

function orientationFromSize(width: number, height: number): ImageOrientation {
  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
}

function touch(entry: CacheEntry): PreloadedImage {
  entry.lastAccess = performance.now()
  return entry
}

function evictIfNeeded(): void {
  if (decoded.size <= MAX_DECODED_IMAGES) return
  const entries = [...decoded.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess)
  const removeCount = decoded.size - MAX_DECODED_IMAGES
  for (let i = 0; i < removeCount; i++) {
    decoded.delete(entries[i][0])
  }
}

export function isImageCached(src: string): boolean {
  return decoded.has(src)
}

export function getImageMeta(src: string): PreloadedImage | undefined {
  const entry = decoded.get(src)
  return entry ? touch(entry) : undefined
}

/** True when an image URL has been fetched and decoded successfully. */
export function isImageLoadReady(src: string): boolean {
  return decoded.has(src)
}

export function isImageLoadFailed(src: string): boolean {
  return failed.has(src)
}

export function getDecodedImage(src: string): HTMLImageElement | undefined {
  return decoded.get(src)?.image
}

/** Drop decoded images whose URLs are not in `keep`. Inflight requests are left alone. */
export function retainDecodedImages(keep: ReadonlySet<string>): void {
  for (const src of [...decoded.keys()]) {
    if (!keep.has(src)) decoded.delete(src)
  }
}

/** True when two photos can crossfade without awkward size mismatch. */
export function canCrossfadeOrientations(a: ImageOrientation, b: ImageOrientation): boolean {
  return a === b
}

/** How mismatched orientations are handled during slideshow transitions. */
export type CrossfadeMode = 'match-orientation' | 'always' | 'scale-incoming'

export function shouldCrossfade(
  from: PreloadedImage | null,
  to: PreloadedImage,
  mode: CrossfadeMode,
): boolean {
  if (mode === 'always' || mode === 'scale-incoming') return true
  return from != null && canCrossfadeOrientations(from.orientation, to.orientation)
}

function containFootprint(
  imageAspect: number,
  containerAspect: number,
): { w: number; h: number } {
  if (imageAspect >= containerAspect) {
    return { w: 1, h: containerAspect / imageAspect }
  }
  return { w: imageAspect / containerAspect, h: 1 }
}

/** Scale incoming photo so its object-fit:contain footprint roughly matches outgoing. */
export function crossfadeIncomingScale(
  from: PreloadedImage,
  to: PreloadedImage,
  containerAspect = 4 / 3,
): number {
  const fromAspect = from.width / from.height
  const toAspect = to.width / to.height
  const out = containFootprint(fromAspect, containerAspect)
  const inn = containFootprint(toAspect, containerAspect)
  return Math.min(out.w / inn.w, out.h / inn.h)
}

const FAILED_META: Omit<PreloadedImage, 'src'> = {
  width: 1,
  height: 1,
  orientation: 'square',
}

function loadImageMeta(src: string): Promise<PreloadedImage> {
  const cached = decoded.get(src)
  if (cached) {
    logImageCacheHit(src)
    return Promise.resolve(touch(cached))
  }

  if (failed.has(src)) {
    return Promise.resolve({ src, ...FAILED_META })
  }

  const pending = inflight.get(src)
  if (pending) return pending

  logImageCacheMiss(src)
  const started = performance.now()

  const promise = new Promise<PreloadedImage>((resolve) => {
    const img = new Image()
    img.decoding = 'async'

    const succeed = (decodeMs: number) => {
      const requestMs = Math.max(0, performance.now() - started - decodeMs)
      const entry: CacheEntry = {
        src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        orientation: orientationFromSize(img.naturalWidth, img.naturalHeight),
        image: img,
        lastAccess: performance.now(),
      }
      decoded.set(src, entry)
      inflight.delete(src)
      evictIfNeeded()
      logImageDecode(src, requestMs, decodeMs)
      resolve(entry)
    }

    const fail = () => {
      failed.add(src)
      inflight.delete(src)
      logImageLoadFail(src, performance.now() - started)
      resolve({ src, ...FAILED_META })
    }

    img.onload = () => {
      const decodeStarted = performance.now()
      if (typeof img.decode === 'function') {
        img.decode().then(
          () => succeed(performance.now() - decodeStarted),
          () => succeed(0),
        )
      } else {
        succeed(0)
      }
    }
    img.onerror = fail
    img.src = src
  })

  inflight.set(src, promise)
  return promise
}

/** Decode an image into the in-memory cache before it is shown. */
export function preloadImage(src: string): Promise<void> {
  return loadImageMeta(src).then(() => undefined)
}

export function preloadImageMeta(src: string): Promise<PreloadedImage> {
  return loadImageMeta(src)
}

export function preloadImages(sources: readonly (string | null | undefined)[]): void {
  for (const src of sources) {
    if (src) void preloadImage(src)
  }
}

/** Drop decoded image metadata to free memory (e.g. when leaving photography on mobile). */
export function clearImagePreloadCache(keep?: ReadonlySet<string>): void {
  if (!keep || keep.size === 0) {
    decoded.clear()
    inflight.clear()
    failed.clear()
    return
  }

  retainDecodedImages(keep)
  for (const src of [...inflight.keys()]) {
    if (!keep.has(src)) inflight.delete(src)
  }
  for (const src of [...failed]) {
    if (!keep.has(src)) failed.delete(src)
  }
}
