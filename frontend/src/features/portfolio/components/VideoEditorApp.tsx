import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ABOUT_OVERVIEW_CLIP,
  type AboutView,
} from '../aboutContent'
import {
  MOVIES_TIMELINE_CLIPS,
  MUSIC_TIMELINE_CLIPS,
  PLACES_TIMELINE_CLIPS,
} from '../aboutTabData'
import {
  getTimelinePlayheadLeft,
  TIMELINE_PLAYHEAD_OFFSET,
} from '../aboutTimelineUtils'
import { TopBar } from './TopBar'
import { AboutTabPanels } from './AboutTabPanels'
import { TimelineSection } from './TimelineSection'
import { useContentData } from '../useContentData'
import { patchPortfolioSession, readPortfolioSession } from '../portfolioSessionState'
import styles from '../PortfolioPage.module.css'

type VideoEditorAppProps = {
  chromeless?: boolean
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isMaximized?: boolean
  onDragStart?: (e: React.PointerEvent<HTMLElement>) => void
}

const CONTENT_NAV_VIEWS = new Set<AboutView>(['movies', 'music', 'places'])

function clipsForView(view: AboutView) {
  switch (view) {
    case 'overview':
      return [ABOUT_OVERVIEW_CLIP]
    case 'movies':
      return MOVIES_TIMELINE_CLIPS
    case 'music':
      return MUSIC_TIMELINE_CLIPS
    case 'places':
      return PLACES_TIMELINE_CLIPS
  }
}

function playheadForClips(clips: typeof ABOUT_OVERVIEW_CLIP[], activeIdx: number | null) {
  if (clips.length === 0) return TIMELINE_PLAYHEAD_OFFSET
  if (activeIdx === null) return TIMELINE_PLAYHEAD_OFFSET
  return getTimelinePlayheadLeft(clips, activeIdx)
}

export function VideoEditorApp({
  chromeless = false,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  onDragStart,
}: VideoEditorAppProps) {
  const { movies, music, places, loading } = useContentData()
  const savedAbout = readPortfolioSession()?.about
  const [view, setView] = useState<AboutView>(savedAbout?.view ?? 'overview')
  const [activeMovieIdx, setActiveMovieIdx] = useState<number | null>(
    savedAbout?.activeMovieIdx ?? null,
  )
  const [activeMusicIdx, setActiveMusicIdx] = useState<number | null>(
    savedAbout?.activeMusicIdx ?? null,
  )
  const [activePlaceIdx, setActivePlaceIdx] = useState<number | null>(
    savedAbout?.activePlaceIdx ?? null,
  )
  const trackScrollRef = useRef<HTMLDivElement>(null)

  const timelineClips = useMemo(() => clipsForView(view), [view])
  const isContentNav = CONTENT_NAV_VIEWS.has(view)

  const activeContentIdx =
    view === 'movies' ? activeMovieIdx : view === 'music' ? activeMusicIdx : view === 'places' ? activePlaceIdx : null

  const timelineActiveIdx = isContentNav ? activeContentIdx : 0
  const timelinePlayheadLeft = isContentNav
    ? playheadForClips(timelineClips, activeContentIdx)
    : playheadForClips(timelineClips, 0)
  const clipLabel = `${timelineClips.length} clip${timelineClips.length === 1 ? '' : 's'}`
  const topBarDateRange = view === 'overview' ? ABOUT_OVERVIEW_CLIP.dateRange : 'Favorites'

  const handleViewChange = useCallback((nextView: AboutView) => {
    setView(nextView)
    if (nextView !== 'movies') setActiveMovieIdx(null)
    if (nextView !== 'music') setActiveMusicIdx(null)
    if (nextView !== 'places') setActivePlaceIdx(null)
  }, [])

  const handleSelectClip = useCallback(
    (idx: number) => {
      if (view === 'movies') {
        setActiveMovieIdx((current) => (current === idx ? null : idx))
      } else if (view === 'music') {
        setActiveMusicIdx((current) => (current === idx ? null : idx))
      } else if (view === 'places') {
        setActivePlaceIdx((current) => (current === idx ? null : idx))
      }
    },
    [view],
  )

  const handleClearMovieFocus = useCallback(() => setActiveMovieIdx(null), [])
  const handleClearMusicFocus = useCallback(() => setActiveMusicIdx(null), [])
  const handleClearPlaceFocus = useCallback(() => setActivePlaceIdx(null), [])

  useEffect(() => {
    patchPortfolioSession({
      about: {
        view,
        activeMovieIdx,
        activeMusicIdx,
        activePlaceIdx,
      },
    })
  }, [view, activeMovieIdx, activeMusicIdx, activePlaceIdx])

  return (
    <div className={styles.editorApp}>
      {!chromeless && (
        <TopBar
          dateRange={topBarDateRange}
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          isMaximized={isMaximized}
          onDragStart={onDragStart}
        />
      )}
      <AboutTabPanels
        view={view}
        variant="desktop"
        movies={movies}
        music={music}
        places={places}
        loading={loading}
        activeMovieIdx={activeMovieIdx}
        onClearMovieFocus={handleClearMovieFocus}
        activeMusicIdx={activeMusicIdx}
        onClearMusicFocus={handleClearMusicFocus}
        activePlaceIdx={activePlaceIdx}
        onClearPlaceFocus={handleClearPlaceFocus}
        onSelectItem={isContentNav ? handleSelectClip : undefined}
      />
      <TimelineSection
        clips={timelineClips}
        activeIdx={timelineActiveIdx}
        activeFilter="all"
        playing={false}
        playheadLeft={timelinePlayheadLeft}
        trackScrollRef={trackScrollRef}
        onSelectClip={isContentNav ? handleSelectClip : () => {}}
        onTogglePlay={() => {}}
        clipLabel={clipLabel}
        aboutView={view}
        onAboutViewChange={handleViewChange}
        contentNav={isContentNav}
        primaryTrack={view === 'music' ? 'audio' : 'video'}
        playheadTransitionMs={isContentNav ? 150 : undefined}
      />
    </div>
  )
}
