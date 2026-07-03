import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getMobilePlayheadLeft } from '../aboutMobileTimeline'
import { ABOUT_OVERVIEW_CLIP, type AboutView } from '../aboutContent'
import {
  buildMoviesTimelineClips,
  buildMusicTimelineClips,
  buildPlacesTimelineClips,
} from '../aboutTabData'
import { useContentData } from '../useContentData'
import type { PortfolioTheme } from '../portfolioTheme'
import { AboutMobileFilmstrip } from './AboutMobileFilmstrip'
import { AboutTabPanels } from './AboutTabPanels'
import { AboutViewTabs } from './AboutViewTabs'
import { useIosAppShell } from './IosAppShellContext'
import { TerminalTitleBar } from './TerminalTitleBar'
import { patchPortfolioSession, readPortfolioSession } from '../portfolioSessionState'
import styles from './AboutMobileApp.module.css'

type AboutMobileAppProps = {
  theme: PortfolioTheme
}

const CONTENT_NAV_VIEWS = new Set<AboutView>(['movies', 'music', 'places'])

export function AboutMobileApp({ theme }: AboutMobileAppProps) {
  const { requestClose, closeLocked } = useIosAppShell()
  const { movies, music, places } = useContentData()
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
  const filmstripRef = useRef<HTMLDivElement>(null)

  const timelineClips = useMemo(() => {
    switch (view) {
      case 'overview':
        return [ABOUT_OVERVIEW_CLIP]
      case 'movies':
        return buildMoviesTimelineClips(movies)
      case 'music':
        return buildMusicTimelineClips(music)
      case 'places':
        return buildPlacesTimelineClips(places)
    }
  }, [view, movies, music, places])
  const isContentNav = CONTENT_NAV_VIEWS.has(view)
  const isOverview = view === 'overview'

  const activeContentIdx =
    view === 'movies' ? activeMovieIdx : view === 'music' ? activeMusicIdx : view === 'places' ? activePlaceIdx : null

  const timelineActiveIdx = isContentNav
    ? Math.min(Math.max(0, activeContentIdx ?? 0), Math.max(0, timelineClips.length - 1))
    : 0
  const timelinePlayheadLeft = isContentNav
    ? getMobilePlayheadLeft(timelineClips, timelineActiveIdx)
    : getMobilePlayheadLeft(timelineClips, 0)

  const handleViewChange = useCallback((nextView: AboutView) => {
    setView(nextView)
    if (nextView === 'movies') setActiveMovieIdx(0)
    else setActiveMovieIdx(null)
    if (nextView === 'music') setActiveMusicIdx(0)
    else setActiveMusicIdx(null)
    if (nextView === 'places') setActivePlaceIdx(0)
    else setActivePlaceIdx(null)
  }, [])

  const handleSelectClip = useCallback(
    (idx: number, itemId?: string) => {
      const resolvedIdx =
        itemId !== undefined
          ? timelineClips.findIndex((clip) => clip.id === itemId)
          : idx
      const nextIdx = resolvedIdx >= 0 ? resolvedIdx : idx

      if (view === 'movies') {
        setActiveMovieIdx(nextIdx)
      } else if (view === 'music') {
        setActiveMusicIdx(nextIdx)
      } else if (view === 'places') {
        setActivePlaceIdx(nextIdx)
      }
    },
    [timelineClips, view],
  )

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

  useEffect(() => {
    if (!isContentNav) return

    const frame = requestAnimationFrame(() => {
      const strip = filmstripRef.current
      if (!strip) return
      const clip = strip.querySelector<HTMLElement>(`[data-film-idx="${timelineActiveIdx}"]`)
      if (!clip) return

      const clipCenter = clip.offsetLeft + clip.offsetWidth / 2
      const viewCenter = strip.scrollLeft + strip.clientWidth / 2
      if (Math.abs(clipCenter - viewCenter) <= clip.offsetWidth * 0.15) return

      const target = clipCenter - strip.clientWidth / 2
      const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth)
      strip.scrollTo({ left: Math.max(0, Math.min(target, maxScroll)), behavior: 'auto' })
    })

    return () => cancelAnimationFrame(frame)
  }, [isContentNav, timelineActiveIdx, view])

  return (
    <div
      className={styles.aboutMobile}
      data-about-theme={theme}
      data-portfolio-theme={theme}
    >
      <TerminalTitleBar
        path="~/about"
        onRedClick={requestClose}
        closeLocked={closeLocked}
      />

      <section
        className={`${styles.contentZone}${isOverview ? ` ${styles.contentZoneOverview}` : ''}`}
        aria-live="polite"
      >
        <AboutTabPanels
          view={view}
          variant="mobile"
          movies={movies}
          music={music}
          places={places}
          activeMovieIdx={activeMovieIdx}
          onClearMovieFocus={() => setActiveMovieIdx(null)}
          activeMusicIdx={activeMusicIdx}
          onClearMusicFocus={() => setActiveMusicIdx(null)}
          activePlaceIdx={activePlaceIdx}
          onClearPlaceFocus={() => setActivePlaceIdx(null)}
          onSelectItem={isContentNav ? handleSelectClip : undefined}
        />
      </section>

      <nav className={styles.navZone} aria-label="Timeline navigation">
        <AboutViewTabs activeView={view} onViewChange={handleViewChange} variant="mobile" />
        <AboutMobileFilmstrip
          clips={timelineClips}
          activeIdx={timelineActiveIdx}
          activeFilter="all"
          playheadLeft={timelinePlayheadLeft}
          filmstripRef={filmstripRef}
          onSelectClip={isContentNav ? handleSelectClip : () => {}}
          primaryTrack={view === 'music' ? 'audio' : 'video'}
        />
      </nav>
    </div>
  )
}
