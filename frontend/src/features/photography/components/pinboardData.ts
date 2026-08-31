import {
  getCountryCardsForRegion,
  type CountryCardData,
  type PinboardPhoto,
  type PinboardRegion,
} from './photographyPhotos'
import { REGION_COUNTRY_TOTALS, type PinboardRegionTotalId } from './regionCountryTotals'
import { countryPhotoColors } from './pinboardUtils'

export type BoardRegionId =
  | 'north-america'
  | 'south-america'
  | 'europe'
  | 'africa'
  | 'asia'
  | 'oceania'

export type BoardCountryLayout = {
  card: CountryCardData
  x: number
  y: number
  rot: number
  w: number
  z: number
  c1: string
  c2: string
}

export type BoardRegionLayout = {
  id: BoardRegionId
  name: string
  pin: string
  total: number
  cx: number
  cy: number
  /** When set, country cards are loaded from photographyPhotos for this region */
  dataRegion?: PinboardRegion
  countries: BoardCountryLayout[]
}

/** Scattered hub positions on the 2600×1400 board (rough geography, not a grid). */
const BOARD_REGION_DEFS: {
  id: BoardRegionId
  name: string
  pin: string
  cx: number
  cy: number
  dataRegion?: PinboardRegion
}[] = [
  {
    id: 'north-america',
    name: 'North America',
    pin: '#b8892a',
    cx: 520,
    cy: 360,
    dataRegion: 'NORTH AMERICA',
  },
  {
    id: 'south-america',
    name: 'South America',
    pin: '#b8892a',
    cx: 720,
    cy: 1060,
    dataRegion: 'SOUTH AMERICA',
  },
  {
    id: 'europe',
    name: 'Europe',
    pin: '#b8892a',
    cx: 1300,
    cy: 300,
    dataRegion: 'EUROPE',
  },
  {
    id: 'africa',
    name: 'Africa',
    pin: '#b8892a',
    cx: 1400,
    cy: 1020,
    dataRegion: 'AFRICA',
  },
  {
    id: 'asia',
    name: 'Asia',
    pin: '#b8892a',
    cx: 2040,
    cy: 380,
    dataRegion: 'ASIA',
  },
  {
    id: 'oceania',
    name: 'Oceania',
    pin: '#b8892a',
    cx: 2220,
    cy: 1080,
    dataRegion: 'OCEANIA',
  },
]

/** Offset country grids from each hub so clusters fan in different directions. */
const GRID_OFFSET: Record<BoardRegionId, { dx: number; dy: number }> = {
  'north-america': { dx: -20, dy: 68 },
  'south-america': { dx: -50, dy: 85 },
  europe: { dx: -20, dy: 62 },
  africa: { dx: 10, dy: 80 },
  asia: { dx: 80, dy: 70 },
  oceania: { dx: 70, dy: 75 },
}

/** Base card width for scrap clusters (px). */
const CARD_BASE_W = 98
const MOBILE_CARD_SCALE = 0.7
const MOBILE_ROT_SPREAD = 12

/** Grid step — slightly smaller than card size so polaroids overlap like a scrap board. */
const SCRAP_STEP_X = 150
const SCRAP_STEP_Y = 120

function pickGridCols(count: number): number {
  if (count <= 1) return 1
  if (count <= 4) return 2
  if (count <= 9) return 3
  return 4
}

function scrapOffset(seed: string, salt: number, spread: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return ((Math.abs(h) + salt) % (spread * 2 + 1)) - spread
}

export type BuildBoardOptions = {
  mobile?: boolean
}

