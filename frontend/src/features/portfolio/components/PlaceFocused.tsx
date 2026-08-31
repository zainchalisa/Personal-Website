import type { PlaceEntry } from '../aboutTabData'
import focusedStyles from './AboutBrowseFocused.module.css'
import placeStyles from './PlacesTab.module.css'

type PlaceFocusedProps = {
  place: PlaceEntry
  onBack: () => void
}

export function PlaceFocused({ place, onBack }: PlaceFocusedProps) {
  return (
    <div className={focusedStyles.focusedWrap}>
      <div className={focusedStyles.focusedInner}>
        <div className={`${focusedStyles.focusedMedia} ${placeStyles.placeFocusedMedia}`}>
          <img
            className={`${focusedStyles.focusedMediaImg} ${placeStyles.placeFocusedImg}`}
            src={place.imageUrl}
            alt={place.name}
            loading="eager"
            draggable={false}
          />
        </div>
        <div className={focusedStyles.focusedContent}>
          <button type="button" className={focusedStyles.backButton} onClick={onBack}>
            <span className={focusedStyles.backButtonArrow} aria-hidden="true">
              ←
            </span>
            All Places
          </button>
          <h2 className={focusedStyles.focusedTitle}>{place.name}</h2>
          <p className={focusedStyles.focusedMeta}>{place.city}</p>
          <hr className={focusedStyles.focusedDivider} />
          <p className={focusedStyles.focusedNote}>{place.note}</p>
          <div className={focusedStyles.focusedTags}>
            <span className={focusedStyles.focusedTag}>{place.city}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
