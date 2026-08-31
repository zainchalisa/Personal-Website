import { assetUrl } from '@/lib/assetUrl'

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/i, '')
}

/** Full-resolution original (fallback only). */
export function photographyOriginalUrl(folder: string, filename: string): string {
  return assetUrl(`/photography/${folder}/${filename}`)
}

/** Pinboard card preview (~320px WebP). */
export function photographyThumbUrl(folder: string, filename: string): string {
  const base = stripExtension(filename)
  return assetUrl(`/photography/thumbs/${folder}/${base}.webp`)
}

/** Slideshow / gallery view (~1920px WebP). */
export function photographyDisplayUrl(folder: string, filename: string): string {
  const base = stripExtension(filename)
  return assetUrl(`/photography/display/${folder}/${base}.webp`)
}
