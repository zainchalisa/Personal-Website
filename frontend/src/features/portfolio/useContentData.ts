import {
  MOVIE_ENTRIES,
  MUSIC_ENTRIES,
  PLACE_ENTRIES,
  type PlaceEntry,
} from './aboutTabData'

type ResolvedMovie = (typeof MOVIE_ENTRIES)[number]
export type ResolvedMusic = (typeof MUSIC_ENTRIES)[number] & { artworkUrl: string }

type ContentDataState = {
  movies: ResolvedMovie[]
  music: ResolvedMusic[]
  places: PlaceEntry[]
  loading: boolean
}

const music: ResolvedMusic[] = MUSIC_ENTRIES.map((entry) => ({
  ...entry,
  artworkUrl: entry.artworkUrl ?? '',
}))

export function useContentData(): ContentDataState {
  return {
    movies: MOVIE_ENTRIES,
    music,
    places: PLACE_ENTRIES,
    loading: false,
  }
}
