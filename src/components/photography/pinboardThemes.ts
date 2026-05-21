import type { Theme } from '../../useTheme'

export type PinboardThemeTokens = {
  boardBg: string
  gridA: string
  gridB: string
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
  dark: {
    boardBg: '#7A5C2E',
    gridA: 'rgba(0,0,0,0.06)',
    gridB: 'rgba(255,255,255,0.02)',
    cardBg: '#F1EFE8',
    cardShadow: 'rgba(0,0,0,0.22)',
    cardName: '#444441',
    cardSub: '#888780',
    clBg: 'rgba(20,14,6,0.62)',
    clBorder: 'rgba(255,255,255,0.1)',
    clName: 'rgba(241,239,232,0.8)',
    clCount: 'rgba(241,239,232,0.4)',
    navBg: 'rgba(15,10,4,0.62)',
    navBorder: 'rgba(255,255,255,0.07)',
    navHeader: 'rgba(241,239,232,0.32)',
    navName: 'rgba(241,239,232,0.78)',
    navFrac: 'rgba(241,239,232,0.38)',
    navBarBg: 'rgba(255,255,255,0.1)',
    navHover: 'rgba(255,255,255,0.07)',
    hudBg: 'rgba(15,10,4,0.45)',
    hudText: 'rgba(241,239,232,0.48)',
    stringSt: 'rgba(196,120,58,0.22)',
    ssBg: '#1a1208',
    ssName: '#F1EFE8',
    ssRegion: 'rgba(241,239,232,0.45)',
    ssCaption: 'rgba(241,239,232,0.6)',
    ssCounter: 'rgba(241,239,232,0.3)',
    ssDotActive: '#F1EFE8',
    ssDotInactive: 'rgba(241,239,232,0.2)',
  },
  light: {
    boardBg: '#B8976A',
    gridA: 'rgba(0,0,0,0.04)',
    gridB: 'rgba(255,255,255,0.04)',
    cardBg: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.14)',
    cardName: '#1a1208',
    cardSub: '#7a6a54',
    clBg: 'rgba(255,255,255,0.82)',
    clBorder: 'rgba(0,0,0,0.1)',
    clName: '#3a2a10',
    clCount: '#9a8a70',
    navBg: 'rgba(255,255,255,0.88)',
    navBorder: 'rgba(0,0,0,0.07)',
    navHeader: '#9a8a70',
    navName: '#2a1a08',
    navFrac: '#9a8a70',
    navBarBg: 'rgba(0,0,0,0.1)',
    navHover: 'rgba(0,0,0,0.04)',
    hudBg: 'rgba(255,255,255,0.72)',
    hudText: 'rgba(60,40,10,0.55)',
    stringSt: 'rgba(140,80,20,0.28)',
    ssBg: '#FFFFFF',
    ssName: '#1a1208',
    ssRegion: '#9a8a70',
    ssCaption: '#5a4a30',
    ssCounter: '#b4a888',
    ssDotActive: '#2a1a08',
    ssDotInactive: '#d3c8b4',
  },
}
