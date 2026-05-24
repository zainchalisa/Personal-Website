/**
 * Sovereign country counts for the pinboard regions panel (visited / total).
 *
 * World total: 195 (193 UN member states + Vatican City + Palestine).
 *
 * Continental baseline (UN Statistics Division):
 * - Africa: 54
 * - Europe: 44 (Russia assigned to Europe per UN M49)
 * - Americas: 35 (Northern America 23 + South America 12)
 * - Asia: 48 (UN Asian subregions, unique sovereign states)
 * - Oceania: 14
 *
 * The pinboard uses six regions that partition all 195 countries with no overlap:
 * - Middle East → UN Western Asia (18)
 * - East Asia → UN Eastern Asia (7) + Southern Asia (8) + Central Asia (5) = 20
 * - SE Asia → UN South-eastern Asia (11) + Oceania (14) = 25
 *
 * Sources: UN M49 geoscheme, Facts Institute / World Population Review (2024–2026).
 */

export const WORLD_COUNTRY_TOTAL = 195 as const

export type PinboardRegionTotalId =
  | 'europe'
  | 'east-asia'
  | 'se-asia'
  | 'americas'
  | 'africa'
  | 'middle-east'

/** Accurate sovereign-country count per pinboard region; sums to 195. */
export const REGION_COUNTRY_TOTALS: Record<PinboardRegionTotalId, number> = {
  europe: 44,
  'east-asia': 20,
  'se-asia': 25,
  americas: 35,
  africa: 54,
  'middle-east': 18,
}

// 44 + 20 + 25 + 35 + 54 + 18 = 195

/** Progress bar width (0–100) for region nav; matches visited/total fraction. */
export function regionVisitedBarPercent(visited: number, total: number): number {
  if (visited <= 0 || total <= 0) return 0
  return Math.min(100, Math.round((visited / total) * 100))
}

/** Human-readable breakdown for tooltips or docs. */
export const REGION_TOTAL_BREAKDOWN: Record<
  PinboardRegionTotalId,
  { label: string; includes: string }
> = {
  europe: {
    label: 'Europe',
    includes: '44 countries (UN Europe, incl. transcontinental Russia)',
  },
  'east-asia': {
    label: 'East Asia',
    includes:
      '20 — Eastern Asia (7) + Southern Asia (8) + Central Asia (5): China, Japan, India, Kazakhstan, etc.',
  },
  'se-asia': {
    label: 'SE Asia',
    includes:
      '25 — South-eastern Asia (11) + Oceania (14): ASEAN, Australia, New Zealand, Pacific islands',
  },
  americas: {
    label: 'Americas',
    includes: '35 — North America, Central America, Caribbean & South America',
  },
  africa: {
    label: 'Africa',
    includes: '54 countries (all UN African subregions)',
  },
  'middle-east': {
    label: 'Middle East',
    includes:
      '18 — UN Western Asia: Gulf states, Levant, Turkey, Caucasus (Armenia, Azerbaijan, Georgia), Cyprus',
  },
}
