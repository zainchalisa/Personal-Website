/**
 * Per-project media position for the current page visit only.
 * Survives closing/reopening a project modal; clears on refresh, new tab, or new window.
 */

type MediaState = {
  slideshow?: number
  scroll?: number
  video?: number
}

const store = new Map<string, MediaState>()

function bucket(slug: string): MediaState {
  let state = store.get(slug)
  if (!state) {
    state = {}
    store.set(slug, state)
  }
  return state
}

export function readSlideshowIndex(slug: string, maxIndex: number): number {
  const saved = bucket(slug).slideshow
  if (saved == null || !Number.isFinite(saved)) return 0
  const index = Math.floor(saved)
  if (index < 0) return 0
  if (maxIndex < 0) return 0
  return Math.min(index, maxIndex)
}

export function writeSlideshowIndex(slug: string, pageIndex: number): void {
  bucket(slug).slideshow = pageIndex
}

export function readScrollTop(slug: string): number | null {
  const saved = bucket(slug).scroll
  if (saved == null || !Number.isFinite(saved) || saved < 0) return null
  return saved
}

export function writeScrollTop(slug: string, scrollTop: number): void {
  bucket(slug).scroll = scrollTop
}

export function readVideoTime(slug: string): number | null {
  const saved = bucket(slug).video
  if (saved == null || !Number.isFinite(saved) || saved < 0) return null
  return saved
}

export function writeVideoTime(slug: string, currentTime: number): void {
  bucket(slug).video = currentTime
}
