import type { Theme } from '../../../hooks/useTheme'

/** Radial viewport light (from references/pinboard_lighting.html). */
export type PinboardLightConfig = {
  x: number
  y: number
  r: number
  inner: string
  outer: string
}

/** Color tokens — 1:1 with references/pinboard_lighting.html THEMES */
export type PinboardThemeTokens = {
  boardBase: string
  light: PinboardLightConfig
  cardBg: string
  cardShadow: string
  cardName: string
  cardSub: string
  clBg: string
  clBorder: string
  clName: string
  clCount: string
  navBg: string
  navBorder: string
  navHeader: string
  navName: string
  navFrac: string
  navBarBg: string
  navHover: string
  hudBg: string
  hudText: string
  stringSt: string
  ssBg: string
  ssName: string
  ssRegion: string
  ssCaption: string
  ssCounter: string
  ssDotActive: string
  ssDotInactive: string
}

export const PINBOARD_THEMES: Record<Theme, PinboardThemeTokens> = {
  light: {
    boardBase: '#c9b99a',
    light: {
      x: 0.72,
      y: 0,
      r: 1400,
      inner: 'rgba(255,228,160,0.38)',
      outer: 'rgba(120,80,20,0.52)',
    },
    cardBg: '#FFFDF8',
    cardShadow: 'rgba(80,50,10,0.18)',
    cardName: '#1a1208',
    cardSub: '#7a6a54',
    clBg: '#FFF8E6',
    clBorder: 'rgba(0,0,0,0.1)',
    clName: '#2a1a08',
    clCount: '#9a8060',
    navBg: '#f0ebe0',
    navBorder: 'rgba(184, 137, 42, 0.35)',
    navHeader: '#1a1a2e',
    navName: '#1a1a2e',
    navFrac: 'rgba(26, 26, 46, 0.65)',
    navBarBg: 'rgba(26, 26, 46, 0.12)',
    navHover: 'rgba(184, 137, 42, 0.1)',
    hudBg: '#1a1a2e',
    hudText: '#f0ebe0',
    stringSt: 'rgba(140,80,20,0.22)',
    ssBg: '#FFFDF8',
    ssName: '#1a1208',
    ssRegion: '#9a8060',
    ssCaption: '#5a4a30',
    ssCounter: '#b4a888',
    ssDotActive: '#2a1a08',
    ssDotInactive: '#d3c8b4',
  },
  dark: {
    boardBase: '#1e1a14',
    light: {
      x: 0.5,
      y: 0.5,
      r: 700,
      inner: 'rgba(255,200,100,0.18)',
      outer: 'rgba(0,0,0,0.75)',
    },
    cardBg: '#F5F0E4',
    cardShadow: 'rgba(0,0,0,0.45)',
    cardName: '#2a1a08',
    cardSub: '#7a6a54',
    clBg: '#1E1204',
    clBorder: 'rgba(255,255,255,0.1)',
    clName: 'rgba(241,232,210,0.85)',
    clCount: 'rgba(220,190,130,0.5)',
    navBg: '#1a1a2e',
    navBorder: '#b8892a',
    navHeader: '#f0ebe0',
    navName: '#f0ebe0',
    navFrac: 'rgba(240, 235, 224, 0.55)',
    navBarBg: 'rgba(240, 235, 224, 0.14)',
    navHover: 'rgba(184, 137, 42, 0.18)',
    hudBg: '#1a1a2e',
    hudText: '#f0ebe0',
    stringSt: 'rgba(200,140,50,0.18)',
    ssBg: '#1a1005',
    ssName: '#F1EFE8',
    ssRegion: 'rgba(220,190,130,0.55)',
    ssCaption: 'rgba(220,200,160,0.65)',
    ssCounter: 'rgba(180,160,110,0.4)',
    ssDotActive: '#F1EFE8',
    ssDotInactive: 'rgba(241,239,232,0.2)',
  },
}
