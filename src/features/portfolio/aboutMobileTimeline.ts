import type { PortfolioClip } from './types'

const MOBILE_CLIP_GAP = 3

export function getMobileClipWidth(clip: PortfolioClip): number {
  return clip.w
}

export function getMobileTimelineWidth(clips: PortfolioClip[]): number {
  if (clips.length === 0) return 0
  return clips.reduce((sum, clip, i) => {
    const gap = i === 0 ? 0 : MOBILE_CLIP_GAP
    return sum + gap + getMobileClipWidth(clip)
  }, 0)
}

export function getMobilePlayheadLeft(clips: PortfolioClip[], activeIdx: number): number {
  if (activeIdx < 0 || activeIdx >= clips.length) return 0
  let left = 0
  for (let i = 0; i < activeIdx; i++) {
    left += getMobileClipWidth(clips[i]) + MOBILE_CLIP_GAP
  }
  left += getMobileClipWidth(clips[activeIdx]) / 2
  return left
}

export function isClipFiltered(clip: PortfolioClip, filter: string): boolean {
  return filter === 'all' || clip.filter === filter
}
