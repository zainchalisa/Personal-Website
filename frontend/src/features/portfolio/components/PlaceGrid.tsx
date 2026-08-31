import type { PlaceEntry } from '../aboutTabData'
import { AboutGridSection } from './AboutGridSection'
import { PlaceBrowseCard } from './PlaceBrowseCard'
import gridStyles from './AboutContentTabs.module.css'

type PlaceGridProps = {
  places: PlaceEntry[]
  onSelectItem?: (idx: number) => void
}

export function PlaceGrid({ places, onSelectItem }: PlaceGridProps) {
  return (
    <AboutGridSection label="Places" gridClassName={gridStyles.gridPlaces}>
      {places.map((place, idx) => (
        <PlaceBrowseCard
          key={place.id}
          place={place}
          onSelect={onSelectItem ? () => onSelectItem(idx) : undefined}
        />
      ))}
    </AboutGridSection>
  )
}
