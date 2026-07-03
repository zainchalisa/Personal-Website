import type { ResolvedMusic } from '../useContentData'
import focusedStyles from './AboutBrowseFocused.module.css'
import musicStyles from './MusicTab.module.css'

type MusicFocusedProps = {
  song: ResolvedMusic
  onBack: () => void
}

export function MusicFocused({ song, onBack }: MusicFocusedProps) {
  return (
    <div className={focusedStyles.focusedWrap}>
      <div className={focusedStyles.focusedInner}>
        <div className={`${focusedStyles.focusedMedia} ${musicStyles.musicFocusedMedia}`}>
          {song.artworkUrl ? (
            <img
              className={`${focusedStyles.focusedMediaImg} ${musicStyles.musicFocusedImg}`}
              src={song.artworkUrl}
              alt={`${song.title} by ${song.artist} album art`}
              loading="eager"
              draggable={false}
            />
          ) : (
            <div
              className={`${focusedStyles.focusedMediaImg} ${musicStyles.musicFocusedImg} ${musicStyles.musicArtPlaceholder}`}
              aria-hidden
            />
          )}
        </div>
        <div className={focusedStyles.focusedContent}>
          <button type="button" className={focusedStyles.backButton} onClick={onBack}>
            ← All Songs
          </button>
          <h2 className={focusedStyles.focusedTitle}>{song.title}</h2>
          <p className={focusedStyles.focusedMeta}>
            {song.artist} · {song.album}
          </p>
          <hr className={focusedStyles.focusedDivider} />
          <p className={focusedStyles.focusedNote}>{song.note}</p>
        </div>
      </div>
    </div>
  )
}
