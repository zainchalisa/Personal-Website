import { readPortfolioSession } from '../../portfolio/portfolioSessionState'
import {
  buildBoardRegions,
  getRegionWithMostPlaces,
  resolvePhotographyOpenRegion,
} from './pinboardData'
import { preloadRegionCardThumbs } from './photographyPreload'

let warmPrefetchStarted = false

/** Warm card thumbs for the region the pinboard will open to. */
export function prefetchPhotographyAppAssets(mobile = false): void {
  if (warmPrefetchStarted) return
  warmPrefetchStarted = true

  const regions = buildBoardRegions(mobile ? { mobile: true } : undefined)
  const session = readPortfolioSession()?.photography
  const region =
    resolvePhotographyOpenRegion(regions, {
      activeRegionId: session?.activeRegionId,
    }) ?? getRegionWithMostPlaces(regions)

  if (!region) return
  preloadRegionCardThumbs(region)
}

/** Idle warm-start after the portfolio shell mounts (mobile home screen). */
export function schedulePhotographyWarmPrefetch(mobile = false): void {
  const run = () => prefetchPhotographyAppAssets(mobile)
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 })
  } else {
    window.setTimeout(run, 1200)
  }
}
