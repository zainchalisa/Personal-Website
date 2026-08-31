import {
  photographyDisplayUrl,
  photographyOriginalUrl,
  photographyThumbUrl,
} from '../photographyAssetUrls'
import {
  PHOTOGRAPHY_ASSET_MANIFEST,
  type PhotographyAssetFolder,
} from '../photographyAssetManifest'

export type PinboardRegion =
  | 'NORTH AMERICA'
  | 'SOUTH AMERICA'
  | 'EUROPE'
  | 'AFRICA'
  | 'ASIA'
  | 'OCEANIA'

export type PinboardPhoto = {
  id: string
  city: string
  country: string
  year: number
  /** Slideshow / gallery (~1920px WebP). */
  src: string | null
  /** Pinboard card preview (~320px WebP). */
  thumbSrc: string | null
  /** Full-resolution original (fallback). */
  originalSrc: string | null
  region: PinboardRegion
}

export type CountryCardData = {
  country: string
  displayName: string
  region: PinboardRegion
  photos: PinboardPhoto[]
  photoCount: number
  cities: string[]
  previewPhoto: PinboardPhoto | null
}

const REGION_BY_COUNTRY: Record<string, PinboardRegion> = {
  'United States': 'NORTH AMERICA',
  Canada: 'NORTH AMERICA',
  Italy: 'EUROPE',
  Switzerland: 'EUROPE',
  France: 'EUROPE',
  England: 'EUROPE',
  Scotland: 'EUROPE',
  Monaco: 'EUROPE',
  Spain: 'EUROPE',
  // Turkey is transcontinental; under a continent model it sits in Asia (Western Asia).
  Turkey: 'ASIA',
  India: 'ASIA',
}

/** Display order for country cards within each region */
const COUNTRY_ORDER: Record<PinboardRegion, readonly string[]> = {
  'NORTH AMERICA': ['United States', 'Canada'],
  'SOUTH AMERICA': [],
  EUROPE: [
    'Italy',
    'Switzerland',
    'France',
    'England',
    'Scotland',
    'Monaco',
    'Spain',
  ],
  AFRICA: [],
  ASIA: ['India', 'Turkey'],
  OCEANIA: [],
}

const COUNTRY_DISPLAY: Record<string, string> = {}

/** Maps display country names to assets/photography folder names on Cloudflare. */
const PHOTOGRAPHY_FOLDER_BY_COUNTRY: Record<string, PhotographyAssetFolder> = {
  'United States': 'united states',
  Canada: 'canada',
  Italy: 'italy',
  Switzerland: 'switzerland',
  France: 'france',
  England: 'england',
  Scotland: 'scotland',
  Monaco: 'monaco',
  Spain: 'spain',
  Turkey: 'turkey',
  India: 'india',
}

const RAW: { city: string; country: string; year: number; src: string | null }[] = [
  { city: 'New York City', country: 'United States', year: 2023, src: null },
  { city: 'Los Angeles', country: 'United States', year: 2022, src: null },
  { city: 'Toronto', country: 'Canada', year: 2023, src: null },
  { city: 'Rome', country: 'Italy', year: 2023, src: null },
  { city: 'Zurich', country: 'Switzerland', year: 2023, src: null },
  { city: 'Paris', country: 'France', year: 2023, src: null },
  { city: 'London', country: 'England', year: 2023, src: null },
  { city: 'Edinburgh', country: 'Scotland', year: 2023, src: null },
  { city: 'Monte Carlo', country: 'Monaco', year: 2023, src: null },
  { city: 'Barcelona', country: 'Spain', year: 2022, src: null },
  { city: 'Istanbul', country: 'Turkey', year: 2023, src: null },
  { city: 'Mumbai', country: 'India', year: 2022, src: null },
]

function buildCloudflarePhotos(): PinboardPhoto[] {
  const photos: PinboardPhoto[] = []

  for (const [country, folder] of Object.entries(PHOTOGRAPHY_FOLDER_BY_COUNTRY)) {
    const files = PHOTOGRAPHY_ASSET_MANIFEST[folder]
    const region = REGION_BY_COUNTRY[country] ?? 'EUROPE'

    for (const filename of files) {
      photos.push({
        id: `${folder}-${filename}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        city: country,
        country,
        year: 2023,
        src: photographyDisplayUrl(folder, filename),
        thumbSrc: photographyThumbUrl(folder, filename),
        originalSrc: photographyOriginalUrl(folder, filename),
        region,
      })
    }
  }

  return photos
}

const PLACEHOLDER_PHOTOS: PinboardPhoto[] = RAW.filter(
  (entry) => !(entry.country in PHOTOGRAPHY_FOLDER_BY_COUNTRY),
).map((entry, i) => ({
  ...entry,
  id: `${entry.city.toLowerCase().replace(/\s+/g, '-')}-placeholder-${i}`,
  thumbSrc: null,
  originalSrc: null,
  region: REGION_BY_COUNTRY[entry.country] ?? 'EUROPE',
}))

const PINBOARD_PHOTOS: PinboardPhoto[] = [...buildCloudflarePhotos(), ...PLACEHOLDER_PHOTOS]

const PINBOARD_REGIONS: PinboardRegion[] = [
  'NORTH AMERICA',
  'SOUTH AMERICA',
  'EUROPE',
  'AFRICA',
  'ASIA',
  'OCEANIA',
]

function displayCountryName(country: string): string {
  return COUNTRY_DISPLAY[country] ?? country
}

function getPhotosByRegion(region: PinboardRegion): PinboardPhoto[] {
  return PINBOARD_PHOTOS.filter((p) => p.region === region)
}

function getPhotosForCountry(country: string): PinboardPhoto[] {
  return PINBOARD_PHOTOS.filter((p) => p.country === country)
}

function sortCountriesByRegion(countries: string[], region: PinboardRegion): string[] {
  const order = COUNTRY_ORDER[region]
  return [...countries].sort((a, b) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai === -1 && bi === -1) return displayCountryName(a).localeCompare(displayCountryName(b))
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function getCountriesByRegion(): Record<PinboardRegion, string[]> {
  const out = {} as Record<PinboardRegion, string[]>
  for (const region of PINBOARD_REGIONS) {
    const countries = [...new Set(getPhotosByRegion(region).map((p) => p.country))]
    out[region] = sortCountriesByRegion(countries, region)
  }
  return out
}

export function hasPinboardPhotoAssets(): boolean {
  return PINBOARD_PHOTOS.some((photo) => photo.src != null)
}

export function getCountryCardsForRegion(region: PinboardRegion): CountryCardData[] {
  return getCountriesByRegion()[region].map((country) => {
    const photos = getPhotosForCountry(country)
    const cities = [...new Set(photos.map((p) => p.city))].sort()
    return {
      country,
      displayName: displayCountryName(country),
      region,
      photos,
      photoCount: photos.length,
      cities,
      previewPhoto: photos[0] ?? null,
    }
  })
}
