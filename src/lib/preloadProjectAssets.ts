import { safeHref } from './safeHref'
import type { PortfolioProject } from '../pages/projects/projectTypes'

const loaded = new Set<string>()
const loading = new Map<string, Promise<void>>()

/** Preload a remote image; dedupes in-flight and completed requests. */
export function preloadImage(url: string): Promise<void> {
  if (loaded.has(url)) return Promise.resolve()

  const pending = loading.get(url)
  if (pending) return pending

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      loaded.add(url)
      loading.delete(url)
      resolve()
    }
    img.onerror = () => {
      loading.delete(url)
      resolve()
    }
    img.src = url
  })

  loading.set(url, promise)
  return promise
}

/** Preload cover + slide pages for a project (first pages prioritized). */
export function preloadProjectMedia(project: PortfolioProject): void {
  const cover = safeHref(project.coverImageUrl)
  if (cover) void preloadImage(cover)

  const slides = project.showcaseSlideUrls
    ?.map((url) => safeHref(url))
    .filter((url): url is string => url != null)
  if (!slides?.length) return

  slides.slice(0, 3).forEach((url) => {
    void preloadImage(url)
  })

  const rest = slides.slice(3)
  if (rest.length === 0) return

  const preloadRest = () => {
    rest.forEach((url) => {
      void preloadImage(url)
    })
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(preloadRest)
  } else {
    window.setTimeout(preloadRest, 150)
  }
}

export function preloadAllProjectMedia(projects: readonly PortfolioProject[]): void {
  projects.forEach((project) => {
    if (!project.isPasswordProtected) preloadProjectMedia(project)
  })
}
