import type { PortfolioClip } from './types'

const TIMELINE_CLIP_GAP = 4
export const TIMELINE_PLAYHEAD_OFFSET = 6

const TIMELINE_CLIP_MIN_WIDTH = 52
const TIMELINE_CLIP_CHAR_WIDTH = 6
const TIMELINE_CLIP_HORIZONTAL_PADDING = 18

/** Width for timeline clip buttons so labels fit without ellipsis (desktop 8px mono). */
export function timelineClipWidth(label: string, secondaryLine = ''): number {
  const longest = Math.max(label.length, secondaryLine.length)
  return Math.max(TIMELINE_CLIP_MIN_WIDTH, Math.ceil(longest * TIMELINE_CLIP_CHAR_WIDTH + TIMELINE_CLIP_HORIZONTAL_PADDING))
}

export function getTimelinePlayheadLeft(clips: PortfolioClip[], idx: number) {
  let left = TIMELINE_PLAYHEAD_OFFSET
  for (let i = 0; i < idx; i++) {
    left += clips[i].w + TIMELINE_CLIP_GAP
  }
  left += clips[idx].w / 2
  return left
}
