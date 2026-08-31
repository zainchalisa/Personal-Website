import type { ResolvedMusic } from '../useContentData'
import musicStyles from './MusicTab.module.css'

type MusicBrowseCardProps = {
  song: ResolvedMusic
  onSelect?: () => void
}

export function MusicBrowseCard({ song, onSelect }: MusicBrowseCardProps) {
  return (
    <article
      className={`${musicStyles.musicCard}${onSelect ? ` ${musicStyles.musicCardInteractive}` : ''}`}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? 'button' : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect()
              }
            }
          : undefined
      }
    >
      <div className={musicStyles.musicArtFrame}>
        {song.artworkUrl ? (
          <img
            className={musicStyles.musicArt}
            src={song.artworkUrl}
            alt={`${song.title} by ${song.artist} album art`}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className={musicStyles.musicArtPlaceholder} aria-hidden />
        )}
      </div>
      <div className={musicStyles.musicMeta}>
        <p className={musicStyles.musicTitle}>{song.title}</p>
        <p className={musicStyles.musicArtist}>{song.artist}</p>
      </div>
    </article>
  )
}
