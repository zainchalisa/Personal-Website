import { assetUrl } from '@/shared/lib/assetUrl'

export const ABOUT_MUSIC_IMAGES = {
  overdueAlbumCover: assetUrl('/music/overdue-album-cover.png'),
  dearAprilAlbumCover: assetUrl('/music/dear-april-album-cover.jpg'),
  dontPanicAlbumCover: assetUrl('/music/dont-panic-album-cover.jpg'),
  coldestWinterAlbumCover: assetUrl('/music/coldest-winter-album-cover.jpg'),
  allINeedAlbumCover: assetUrl('/music/all-i-need-album-cover.jpg'),
} as const

export const ABOUT_MOVIE_IMAGES = {
  laLaLand: assetUrl('/movies/la-la-land.jpg'),
  taareZameenPar: assetUrl('/movies/taare-zameen-par.png'),
  harryPotter: assetUrl('/movies/harry-potter.jpg'),
  fruitvaleStation: assetUrl('/movies/fruitvale-station.jpg'),
  socialNetwork: assetUrl('/movies/social-network.jpg'),
} as const

export const ABOUT_PLACE_IMAGES = {
  englishCountryside: assetUrl('/places/english-countryside.jpg'),
  pierNyc: assetUrl('/places/pier-nyc.jpg'),
  dolomites: assetUrl('/places/dolomites.jpg'),
  oceanCityBeach: assetUrl('/places/ocean-city-beach.jpg'),
  innsbruck: assetUrl('/places/innsbruck.jpg'),
} as const
