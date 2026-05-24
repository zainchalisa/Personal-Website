import type { BuildingRect } from './buildingRects'

export type SkylineWindow = {
  x: number
  y: number
  lit: boolean
  duration: number
  delay: number
}

const WIN_W = 8
const WIN_H = 9
const WIN_GAP = 4
const WIN_INSET = 4

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999.123) * 10000
  return x - Math.floor(x)
}

function windowsForBuilding(rect: BuildingRect, buildingIndex: number): SkylineWindow[] {
  const windows: SkylineWindow[] = []
  const maxY = rect.y + rect.height - WIN_INSET
  const maxX = rect.x + rect.width - WIN_INSET

  let row = 0
  for (let y = rect.y + WIN_INSET; y + WIN_H <= maxY; y += WIN_H + WIN_GAP, row++) {
    let col = 0
    for (let x = rect.x + WIN_INSET; x + WIN_W <= maxX; x += WIN_W + WIN_GAP, col++) {
      const seed = buildingIndex * 997 + row * 31 + col * 17
      windows.push({
        x,
        y,
        lit: seededRandom(seed) < 0.55,
        duration: 3 + seededRandom(seed + 1) * 6,
        delay: seededRandom(seed + 2) * 9,
      })
    }
  }

  return windows
}

export function buildSkylineWindows(rects: BuildingRect[]): SkylineWindow[] {
  return rects.flatMap((rect, i) => windowsForBuilding(rect, i))
}
