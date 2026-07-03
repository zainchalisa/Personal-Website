import { useEffect, useRef, useState } from 'react'
import type { AboutView } from '../aboutContent'
import type { MovieEntry, PlaceEntry } from '../aboutTabData'
import type { ResolvedMusic } from '../useContentData'
import { AboutOverviewPanel } from './AboutOverviewPanel'
import { MoviesTab } from './MoviesTab'
import { MusicTab } from './MusicTab'
import { PlacesTab } from './PlacesTab'
import styles from './AboutContentTabs.module.css'

type AboutTabPanelsProps = {
  view: AboutView
  variant: 'desktop' | 'mobile'
  movies: MovieEntry[]
  music: ResolvedMusic[]
  places: PlaceEntry[]
  loading?: boolean
  activeMovieIdx?: number | null
  onClearMovieFocus?: () => void
  activeMusicIdx?: number | null
  onClearMusicFocus?: () => void
  activePlaceIdx?: number | null
  onClearPlaceFocus?: () => void
  onSelectItem?: (idx: number, itemId?: string) => void
}

function ActiveTabPanel({
  view,
  variant,
  movies,
  music,
  places,
  loading = false,
  activeMovieIdx = null,
  onClearMovieFocus = () => {},
  activeMusicIdx = null,
  onClearMusicFocus = () => {},
  activePlaceIdx = null,
  onClearPlaceFocus = () => {},
  onSelectItem,
}: {
  view: AboutView
  variant: 'desktop' | 'mobile'
  movies: MovieEntry[]
  music: ResolvedMusic[]
  places: PlaceEntry[]
  loading?: boolean
  activeMovieIdx?: number | null
  onClearMovieFocus?: () => void
  activeMusicIdx?: number | null
  onClearMusicFocus?: () => void
  activePlaceIdx?: number | null
  onClearPlaceFocus?: () => void
  onSelectItem?: (idx: number, itemId?: string) => void
}) {
  switch (view) {
    case 'overview':
      return <AboutOverviewPanel variant={variant} />
    case 'movies':
      return (
        <MoviesTab
          movies={movies}
          activeMovieIdx={activeMovieIdx}
          onClearFocus={onClearMovieFocus}
          onSelectItem={onSelectItem}
          variant={variant}
        />
      )
    case 'music':
      return (
        <MusicTab
          music={music}
          loading={loading}
          activeMusicIdx={activeMusicIdx}
          onClearFocus={onClearMusicFocus}
          onSelectItem={onSelectItem}
          variant={variant}
        />
      )
    case 'places':
      return (
        <PlacesTab
          places={places}
          activePlaceIdx={activePlaceIdx}
          onClearFocus={onClearPlaceFocus}
          onSelectItem={onSelectItem}
          variant={variant}
        />
      )
  }
}

const TAB_FADE_MS = 180

export function AboutTabPanels({
  view,
  variant,
  movies,
  music,
  places,
  loading = false,
  activeMovieIdx = null,
  onClearMovieFocus = () => {},
  activeMusicIdx = null,
  onClearMusicFocus = () => {},
  activePlaceIdx = null,
  onClearPlaceFocus = () => {},
  onSelectItem,
}: AboutTabPanelsProps) {
  const [displayView, setDisplayView] = useState<AboutView>(view)
  const [panelOpacity, setPanelOpacity] = useState(1)
  const [cardEnter, setCardEnter] = useState(false)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    setPanelOpacity(0)
    let enterTimer: number | undefined

    const swapTimer = window.setTimeout(() => {
      setDisplayView(view)
      setCardEnter(true)
      requestAnimationFrame(() => setPanelOpacity(1))
      enterTimer = window.setTimeout(() => setCardEnter(false), 680)
    }, TAB_FADE_MS)

    return () => {
      window.clearTimeout(swapTimer)
      if (enterTimer !== undefined) window.clearTimeout(enterTimer)
    }
  }, [view])

  const panel = (
    <ActiveTabPanel
      view={displayView}
      variant={variant}
      movies={movies}
      music={music}
      places={places}
      loading={loading}
      activeMovieIdx={activeMovieIdx}
      onClearMovieFocus={onClearMovieFocus}
      activeMusicIdx={activeMusicIdx}
      onClearMusicFocus={onClearMusicFocus}
      activePlaceIdx={activePlaceIdx}
      onClearPlaceFocus={onClearPlaceFocus}
      onSelectItem={onSelectItem}
    />
  )

  const panelClass = [
    styles.tabFade,
    styles.tabFadeVisible,
    cardEnter ? styles.tabCardEnter : '',
  ]
    .filter(Boolean)
    .join(' ')

  const hostStyle = {
    opacity: panelOpacity,
    transition: `opacity ${TAB_FADE_MS}ms ease`,
  } as const

  if (variant === 'mobile') {
    return (
      <div className={styles.tabFadeHostMobile} style={hostStyle}>
        <div className={panelClass}>{panel}</div>
      </div>
    )
  }

  return (
    <div className={styles.tabFadeHost} style={hostStyle}>
      <div className={panelClass}>{panel}</div>
    </div>
  )
}
