import type { MovieEntry } from '../aboutTabData'
import focusedStyles from './AboutBrowseFocused.module.css'
import movieStyles from './MoviesTab.module.css'

type MovieFocusedProps = {
  movie: MovieEntry
  onBack: () => void
}

export function MovieFocused({ movie, onBack }: MovieFocusedProps) {
  return (
    <div className={focusedStyles.focusedWrap}>
      <div className={focusedStyles.focusedInner}>
        <div className={`${focusedStyles.focusedMedia} ${movieStyles.movieFocusedMedia}`}>
          <img
            className={`${focusedStyles.focusedMediaImg} ${movieStyles.movieFocusedImg}`}
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            loading="eager"
            draggable={false}
          />
        </div>
        <div className={focusedStyles.focusedContent}>
          <button type="button" className={focusedStyles.backButton} onClick={onBack}>
            ← All Movies
          </button>
          <h2 className={focusedStyles.focusedTitle}>{movie.title}</h2>
          <p className={focusedStyles.focusedMeta}>
            {movie.year} · {movie.runtime} · {movie.director}
          </p>
          <hr className={focusedStyles.focusedDivider} />
          <p className={focusedStyles.focusedNote}>{movie.note}</p>
        </div>
      </div>
    </div>
  )
}
