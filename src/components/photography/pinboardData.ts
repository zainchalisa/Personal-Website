import {
  formatRegionLabel,
  getCountryCardsForRegion,
  type CountryCardData,
  type PinboardPhoto,
  type PinboardRegion,
} from './photographyPhotos'
import { countryPhotoColors } from './pinboardUtils'

export type BoardCountryLayout = {
  card: CountryCardData
  x: number
  y: number
  rot: number
  w: number
  c1: string
  c2: string
}

export type BoardRegionLayout = {
  region: PinboardRegion
  id: string
  name: string
  pin: string
  total: number
  cx: number
  cy: number
  countries: BoardCountryLayout[]
}

const REGION_META: Record<
  PinboardRegion,
  { id: string; pin: string; cx: number; cy: number; total: number }
> = {
  EUROPE: { id: 'europe', pin: '#9BAAB8', cx: 1320, cy: 320, total: 12 },
  ASIA: { id: 'asia', pin: '#D4904A', cx: 620, cy: 350, total: 6 },
  'NORTH AMERICA': { id: 'americas', pin: '#D45050', cx: 1980, cy: 420, total: 8 },
}

/** Fixed world positions per country (deterministic layout on 2600×1400 board). */
const COUNTRY_POSITIONS: Record<string, { x: number; y: number; rot: number; w: number }> = {
  Italy: { x: 1180, y: 220, rot: -3, w: 106 },
  Switzerland: { x: 1268, y: 200, rot: 2, w: 96 },
  France: { x: 1138, y: 278, rot: -2, w: 100 },
  Monaco: { x: 1208, y: 340, rot: 3, w: 88 },
  Spain: { x: 1058, y: 300, rot: 2, w: 96 },
  Germany: { x: 1308, y: 360, rot: 2, w: 94 },
  Austria: { x: 1378, y: 300, rot: -4, w: 94 },
  Hungary: { x: 1428, y: 378, rot: -2, w: 92 },
  'Czech Republic': { x: 1348, y: 248, rot: 3, w: 98 },
  Turkey: { x: 1488, y: 318, rot: -3, w: 102 },
  'Vatican City': { x: 1228, y: 178, rot: 4, w: 86 },
  'United States': { x: 1838, y: 278, rot: 3, w: 108 },
  Canada: { x: 1748, y: 368, rot: -3, w: 100 },
  India: { x: 518, y: 238, rot: -4, w: 110 },
}

function defaultPosition(index: number, cx: number, cy: number) {
  const col = index % 4
  const row = Math.floor(index / 4)
  return {
    x: cx - 180 + col * 120,
    y: cy - 40 + row * 130,
    rot: ((index * 137) % 9) - 4,
    w: 96 + (index % 3) * 4,
  }
}

function layoutCountries(
  cards: CountryCardData[],
  cx: number,
  cy: number,
): BoardCountryLayout[] {
  return cards.map((card, i) => {
    const pos = COUNTRY_POSITIONS[card.country] ?? defaultPosition(i, cx, cy)
    const [c1, c2] = countryPhotoColors(card.country)
    return { card, ...pos, c1, c2 }
  })
}

export function buildBoardRegions(): BoardRegionLayout[] {
  const order: PinboardRegion[] = ['EUROPE', 'ASIA', 'NORTH AMERICA']
  return order.map((region) => {
    const meta = REGION_META[region]
    const cards = getCountryCardsForRegion(region)
    return {
      region,
      id: meta.id,
      name: formatRegionLabel(region),
      pin: meta.pin,
      total: meta.total,
      cx: meta.cx,
      cy: meta.cy,
      countries: layoutCountries(cards, meta.cx, meta.cy),
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
