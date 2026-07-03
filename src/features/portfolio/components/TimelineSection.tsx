import type { RefObject } from 'react'
import {
  IconLock,
  IconMagnet,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconScissors,
} from '@tabler/icons-react'
import type { AboutView } from '../aboutContent'
import type { PortfolioClip } from '../types'
import { AboutViewTabs } from './AboutViewTabs'
import styles from '../PortfolioPage.module.css'

const TIMELINE_CLIP_LABEL = '30 clips · 2002–2026'

type TimelineSectionProps = {
  clips: PortfolioClip[]
  activeIdx: number | null
  activeFilter: string
  playing: boolean
  playheadLeft: number
  trackScrollRef: RefObject<HTMLDivElement | null>
  onSelectClip: (idx: number) => void
  onTogglePlay: () => void
  clipLabel?: string
  aboutView?: AboutView
  onAboutViewChange?: (view: AboutView) => void
  contentNav?: boolean
  primaryTrack?: 'video' | 'audio'
  playheadTransitionMs?: number
}

function isClipVisible(clip: PortfolioClip, filter: string) {
  return filter === 'all' || clip.filter === filter
}

function clipButtonClass(isActive: boolean, contentNav: boolean, styles: Record<string, string>) {
  if (contentNav) {
    return `${styles.clipEl} ${styles.clipElMovies}${isActive ? ` ${styles.clipElMoviesActive}` : ''}`
  }
  return `${styles.clipEl}${isActive ? ` ${styles.clipElSel}` : ''}`
}

export function TimelineSection({
  clips,
  activeIdx,
  activeFilter,
  playing,
  playheadLeft,
  trackScrollRef,
  onSelectClip,
  onTogglePlay,
  clipLabel,
  aboutView,
  onAboutViewChange,
  contentNav = false,
  primaryTrack = 'video',
  playheadTransitionMs,
}: TimelineSectionProps) {
  const phStyle =
    playheadTransitionMs !== undefined
      ? ({ left: playheadLeft, transitionDuration: `${playheadTransitionMs}ms` } as const)
      : ({ left: playheadLeft } as const)

  const phClass = `${styles.phWrap}${contentNav ? ` ${styles.phWrapMovies}` : ''}`
  const isAudioPrimary = primaryTrack === 'audio'

  const clipButtons = clips.map((clip, idx) => {
    const visible = isClipVisible(clip, activeFilter)
    const isActive = activeIdx === idx
    return (
      <button
        key={clip.id}
        type="button"
        className={`${clipButtonClass(isActive, contentNav, styles)}${!visible ? ` ${styles.clipElDim}` : ''}`}
        style={{ width: clip.w }}
        onClick={() => onSelectClip(idx)}
        aria-pressed={isActive}
      >
        <div className={styles.clipTopStripe} style={{ background: clip.stripe }} />
        <div className={styles.clipBody}>
          <div className={`${styles.clipLbl}${contentNav ? ` ${styles.clipLblFull}` : ''}`}>{clip.name}</div>
          <div className={styles.clipYr}>{clip.date}</div>
        </div>
      </button>
    )
  })

  const passiveAudioBlocks = clips.map((clip) => (
    <div
      key={clip.id}
      className={styles.audioClip}
      style={{
        width: clip.w,
        borderTop: `1px solid ${clip.stripe}`,
      }}
    />
  ))

  return (
    <div className={styles.tlSection}>
      <div className={styles.tlToolbar}>
        <IconPlayerSkipBack className={styles.tlToolIcon} aria-hidden />
        <button type="button" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <IconPlayerPause className={styles.tlToolIcon} aria-hidden />
          ) : (
            <IconPlayerPlay className={styles.tlToolIcon} aria-hidden />
          )}
        </button>
        <IconPlayerSkipForward className={styles.tlToolIcon} aria-hidden />
        <div className={styles.tlSep} />
        <IconScissors className={styles.tlToolIcon} aria-hidden />
        <IconMagnet className={styles.tlToolIcon} aria-hidden />
        <IconLock className={styles.tlToolIcon} aria-hidden />
        <span className={styles.tlZoom}>{clipLabel ?? TIMELINE_CLIP_LABEL}</span>
      </div>

      {aboutView !== undefined && onAboutViewChange && (
        <AboutViewTabs
          activeView={aboutView}
          onViewChange={onAboutViewChange}
          variant="desktop"
        />
      )}

      <div className={styles.trackRows}>
        {!isAudioPrimary && (
          <div className={`${styles.trackRow} ${styles.trackRowVideo}`}>
            <div className={styles.trackLabelCol}>
              <span>V1</span>
            </div>
            <div
              ref={trackScrollRef}
              className={`${styles.trackClips} ${styles.trackClipsScroll}`}
            >
              <div className={phClass} style={phStyle}>
                <div className={styles.phHead} />
                <div className={styles.phLine} />
              </div>
              {clipButtons}
            </div>
          </div>
        )}

        <div
          className={`${styles.trackRow} ${styles.trackRowAudio}${isAudioPrimary ? ` ${styles.trackRowAudioActive}` : ''}`}
        >
          <div className={styles.trackLabelCol}>
            <span>A1</span>
          </div>
          {isAudioPrimary ? (
            <div
              ref={trackScrollRef}
              className={`${styles.trackClips} ${styles.trackClipsScroll}`}
            >
              <div className={phClass} style={phStyle}>
                <div className={styles.phHead} />
                <div className={styles.phLine} />
              </div>
              {clipButtons}
            </div>
          ) : (
            <div className={styles.trackClips} style={{ gap: 4, padding: '6px 6px' }}>
              {passiveAudioBlocks}
            </div>
          )}
        </div>

        {isAudioPrimary && (
          <div className={`${styles.trackRow} ${styles.trackRowAudio}`}>
            <div className={styles.trackLabelCol}>
              <span>A2</span>
            </div>
            <div className={styles.trackClips} style={{ gap: 4, padding: '6px 6px' }}>
              {passiveAudioBlocks}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
