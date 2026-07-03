import type { PlaceEntry } from '../aboutTabData'
import { AboutMobileCarousel } from './AboutMobileCarousel'
import { PlaceMobileSlide } from './AboutMobileCarouselSlides'
import { BrowseFocusedShell } from './BrowseFocusedShell'
import { PlaceFocused } from './PlaceFocused'
import { PlaceGrid } from './PlaceGrid'

type PlacesTabProps = {
  places: PlaceEntry[]
  activePlaceIdx: number | null
  onClearFocus: () => void
  onSelectItem?: (idx: number, itemId?: string) => void
  variant?: 'desktop' | 'mobile'
}

export function PlacesTab({
  places,
  activePlaceIdx,
  onClearFocus,
  onSelectItem,
  variant = 'desktop',
}: PlacesTabProps) {
  const focusedPlace = activePlaceIdx !== null ? places[activePlaceIdx] : null
  const isBrowse = focusedPlace === null

  if (variant === 'mobile') {
    return (
      <AboutMobileCarousel
        items={places}
        activeIdx={activePlaceIdx ?? 0}
        onActiveChange={(idx) => onSelectItem?.(idx, places[idx]?.id)}
        getKey={(place) => place.id}
        renderSlide={(place) => <PlaceMobileSlide place={place} />}
      />
    )
  }

  return (
    <BrowseFocusedShell
      variant={variant}
      isBrowse={isBrowse}
      browse={<PlaceGrid places={places} onSelectItem={onSelectItem} />}
      focused={focusedPlace ? <PlaceFocused place={focusedPlace} onBack={onClearFocus} /> : null}
    />
  )
}
