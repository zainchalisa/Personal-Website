import {
  getCountryCardsForRegion,
  type CountryCardData,
  type PinboardPhoto,
  type PinboardRegion,
} from './photographyPhotos'
import { REGION_COUNTRY_TOTALS, type PinboardRegionTotalId } from './regionCountryTotals'
import { countryPhotoColors } from './pinboardUtils'

export type BoardRegionId =
  | 'europe'
  | 'east-asia'
  | 'se-asia'
  | 'americas'
  | 'africa'
  | 'middle-east'

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
    id: 'europe',
    name: 'Europe',
    pin: '#b8892a',
    cx: 1080,
    cy: 200,
    dataRegion: 'EUROPE',
  },
  {
    id: 'east-asia',
    name: 'East Asia',
    pin: '#b8892a',
    cx: 340,
    cy: 260,
    dataRegion: 'ASIA',
  },
  {
    id: 'se-asia',
    name: 'SE Asia',
    pin: '#b8892a',
    cx: 520,
    cy: 1080,
  },
  {
    id: 'americas',
    name: 'Americas',
    pin: '#b8892a',
    cx: 1980,
    cy: 540,
    dataRegion: 'NORTH AMERICA',
  },
  {
    id: 'africa',
    name: 'Africa',
    pin: '#b8892a',
    cx: 1240,
    cy: 1140,
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    pin: '#b8892a',
    cx: 1920,
    cy: 180,
  },
]

/** Offset country grids from each hub so clusters fan in different directions. */
const GRID_OFFSET: Record<BoardRegionId, { dx: number; dy: number }> = {
  'east-asia': { dx: 80, dy: 70 },
  'se-asia': { dx: -50, dy: 85 },
  europe: { dx: -20, dy: 62 },
  'middle-east': { dx: 70, dy: 75 },
  africa: { dx: 10, dy: 80 },
  americas: { dx: -20, dy: 68 },
}

/** Base card width for scrap clusters (px). */
const CARD_BASE_W = 98
const CARD_LAYOUT_H = 132

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

/** Tight, overlapping polaroid cluster around each region hub. */
function layoutCountries(
  cards: CountryCardData[],
  cx: number,
  cy: number,
  regionId: BoardRegionId,
): BoardCountryLayout[] {
  const n = cards.length
  if (n === 0) return []

  const cols = pickGridCols(n)
  const gridW = (cols - 1) * SCRAP_STEP_X + CARD_BASE_W
  const { dx, dy } = GRID_OFFSET[regionId]
  const originX = cx - gridW / 2 + dx
  const originY = cy + dy

  return cards.map((card, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const rowStagger = row % 2 === 1 ? SCRAP_STEP_X * 0.38 : 0
    const [c1, c2] = countryPhotoColors(card.country)
    const w = CARD_BASE_W + scrapOffset(card.country, i, 6)
    return {
      card,
      x: originX + col * SCRAP_STEP_X + rowStagger + scrapOffset(card.country, i * 3, 16),
      y: originY + row * SCRAP_STEP_Y + scrapOffset(card.country, i * 5, 14),
      rot: scrapOffset(card.country, i * 137, 9),
      w,
      z: i + 1,
      c1,
      c2,
    }
  })
}

/** World-space center for camera when focusing a region (includes country cards). */
export function getRegionFocusPoint(region: BoardRegionLayout): { x: number; y: number } {
  if (region.countries.length === 0) {
    return { x: region.cx, y: region.cy }
  }

  let minX = region.cx
  let maxX = region.cx
  let minY = region.cy
  let maxY = region.cy

  for (const c of region.countries) {
    minX = Math.min(minX, c.x)
    maxX = Math.max(maxX, c.x + c.w)
    minY = Math.min(minY, c.y)
    maxY = Math.max(maxY, c.y + CARD_LAYOUT_H)
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

export function buildBoardRegions(): BoardRegionLayout[] {
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
      countries: layoutCountries(cards, def.cx, def.cy, def.id),
    }
  })
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
