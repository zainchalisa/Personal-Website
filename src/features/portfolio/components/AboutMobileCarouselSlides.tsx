import type { MovieEntry, MusicEntry, PlaceEntry } from '../aboutTabData'
import type { ResolvedMusic } from '../useContentData'
import styles from './AboutMobileCarousel.module.css'

export function MovieMobileSlide({ movie }: { movie: MovieEntry }) {
  return (
    <div className={styles.slideInner}>
      <div className={`${styles.mediaFrame} ${styles.mediaFramePortrait}`}>
        <img
          className={styles.mediaImg}
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          loading="eager"
          draggable={false}
        />
      </div>
      <h2 className={styles.slideTitle}>{movie.title}</h2>
      <div className={styles.slideDetails}>
        <p className={styles.slideMeta}>
          {movie.year} · {movie.runtime} · {movie.director}
        </p>
        <p className={styles.slideNote}>{movie.mobileNote}</p>
      </div>
    </div>
  )
}

export function MusicMobileSlide({ song }: { song: ResolvedMusic | MusicEntry }) {
  return (
    <div className={styles.slideInner}>
      <div className={`${styles.mediaFrame} ${styles.mediaFrameSquare}`}>
        {song.artworkUrl ? (
          <img
            className={styles.mediaImg}
            src={song.artworkUrl}
            alt={`${song.title} by ${song.artist} album art`}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className={styles.mediaPlaceholder} aria-hidden />
        )}
      </div>
      <h2 className={styles.slideTitle}>{song.title}</h2>
      <div className={styles.slideDetails}>
        <p className={styles.slideMeta}>
          {song.artist} · {song.album}
        </p>
        <p className={styles.slideNote}>{song.note}</p>
      </div>
    </div>
  )
}

export function PlaceMobileSlide({ place }: { place: PlaceEntry }) {
  return (
    <div className={styles.slideInner}>
      <div className={`${styles.mediaFrame} ${styles.mediaFrameLandscape}`}>
        <img
          className={styles.mediaImg}
          src={place.imageUrl}
          alt={place.name}
          loading="eager"
          draggable={false}
        />
      </div>
      <h2 className={styles.slideTitle}>{place.name}</h2>
      <div className={styles.slideDetails}>
        <p className={styles.slideMeta}>
          {place.city} · {place.year}
        </p>
        <p className={styles.slideNote}>{place.note}</p>
      </div>
    </div>
  )
}
