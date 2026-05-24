/** Stepped pixel building rects for SVG skyline layers */
export type BuildingRect = { x: number; y: number; width: number; height: number }

export function buildBuildingLayer(
  cols: number,
  baseY: number,
  cellW: number,
  cellH: number,
  heights: number[],
): BuildingRect[] {
  const rects: BuildingRect[] = []
  for (let i = 0; i < cols; i++) {
    const h = heights[i % heights.length]
    rects.push({
      x: i * cellW,
      y: baseY - h * cellH,
      width: cellW,
      height: h * cellH,
    })
  }
  return rects
}

/** Back skyline row — taller buildings, slower parallax */
export const FAR_BUILDING_RECTS = buildBuildingLayer(
  48,
  360,
  30,
  28,
  [5, 6, 5, 7, 6, 5, 8, 6, 5, 7, 6, 5, 6, 7, 5, 6, 8, 5, 6, 7, 5, 6, 5, 7, 6, 5, 6, 7, 5, 8, 6, 5, 7, 6, 5, 6, 7, 5, 6, 5, 7, 6, 8, 5, 6, 7, 5, 6],
)

/** Front skyline row — shorter buildings, faster parallax */
export const NEAR_BUILDING_RECTS = buildBuildingLayer(
  48,
  360,
  30,
  24,
  [3, 4, 3, 5, 4, 3, 6, 4, 3, 5, 4, 3, 4, 5, 3, 4, 6, 3, 4, 5, 3, 4, 3, 5, 4, 3, 4, 5, 3, 6, 4, 3, 5, 4, 3, 4, 5, 3, 4, 3, 5, 4, 6, 3, 4, 5, 3, 4],
)

export const CARD_FAR_BUILDING_RECTS = buildBuildingLayer(
  24,
  200,
  20,
  18,
  [3, 4, 3, 5, 4, 3, 5, 4, 3, 4, 5, 3, 4, 5, 3, 5, 4, 3, 5, 4, 3, 4, 5, 3],
)

export const CARD_NEAR_BUILDING_RECTS = buildBuildingLayer(
  24,
  200,
  20,
  16,
  [2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 4, 2, 3, 2, 4, 3],
)
