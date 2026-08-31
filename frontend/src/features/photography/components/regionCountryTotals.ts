/**
 * Sovereign country counts per continent for the pinboard (visited / total).
 *
 * World total: 195 (193 UN member states + Vatican City + Palestine).
 *
 * Continent baseline (sovereign states):
 * - Africa: 54
 * - Asia: 48 (Turkey counted here under the continent model)
 * - Europe: 44 (Russia assigned to Europe per UN M49)
 * - North America: 23 (Northern America + Central America + Caribbean)
 * - South America: 12
 * - Oceania: 14
 *
 * Sources: UN M49 geoscheme, World Population Review (2024–2026).
 */

export type PinboardRegionTotalId =
  | 'north-america'
  | 'south-america'
  | 'europe'
  | 'africa'
  | 'asia'
  | 'oceania'

/** Sovereign-country count per continent; sums to 195. */
export const REGION_COUNTRY_TOTALS: Record<PinboardRegionTotalId, number> = {
  'north-america': 23,
  'south-america': 12,
  europe: 44,
  africa: 54,
  asia: 48,
  oceania: 14,
}

// 23 + 12 + 44 + 54 + 48 + 14 = 195

/** Progress bar width (0–100) for region nav; matches visited/total fraction. */
export function regionVisitedBarPercent(visited: number, total: number): number {
  if (visited <= 0 || total <= 0) return 0
  return Math.min(100, Math.round((visited / total) * 100))
}
