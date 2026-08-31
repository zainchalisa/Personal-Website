/**
 * Session flags for photography CDN variants.
 * Display/thumb WebPs 404 until uploaded; after the first miss we skip them
 * so later photos do not wait on a failed request.
 */

let displayVariantsMissing = false
let thumbVariantsMissing = false

export function photographyDisplayMissing(): boolean {
  return displayVariantsMissing
}

export function photographyThumbsMissing(): boolean {
  return thumbVariantsMissing
}

export function markPhotographyUrlFailed(url: string): void {
  if (url.includes('/photography/display/')) displayVariantsMissing = true
  if (url.includes('/photography/thumbs/')) thumbVariantsMissing = true
}

export function markPhotographyUrlOk(url: string): void {
  if (url.includes('/photography/display/')) displayVariantsMissing = false
  if (url.includes('/photography/thumbs/')) thumbVariantsMissing = false
}

export function resetPhotographyVariantFlags(): void {
  displayVariantsMissing = false
  thumbVariantsMissing = false
}

/** Slideshow: prefer display WebP, then original. Skip known-missing variants. */
export function slideshowCandidateUrls(
  displaySrc: string | null | undefined,
  originalSrc?: string | null,
): string[] {
  const urls: string[] = []
  if (!displayVariantsMissing && displaySrc) urls.push(displaySrc)
  if (originalSrc && originalSrc !== displaySrc) urls.push(originalSrc)
  else if (displaySrc && !urls.includes(displaySrc)) urls.push(displaySrc)
  return urls
}

/** Pinboard cards: thumb → display → original, skipping known-missing variants. */
export function cardCandidateUrls(
  thumbSrc: string | null | undefined,
  displaySrc?: string | null,
  originalSrc?: string | null,
): string[] {
  const urls: string[] = []
  if (!thumbVariantsMissing && thumbSrc) urls.push(thumbSrc)
  if (!displayVariantsMissing && displaySrc) urls.push(displaySrc)
  if (originalSrc) urls.push(originalSrc)
  return [...new Set(urls.filter((url): url is string => Boolean(url)))]
}
