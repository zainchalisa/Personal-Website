import type { MovieEntry } from '../aboutTabData'
import { AboutGridSection } from './AboutGridSection'
import { AboutPosterCard } from './AboutPosterCard'
import gridStyles from './AboutContentTabs.module.css'

type MovieGridProps = {
  movies: MovieEntry[]
  onSelectItem?: (idx: number) => void
  hideDescription?: boolean
}

export function MovieGrid({ movies, onSelectItem, hideDescription = false }: MovieGridProps) {
  return (
    <AboutGridSection label="Movies" gridClassName={gridStyles.gridMovies}>
      {movies.map((movie, idx) => (
        <AboutPosterCard
          key={movie.id}
          imageUrl={movie.posterUrl}
          imageAlt={`${movie.title} poster`}
          title={movie.title}
          noteLead={movie.noteLead}
          note={movie.noteRest}
          aspect="portrait"
          hideDescription={hideDescription}
          onSelect={onSelectItem ? () => onSelectItem(idx) : undefined}
        />
      ))}
    </AboutGridSection>
  )
}
