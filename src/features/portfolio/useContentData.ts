import { useEffect, useState } from 'react'
import {
  MOVIE_ENTRIES,
  MUSIC_ENTRIES,
  PLACE_ENTRIES,
  type MusicEntry,
  type PlaceEntry,
} from './aboutTabData'

type ResolvedMovie = (typeof MOVIE_ENTRIES)[number]
export type ResolvedMusic = MusicEntry & { artworkUrl: string }

type ContentDataState = {
  movies: ResolvedMovie[]
  music: ResolvedMusic[]
  places: PlaceEntry[]
  loading: boolean
}

async function fetchSongArtwork(entry: MusicEntry): Promise<string> {
  if (entry.artworkUrl) return entry.artworkUrl

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${entry.artist} ${entry.title}`)}&entity=song&limit=1`,
    )
    if (res.ok) {
      const data = (await res.json()) as { results?: { artworkUrl100?: string }[] }
      const artwork = data.results?.[0]?.artworkUrl100
      if (artwork) return artwork.replace('100x100', '600x600')
    }
  } catch {
    // fall through
  }

  return ''
}

export function useContentData(): ContentDataState {
  const [state, setState] = useState<ContentDataState>({
    movies: MOVIE_ENTRIES,
    music: MUSIC_ENTRIES.map((entry) => ({ ...entry, artworkUrl: entry.artworkUrl ?? '' })),
    places: PLACE_ENTRIES,
    loading: false,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const musicArtwork = await Promise.all(MUSIC_ENTRIES.map(fetchSongArtwork))

      if (cancelled) return

      setState({
        movies: MOVIE_ENTRIES,
        music: MUSIC_ENTRIES.map((entry, i) => ({
          ...entry,
          artworkUrl: musicArtwork[i] ?? entry.artworkUrl ?? '',
        })),
        places: PLACE_ENTRIES,
        loading: false,
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
