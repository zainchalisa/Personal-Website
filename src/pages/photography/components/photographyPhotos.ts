export type PinboardRegion = 'NORTH AMERICA' | 'EUROPE' | 'ASIA'

export type PinboardPhoto = {
  id: string
  city: string
  country: string
  year: number
  src: string | null
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
  Germany: 'EUROPE',
  Austria: 'EUROPE',
  Hungary: 'EUROPE',
  'Czech Republic': 'EUROPE',
  Turkey: 'EUROPE',
  'Vatican City': 'EUROPE',
  India: 'ASIA',
}

/** Display order for country cards within each region */
const COUNTRY_ORDER: Record<PinboardRegion, readonly string[]> = {
  'NORTH AMERICA': ['United States', 'Canada'],
  EUROPE: [
    'Italy',
    'Switzerland',
    'France',
    'England',
    'Scotland',
    'Monaco',
    'Spain',
    'Germany',
    'Austria',
    'Hungary',
    'Czech Republic',
    'Turkey',
    'Vatican City',
  ],
  ASIA: ['India'],
}

const COUNTRY_DISPLAY: Record<string, string> = {}

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
  { city: 'Berlin', country: 'Germany', year: 2023, src: null },
  { city: 'Vienna', country: 'Austria', year: 2023, src: null },
  { city: 'Budapest', country: 'Hungary', year: 2023, src: null },
  { city: 'Prague', country: 'Czech Republic', year: 2023, src: null },
  { city: 'Istanbul', country: 'Turkey', year: 2023, src: null },
  { city: 'Vatican City', country: 'Vatican City', year: 2023, src: null },
  { city: 'Mumbai', country: 'India', year: 2022, src: null },
]

export const PINBOARD_PHOTOS: PinboardPhoto[] = RAW.map((p, i) => ({
  ...p,
  id: `${p.city.toLowerCase().replace(/\s+/g, '-')}-${i}`,
  region: REGION_BY_COUNTRY[p.country] ?? 'EUROPE',
}))

export const PINBOARD_REGIONS: PinboardRegion[] = ['NORTH AMERICA', 'EUROPE', 'ASIA']

export function displayCountryName(country: string): string {
  return COUNTRY_DISPLAY[country] ?? country
}

export function getPhotosByRegion(region: PinboardRegion): PinboardPhoto[] {
  return PINBOARD_PHOTOS.filter((p) => p.region === region)
}

export function getPhotosForCountry(country: string): PinboardPhoto[] {
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

export function getCountriesByRegion(): Record<PinboardRegion, string[]> {
  const out = {} as Record<PinboardRegion, string[]>
  for (const region of PINBOARD_REGIONS) {
    const countries = [...new Set(getPhotosByRegion(region).map((p) => p.country))]
    out[region] = sortCountriesByRegion(countries, region)
  }
  return out
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
