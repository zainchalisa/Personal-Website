import type { ResolvedMusic } from '../useContentData'
import { AboutGridSection } from './AboutGridSection'
import { MusicBrowseCard } from './MusicBrowseCard'
import gridStyles from './AboutContentTabs.module.css'

type MusicGridProps = {
  music: ResolvedMusic[]
  loading?: boolean
  onSelectItem?: (idx: number) => void
}

export function MusicGrid({ music, loading, onSelectItem }: MusicGridProps) {
  return (
    <AboutGridSection
      label="Music"
      gridClassName={gridStyles.gridMusic}
    >
      {loading
        ? Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`${gridStyles.skeletonCard} ${gridStyles.skeletonSquare}`} />
          ))
        : music.map((song, idx) => (
            <MusicBrowseCard
              key={song.id}
              song={song}
              onSelect={onSelectItem ? () => onSelectItem(idx) : undefined}
            />
          ))}
    </AboutGridSection>
  )
}
