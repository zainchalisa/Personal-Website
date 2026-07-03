const loaded = new Set<string>()
const inflight = new Map<string, Promise<PreloadedImage>>()

export type ImageOrientation = 'landscape' | 'portrait' | 'square'

export type PreloadedImage = {
  src: string
  width: number
  height: number
  orientation: ImageOrientation
}

const metaCache = new Map<string, PreloadedImage>()

function orientationFromSize(width: number, height: number): ImageOrientation {
  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
}

export function isImageCached(src: string): boolean {
  return loaded.has(src)
}

export function getImageMeta(src: string): PreloadedImage | undefined {
  return metaCache.get(src)
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

function loadImageMeta(src: string): Promise<PreloadedImage> {
  const cached = metaCache.get(src)
  if (cached) return Promise.resolve(cached)

  const pending = inflight.get(src)
  if (pending) return pending

  const promise = new Promise<PreloadedImage>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const meta: PreloadedImage = {
        src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        orientation: orientationFromSize(img.naturalWidth, img.naturalHeight),
      }
      metaCache.set(src, meta)
      loaded.add(src)
      inflight.delete(src)
      const finish = () => resolve(meta)
      if (typeof img.decode === 'function') {
        img.decode().then(finish, finish)
      } else {
        finish()
      }
    }
    img.onerror = () => {
      const meta: PreloadedImage = {
        src,
        width: 1,
        height: 1,
        orientation: 'square',
      }
      metaCache.set(src, meta)
      inflight.delete(src)
      resolve(meta)
    }
    img.src = src
  })

  inflight.set(src, promise)
  return promise
}

/** Decode an image into the browser cache before it is shown. */
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
