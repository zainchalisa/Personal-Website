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

export type SectionLayout = {
  center: [number, number]
  label: [number, number]
  zoom: { position: [number, number, number]; zoom: number }
}

export const SECTION_LAYOUT: Record<PinboardRegion, SectionLayout> = {
  'NORTH AMERICA': {
    center: [-4.35, -0.35],
    label: [-4.35, 2.55],
    zoom: { position: [-4.35, -0.35, 0], zoom: 2.55 },
  },
  EUROPE: {
    center: [0, -0.35],
    label: [0, 2.55],
    zoom: { position: [0, -0.35, 0], zoom: 2.45 },
  },
  ASIA: {
    center: [4.35, -0.35],
    label: [4.35, 2.55],
    zoom: { position: [4.35, -0.35, 0], zoom: 2.55 },
  },
}

export const BOARD = {
  width: 24,
  height: 9,
  /** Camera padding — lower = zoomed in (cover fit) */
  margin: 0.94,
  /** Default orthographic zoom on the full board view */
  defaultZoom: 1.22,
}

export type BoardPalette = {
  cork: string
  paper: string
  ink: string
  muted: string
  accent: string
  string: string
  pins: readonly [string, string, string]
  /** Canvas / page backdrop behind the board */
  background: string
  textPrimary: string
  textMuted: string
  corkBorder: string
  boardShadowOpacity: number
  corkSpeckle: number
}

export const BOARD_PALETTE: Record<'light' | 'dark', BoardPalette> = {
  light: {
    cork: '#b89872',
    paper: '#faf8f4',
    ink: '#1f1c18',
    muted: '#8a8278',
    accent: '#b86828',
    string: '#c4783a',
    pins: ['#c4783a', '#e8e4dc', '#6a6258'],
    background: '#e8e2d6',
    textPrimary: '#1f1c18',
    textMuted: '#5c574f',
    corkBorder: '#9a8468',
    boardShadowOpacity: 0.22,
    corkSpeckle: 0.03,
  },
  dark: {
    cork: '#4a4034',
    paper: '#f0ece4',
    ink: '#faf8f4',
    muted: '#9a948a',
    accent: '#d4894a',
    string: '#d4894a',
    pins: ['#d4894a', '#f5f2ec', '#7a7368'],
    background: '#0c0b0a',
    textPrimary: '#2a2620',
    textMuted: '#5e5850',
    corkBorder: '#3a3228',
    boardShadowOpacity: 0.35,
    corkSpeckle: 0.04,
  },
}

export function displayCountryName(country: string): string {
  return COUNTRY_DISPLAY[country] ?? country
}

