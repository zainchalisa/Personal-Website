import type { MovieEntry } from '../aboutTabData'
import { AboutMobileCarousel } from './AboutMobileCarousel'
import { MovieMobileSlide } from './AboutMobileCarouselSlides'
import { BrowseFocusedShell } from './BrowseFocusedShell'
import { MovieFocused } from './MovieFocused'
import { MovieGrid } from './MovieGrid'

type MoviesTabProps = {
  movies: MovieEntry[]
  activeMovieIdx: number | null
  onClearFocus: () => void
  onSelectItem?: (idx: number, itemId?: string) => void
  variant?: 'desktop' | 'mobile'
}

export function MoviesTab({
  movies,
  activeMovieIdx,
  onClearFocus,
  onSelectItem,
  variant = 'desktop',
}: MoviesTabProps) {
  const focusedMovie = activeMovieIdx !== null ? movies[activeMovieIdx] : null
  const isBrowse = focusedMovie === null

  if (variant === 'mobile') {
    return (
      <AboutMobileCarousel
        items={movies}
        activeIdx={activeMovieIdx ?? 0}
        onActiveChange={(idx) => onSelectItem?.(idx, movies[idx]?.id)}
        getKey={(movie) => movie.id}
        renderSlide={(movie) => <MovieMobileSlide movie={movie} />}
      />
    )
  }

  return (
    <BrowseFocusedShell
      variant={variant}
      isBrowse={isBrowse}
      browse={
        <MovieGrid
          movies={movies}
          onSelectItem={onSelectItem}
          hideDescription
        />
      }
      focused={focusedMovie ? <MovieFocused movie={focusedMovie} onBack={onClearFocus} /> : null}
    />
  )
}
