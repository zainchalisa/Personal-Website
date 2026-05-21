import type { PinboardThemeTokens } from './pinboardThemes'

export const BOARD_W = 2600
export const BOARD_H = 1400

export function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h) % 360
}

export function countryPhotoColors(country: string): [string, string] {
  const h = hashHue(country)
  return [`hsl(${h} 28% 62%)`, `hsl(${h} 38% 42%)`]
}

/** SVG placeholder art (from reference mockup). */
export function makePhotoSvg(w: number, h: number, c1: string, c2: string, v: number): string {
  const t = v % 4
  if (t === 0) {
    return `<rect width="${w}" height="${h}" fill="${c1}"/><rect x="${w * 0.1}" y="${h * 0.35}" width="${w * 0.8}" height="${h * 0.4}" fill="${c2}" opacity=".5"/><rect x="${w * 0.38}" y="${h * 0.08}" width="${w * 0.24}" height="${h * 0.75}" fill="${c2}" opacity=".45"/><polygon points="${w * 0.32},${h * 0.22} ${w * 0.68},${h * 0.22} ${w * 0.5},${h * 0.06}" fill="${c2}" opacity=".6"/>`
  }
  if (t === 1) {
    return `<rect width="${w}" height="${h}" fill="${c1}"/><rect x="0" y="${h * 0.55}" width="${w}" height="${h * 0.45}" fill="${c2}" opacity=".5"/><rect x="${w * 0.08}" y="${h * 0.06}" width="${w * 0.2}" height="${h * 0.85}" fill="${c2}" opacity=".5"/><rect x="${w * 0.35}" y="${h * 0.03}" width="${w * 0.26}" height="${h * 0.88}" fill="${c1}" opacity=".5"/><rect x="${w * 0.67}" y="${h * 0.14}" width="${w * 0.18}" height="${h * 0.75}" fill="${c2}" opacity=".5"/>`
  }
  if (t === 2) {
    return `<rect width="${w}" height="${h}" fill="${c1}"/><circle cx="${w * 0.5}" cy="${h * 0.42}" r="${w * 0.2}" fill="none" stroke="${c2}" stroke-width="3" opacity=".65"/><rect x="${w * 0.14}" y="${h * 0.24}" width="${w * 0.72}" height="${h * 0.52}" fill="${c2}" opacity=".3"/><rect x="${w * 0.38}" y="${h * 0.07}" width="${w * 0.24}" height="${h * 0.52}" fill="${c2}" opacity=".45"/>`
  }
  return `<rect width="${w}" height="${h}" fill="${c1}"/><rect x="${w * 0.12}" y="${h * 0.12}" width="${w * 0.76}" height="${h * 0.76}" fill="${c2}" opacity=".35"/><rect x="${w * 0.3}" y="${h * 0.17}" width="${w * 0.16}" height="${h * 0.19}" fill="${c1}" opacity=".7" rx="1"/><rect x="${w * 0.56}" y="${h * 0.17}" width="${w * 0.16}" height="${h * 0.19}" fill="${c1}" opacity=".7" rx="1"/><rect x="${w * 0.1}" y="${h * 0.63}" width="${w * 0.8}" height="${h * 0.08}" fill="${c2}" opacity=".5"/>`
}

export function makeBoardTexture(theme: PinboardThemeTokens): string {
  const c = document.createElement('canvas')
  c.width = 300
  c.height = 300
  const ctx = c.getContext('2d')!
  ctx.fillStyle = theme.boardBg
  ctx.fillRect(0, 0, 300, 300)
  ctx.strokeStyle = theme.gridA
  ctx.lineWidth = 1
  for (let x = 0; x < 300; x += 6) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 300)
    ctx.stroke()
  }
  for (let y = 0; y < 300; y += 6) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(300, y)
    ctx.stroke()
  }
  ctx.strokeStyle = theme.gridB
  for (let i = -300; i < 600; i += 12) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 300, 300)
    ctx.stroke()
  }
  return c.toDataURL()
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
