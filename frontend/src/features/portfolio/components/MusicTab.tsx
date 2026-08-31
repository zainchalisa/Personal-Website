import type { ResolvedMusic } from '../useContentData'
import { AboutMobileCarousel } from './AboutMobileCarousel'
import { MusicMobileSlide } from './AboutMobileCarouselSlides'
import { BrowseFocusedShell } from './BrowseFocusedShell'
import { MusicFocused } from './MusicFocused'
import { MusicGrid } from './MusicGrid'

type MusicTabProps = {
  music: ResolvedMusic[]
  loading?: boolean
  activeMusicIdx: number | null
  onClearFocus: () => void
  onSelectItem?: (idx: number, itemId?: string) => void
  variant?: 'desktop' | 'mobile'
}

export function MusicTab({
  music,
  loading,
  activeMusicIdx,
  onClearFocus,
  onSelectItem,
  variant = 'desktop',
}: MusicTabProps) {
  const focusedSong = activeMusicIdx !== null ? music[activeMusicIdx] : null
  const isBrowse = focusedSong === null

  if (variant === 'mobile') {
    return (
      <AboutMobileCarousel
        items={music}
        activeIdx={activeMusicIdx ?? 0}
        onActiveChange={(idx) => onSelectItem?.(idx, music[idx]?.id)}
        getKey={(song) => song.id}
        renderSlide={(song) => <MusicMobileSlide song={song} />}
        loading={loading}
      />
    )
  }

  return (
    <BrowseFocusedShell
      variant={variant}
      isBrowse={isBrowse}
      browse={<MusicGrid music={music} loading={loading} onSelectItem={onSelectItem} />}
      focused={focusedSong ? <MusicFocused song={focusedSong} onBack={onClearFocus} /> : null}
    />
  )
}