export function formatRegionLabel(region: PinboardRegion): string {
  return region
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export type CountryLayoutView = {
  halfW: number
  halfH: number
}

const BASE_CARD_W = 1.42
const BASE_CARD_H = 0.98
/** Footprint used for grid spacing (card size + small clearance) */
const CARD_BOUNDS_W = BASE_CARD_W * 1.06
const CARD_BOUNDS_H = BASE_CARD_H * 1.05
const MIN_GAP_X = 0.34
const MIN_GAP_Y = 0.26
const MIN_GAP_X_FLOOR = 0.24
const MIN_GAP_Y_FLOOR = 0.2
const COUNTRY_LAYOUT_FILL = 0.98
const COUNTRY_LAYOUT_MAX_SCALE = 1.22
const COUNTRY_VIEW_PAD_X = 0.42
const COUNTRY_VIEW_PAD_TOP = 0.5
const COUNTRY_VIEW_PAD_BOTTOM = 0.36
function maxColsForCount(n: number): number {
  if (n <= 4) return n
  if (n <= 6) return 3
  return 4
}

function countryGridGaps(scale: number): { gapX: number; gapY: number } {
  return {
    gapX: Math.max(MIN_GAP_X * scale, MIN_GAP_X_FLOOR),
    gapY: Math.max(MIN_GAP_Y * scale, MIN_GAP_Y_FLOOR),
  }
}

function gridScaleFor(
  cols: number,
  rows: number,
  usableW: number,
  usableH: number,
): number {
  const gridW = (cols - 1) * (CARD_BOUNDS_W + MIN_GAP_X) + BASE_CARD_W
  const gridH = (rows - 1) * (CARD_BOUNDS_H + MIN_GAP_Y) + BASE_CARD_H
  const raw = Math.min(usableW / gridW, usableH / gridH) * COUNTRY_LAYOUT_FILL
  return Math.min(COUNTRY_LAYOUT_MAX_SCALE, Math.max(0.55, raw))
}

/** Visible half-extents for the full board (matches the default camera frustum). */
export function getBoardViewHalfExtents(aspect: number): { halfW: number; halfH: number } {
  const minHalfW = (BOARD.width / 2) * BOARD.margin
  const minHalfH = (BOARD.height / 2) * BOARD.margin
  let halfW = minHalfW
  let halfH = halfW / aspect
  if (halfH > minHalfH) {
    halfH = minHalfH
    halfW = halfH * aspect
  }
  return { halfW, halfH }
}

function pickCountryGridCols(n: number, gridAspect: number): number {
  const colLimit = maxColsForCount(n)
  let bestCols = 1
  let bestScore = Infinity
  for (let cols = 1; cols <= colLimit; cols++) {
    const rows = Math.ceil(n / cols)
    const aspectDiff = Math.abs(cols / rows - gridAspect)
    if (aspectDiff < bestScore) {
      bestScore = aspectDiff
      bestCols = cols
    }
  }
  return bestCols
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

export type CountryCardLayout = {
  card: CountryCardData
  x: number
  y: number
  z: number
  rotation: number
  scale: number
}

/** Grid for country cards — scales to fit the visible viewport when focused. */
export function layoutCountryCards(
  cards: CountryCardData[],
  center: [number, number],
  view?: CountryLayoutView,
): CountryCardLayout[] {
  const n = cards.length
  if (n === 0) return []

  const halfW = view?.halfW ?? 5.5
  const halfH = view?.halfH ?? 3.1
  const usableW = halfW * 2 - COUNTRY_VIEW_PAD_X * 2
  const usableH = halfH * 2 - COUNTRY_VIEW_PAD_TOP - COUNTRY_VIEW_PAD_BOTTOM
  const viewAspect = usableW / Math.max(usableH, 0.1)

  const cols = pickCountryGridCols(n, viewAspect)
  const rows = Math.ceil(n / cols)
  const scale = gridScaleFor(cols, rows, usableW, usableH)

  const { gapX, gapY } = countryGridGaps(scale)
  const cellW = CARD_BOUNDS_W * scale + gapX
  const cellH = CARD_BOUNDS_H * scale + gapY
  const cardW = BASE_CARD_W * scale
  const cardH = BASE_CARD_H * scale
  const totalW = (cols - 1) * cellW + cardW
  const totalH = (rows - 1) * cellH + cardH
  const startX = center[0] - totalW / 2 + cardW / 2
  const startY = center[1] + totalH / 2 - cardH / 2 - 0.08

  return cards.map((card, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * cellW
    const y = startY - row * cellH
    const rotation = (row % 2) * 0.006 - 0.003
    return { card, x, y, z: 0.06 + row * 0.002, rotation, scale }
  })
}

export type RegionClusterLayout = {
  region: PinboardRegion
  x: number
  y: number
  rotation: number
  countryCount: number
  photoCount: number
}

export function layoutRegionClusters(): RegionClusterLayout[] {
  return PINBOARD_REGIONS.map((region, i) => {
    const cards = getCountryCardsForRegion(region)
    const photos = getPhotosByRegion(region)
    const [cx, cy] = SECTION_LAYOUT[region].center
    return {
      region,
      x: cx,
      y: cy + 0.35,
      rotation: (i - 1) * 0.035,
      countryCount: cards.length,
      photoCount: photos.length,
    }
  })
}