/** Tight, overlapping polaroid cluster around each region hub. */
function layoutCountries(
  cards: CountryCardData[],
  cx: number,
  cy: number,
  regionId: BoardRegionId,
  options?: BuildBoardOptions,
): BoardCountryLayout[] {
  const n = cards.length
  if (n === 0) return []

  const mobile = options?.mobile ?? false
  const cardBaseW = mobile ? Math.round(CARD_BASE_W * MOBILE_CARD_SCALE) : CARD_BASE_W
  const rotSpread = mobile ? MOBILE_ROT_SPREAD : 9
  const wJitter = mobile ? 4 : 6
  const xSpread = mobile ? 22 : 16
  const ySpread = mobile ? 20 : 14

  const cols = pickGridCols(n)
  const gridW = (cols - 1) * SCRAP_STEP_X + cardBaseW
  const { dx, dy } = GRID_OFFSET[regionId]
  const originX = cx - gridW / 2 + dx
  const originY = cy + dy

  return cards.map((card, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const rowStagger = row % 2 === 1 ? SCRAP_STEP_X * 0.38 : 0
    const [c1, c2] = countryPhotoColors(card.country)
    // Card name renders in 11px mono; widen the card so the longest word never clips.
    const longestWord = Math.max(
      1,
      ...card.displayName.split(/\s+/).map((word) => word.length),
    )
    const nameMinW = Math.ceil(longestWord * 6.8 + 16)
    const w = Math.max(cardBaseW + scrapOffset(card.country, i, wJitter), nameMinW)
    return {
      card,
      x: originX + col * SCRAP_STEP_X + rowStagger + scrapOffset(card.country, i * 3, xSpread),
      y: originY + row * SCRAP_STEP_Y + scrapOffset(card.country, i * 5, ySpread),
      rot: scrapOffset(card.country, i * 137, rotSpread),
      w,
      z: i + 1,
      c1,
      c2,
    }
  })
}

/** Visual height of a polaroid card from its layout width. */
function cardLayoutHeight(c: BoardCountryLayout): number {
  return Math.round(c.w * 0.75 + 34)
}

/** World-space center for camera when focusing a region (country cards only). */
export function getRegionFocusPoint(region: BoardRegionLayout): { x: number; y: number } {
  if (region.countries.length === 0) {
    return { x: region.cx, y: region.cy }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const c of region.countries) {
    minX = Math.min(minX, c.x)
    maxX = Math.max(maxX, c.x + c.w)
    minY = Math.min(minY, c.y)
    maxY = Math.max(maxY, c.y + cardLayoutHeight(c))
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

export function buildBoardRegions(options?: BuildBoardOptions): BoardRegionLayout[] {
  return BOARD_REGION_DEFS.map((def) => {
    const cards = def.dataRegion
      ? getCountryCardsForRegion(def.dataRegion)
      : []
    return {
      id: def.id,
      name: def.name,
      pin: def.pin,
      total: REGION_COUNTRY_TOTALS[def.id as PinboardRegionTotalId],
      cx: def.cx,
      cy: def.cy,
      dataRegion: def.dataRegion,
      countries: layoutCountries(cards, def.cx, def.cy, def.id, options),
    }
  }).filter((region) => region.countries.length > 0)
}

export function getRegionWithMostPlaces(
  regions: BoardRegionLayout[],
): BoardRegionLayout | null {
  if (regions.length === 0) return null

  const photoCount = (region: BoardRegionLayout) =>
    region.countries.reduce((sum, country) => sum + country.card.photoCount, 0)

  return regions.reduce((best, region) => {
    const bestPhotos = photoCount(best)
    const regionPhotos = photoCount(region)
    if (regionPhotos > bestPhotos) return region
    if (regionPhotos < bestPhotos) return best
    if (region.countries.length > best.countries.length) return region
    return best
  })
}

export function resolvePhotographyOpenRegion(
  regions: BoardRegionLayout[],
  options?: {
    slideshowCountry?: string | null
    activeRegionId?: BoardRegionId | null
  },
): BoardRegionLayout | null {
  if (options?.slideshowCountry) {
    for (const region of regions) {
      if (region.countries.some((country) => country.card.country === options.slideshowCountry)) {
        return region
      }
    }
  }

  if (options?.activeRegionId) {
    const savedRegion = regions.find((region) => region.id === options.activeRegionId)
    if (savedRegion) return savedRegion
  }

  return getRegionWithMostPlaces(regions)
}

export type SlideshowTarget = {
  country: string
  displayName: string
  regionName: string
  photoCount: number
  photos: PinboardPhoto[]
  c1: string
  c2: string
}

export function toSlideshowTarget(
  layout: BoardCountryLayout,
  regionName: string,
): SlideshowTarget {
  return {
    country: layout.card.country,
    displayName: layout.card.displayName,
    regionName,
    photoCount: layout.card.photoCount,
    photos: layout.card.photos,
    c1: layout.c1,
    c2: layout.c2,
  }
}
