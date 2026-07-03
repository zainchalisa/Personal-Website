import type { RefObject } from 'react'
import type { CSSProperties } from 'react'
import {
  getMobileClipWidth,
  getMobileTimelineWidth,
  isClipFiltered,
} from '../aboutMobileTimeline'
import type { PortfolioClip } from '../types'
import styles from './AboutMobileApp.module.css'

type AboutMobileFilmstripProps = {
  clips: PortfolioClip[]
  activeIdx: number
  activeFilter: string
  playheadLeft: number
  filmstripRef: RefObject<HTMLDivElement | null>
  onSelectClip: (idx: number) => void
  primaryTrack?: 'video' | 'audio'
}

export function AboutMobileFilmstrip({
  clips,
  activeIdx,
  activeFilter,
  playheadLeft,
  filmstripRef,
  onSelectClip,
  primaryTrack = 'video',
}: AboutMobileFilmstripProps) {
  const totalWidth = getMobileTimelineWidth(clips)
  const isAudioPrimary = primaryTrack === 'audio'

  const clipButtons = clips.map((clip, idx) => {
    const filtered = isClipFiltered(clip, activeFilter)
    const isActive = idx === activeIdx
    return (
      <button
        key={clip.id}
        type="button"
        data-film-idx={idx}
        className={`${styles.filmClip}${isActive ? ` ${styles.filmClipActive}` : ''}${
          !filtered ? ` ${styles.filmClipDim}` : ''
        }`}
        style={
          {
            width: getMobileClipWidth(clip),
            '--clip-accent': clip.stripe,
          } as CSSProperties
        }
        onClick={() => onSelectClip(idx)}
        aria-pressed={isActive}
      >
        <div className={styles.filmClipStripe} style={{ background: clip.stripe }} />
        <span className={styles.filmClipName}>{clip.name}</span>
        <span className={styles.filmClipYear}>{clip.year}</span>
      </button>
    )
  })

  const passiveAudioBlocks = clips.map((clip) => {
    const filtered = isClipFiltered(clip, activeFilter)
    return (
      <div
        key={clip.id}
        className={`${styles.audioBlock}${!filtered ? ` ${styles.filmClipDim}` : ''}`}
        style={{
          width: getMobileClipWidth(clip),
          borderTopColor: clip.stripe,
        }}
      />
    )
  })

  return (
    <div className={styles.filmstrip}>
      <div className={styles.filmstripFadeLeft} aria-hidden />
      <div className={styles.filmstripFadeRight} aria-hidden />
      <div className={styles.filmstripLayout}>
        <div
          className={`${styles.filmstripLabels}${isAudioPrimary ? ` ${styles.filmstripLabelsAudioPrimary}` : ''}`}
          aria-hidden
        >
          {!isAudioPrimary ? (
            <div className={styles.videoLabelRow}>
              <span className={styles.trackLabel}>V1</span>
            </div>
          ) : null}
          <div
            className={`${styles.audioLabelRow}${isAudioPrimary ? ` ${styles.audioLabelRowActive}` : ''}`}
          >
            <span className={styles.trackLabelAudio}>A1</span>
          </div>
          {isAudioPrimary ? (
            <div className={styles.audioLabelRow}>
              <span className={styles.trackLabelAudio}>A2</span>
            </div>
          ) : null}
        </div>

        <div ref={filmstripRef} className={styles.filmstripScroll}>
          {!isAudioPrimary ? (
            <div className={styles.videoTrackRow} style={{ width: totalWidth }}>
              <div className={styles.phWrap} style={{ left: playheadLeft }}>
                <div className={styles.phHead} />
                <div className={styles.phLine} />
              </div>
              <div className={styles.clipTrack}>{clipButtons}</div>
            </div>
          ) : null}

          <div
            className={`${styles.audioTrackRow}${isAudioPrimary ? ` ${styles.audioTrackRowActive}` : ''}`}
            style={{ width: totalWidth }}
          >
            {isAudioPrimary ? (
              <>
                <div className={styles.phWrap} style={{ left: playheadLeft }}>
                  <div className={styles.phHead} />
                  <div className={styles.phLine} />
                </div>
                <div className={styles.clipTrack}>{clipButtons}</div>
              </>
            ) : (
              <div className={styles.audioTrack}>{passiveAudioBlocks}</div>
            )}
          </div>

          {isAudioPrimary ? (
            <div className={styles.audioTrackRow} style={{ width: totalWidth }}>
              <div className={styles.audioTrack}>{passiveAudioBlocks}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
