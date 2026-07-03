import type { PlaceEntry } from '../aboutTabData'
import placeStyles from './PlacesTab.module.css'

type PlaceBrowseCardProps = {
  place: PlaceEntry
  onSelect?: () => void
}

export function PlaceBrowseCard({ place, onSelect }: PlaceBrowseCardProps) {
  return (
    <article
      className={`${placeStyles.placeCard}${onSelect ? ` ${placeStyles.placeCardInteractive}` : ''}`}
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
      <div className={placeStyles.placePhotoFrame}>
        <img
          className={placeStyles.placePhoto}
          src={place.imageUrl}
          alt={place.name}
          loading="eager"
          draggable={false}
        />
      </div>
      <div className={placeStyles.placeMeta}>
        <p className={placeStyles.placeName}>{place.name}</p>
        <p className={placeStyles.placeCity}>{place.city}</p>
      </div>
    </article>
  )
}
