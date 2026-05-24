import { useCallback, useEffect, useRef, useState } from 'react'
import type { Theme } from '../../hooks/useTheme'
import { useTheme } from '../../hooks/useTheme'
import { getLavaGlowBoost } from '../../hooks/themeTransition'
import jumpFrame1Url from './assets/character/jump.png'
import jumpFrame2Url from './assets/character/jump 2.png'
import runFrame1Url from './assets/character/run.png'
import runFrame2Url from './assets/character/run 2.png'
import avatarUrl from './assets/character/avatar.png'
import cloudUrl from './assets/environment/cloud-pixel.png'
import fallingUrl from './assets/character/falling.png'
import onGroundUrl from './assets/character/on the ground.png'
import platformLeftUrl from './assets/platforms/volcano_pack_alt_19.png'
import platformRightUrl from './assets/platforms/volcano_pack_alt_40.png'
import lightBgUrl from './assets/environment/bg_lightmode.png'
import darkBgVolcanoUrl from './assets/environment/bg_volcano.png'
import floorSurfaceUrl from './assets/platforms/volcano_pack_53.png'
import floorFillUrl from './assets/platforms/volcano_pack_54.png'
import decoTreeUrl from './assets/environment/volcano_pack_59.png'
import decoPurpleCrystalUrl from './assets/environment/volcano_pack_56.png'
import decoOrangeCrystalUrl from './assets/environment/volcano_pack_65.png'
import decoBushUrl from './assets/environment/volcano_pack_73.png'
import decoRocksUrl from './assets/environment/volcano_pack_70.png'
import decoRockUrl from './assets/environment/volcano_pack_71.png'
import portalGifUrl from './assets/portals/portal_pixel_art_by_fabian8bit_dfalvdy-ezgif.com-gif-maker.gif'
import '@fontsource/press-start-2p/latin-400.css'
import styles from './ProjectsGame.module.css'

type CharacterFrames = {
  run1: HTMLImageElement
  run2: HTMLImageElement
  jump1: HTMLImageElement
  jump2: HTMLImageElement
  idle: HTMLImageElement
  falling: HTMLImageElement
  onGround: HTMLImageElement
}

type CloudPhase =
  | 'idle'
  | 'ouch'
  | 'swoop_in'
  | 'scoop'
  | 'rise'
  | 'carry'
  | 'descend'
  | 'hop_off'
  | 'release'

type GameArt = CharacterFrames & {
  cloud: HTMLImageElement
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/** Cloud sprite draw size (2500×2500 source; lots of transparent padding) */
const CLOUD_DRAW_W = 156
const CLOUD_DRAW_H = 88
/** World Y of the flat “deck” on the cloud bitmap (from top of draw rect) */
const CLOUD_RIDE_Y = 50
const LAVA_HIT_FRAMES = 52

let gameArtPromise: Promise<GameArt> | null = null

type PlatformTiles = {
  left: HTMLImageElement
  mid: CanvasImageSource
  right: HTMLImageElement
}

/** Middle segments between left cap (19) and right cap (40) */
const PLATFORM_MIDDLE_COUNT = 2

/** Seamless fill tile built from the left cap's inner edge (matches alt_41 when that file is absent) */
function buildPlatformMiddleTile(leftCap: HTMLImageElement): HTMLCanvasElement {
  const size = leftCap.width
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = false
  const sliceW = 32
  const srcX = size - sliceW
  for (let x = 0; x < size; x += sliceW) {
    ctx.drawImage(leftCap, srcX, 0, sliceW, size, x, 0, sliceW, size)
  }
  return canvas
}

const platformCenterGlob = import.meta.glob<string>(
  './assets/platforms/volcano_pack_alt_41.png',
  { eager: true, import: 'default' },
)

type FloorTiles = {
  surface: HTMLImageElement
  fill: HTMLImageElement
}

type SceneBackgrounds = {
  light: HTMLImageElement
  dark: HTMLImageElement
}

let sceneBackgroundsPromise: Promise<SceneBackgrounds> | null = null

function getSceneBackgrounds(): Promise<SceneBackgrounds> {
  if (!sceneBackgroundsPromise) {
    sceneBackgroundsPromise = Promise.all([
      loadImage(lightBgUrl),
      loadImage(darkBgVolcanoUrl),
    ]).then(([light, dark]) => ({ light, dark }))
  }
  return sceneBackgroundsPromise
}

let floorTilesPromise: Promise<FloorTiles> | null = null

function getFloorTiles(): Promise<FloorTiles> {
  if (!floorTilesPromise) {
    floorTilesPromise = Promise.all([
      loadImage(floorSurfaceUrl),
      loadImage(floorFillUrl),
    ]).then(([surface, fill]) => ({ surface, fill }))
  }
  return floorTilesPromise
}

let platformTilesPromise: Promise<PlatformTiles> | null = null

function getPlatformTiles(): Promise<PlatformTiles> {
  if (!platformTilesPromise) {
    platformTilesPromise = Promise.all([
      loadImage(platformLeftUrl),
      loadImage(platformRightUrl),
    ]).then(async ([left, right]) => {
      const centerUrl = Object.values(platformCenterGlob)[0]
      let mid: CanvasImageSource = buildPlatformMiddleTile(left)
      if (centerUrl) mid = await loadImage(centerUrl)
      return { left, mid, right }
    })
  }
  return platformTilesPromise
}

function getGameArt(): Promise<GameArt> {
  if (!gameArtPromise) {
    gameArtPromise = Promise.all([
      loadImage(runFrame1Url),
      loadImage(runFrame2Url),
      loadImage(jumpFrame1Url),
      loadImage(jumpFrame2Url),
      loadImage(avatarUrl),
      loadImage(fallingUrl),
      loadImage(onGroundUrl),
      loadImage(cloudUrl),
    ]).then(([run1, run2, jump1, jump2, idle, falling, onGround, cloud]) => ({
      run1,
      run2,
      jump1,
      jump2,
      idle,
      falling,
      onGround,
      cloud,
    }))
  }
  return gameArtPromise
}

function ease(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export type ShowcaseProject = {
  title: string
  description: string
  tags: readonly string[] | string[]
  route: string
  github: string
  live: string
}

type GameProject = {
  name: string
  route: string
  desc: string
  tags: string[]
  github: string
  live: string
}

type Plat = { x: number; y: number; w: number; h: number; ground?: boolean }
type Portal = {
  x: number
  y: number
  w: number
  h: number
  proj: GameProject
  active: boolean
  proximity: number
}

type LavaEmber = {
  x: number
  y: number
  vy: number
  wobblePhase: number
  wobbleFreq: number
  wobbleAmp: number
  age: number
  maxLife: number
  size: number
  breezeVx: number
}

type PlatformDecoration = {
  platIndex: number
  img: HTMLImageElement
  /** 0–1 position along platform width (sprite center) */
  anchorX: number
  drawW: number
  drawH: number
  flip?: boolean
}

/** Decorative props per floating platform — edges only, clear center for running */
const PLATFORM_DECORATION_LAYOUT: {
  platIndex: number
  src: string
  anchorX: number
  drawW: number
  drawH: number
  flip?: boolean
}[] = [
  { platIndex: 0, src: decoTreeUrl, anchorX: 0.09, drawW: 68, drawH: 96 },
  { platIndex: 1, src: decoPurpleCrystalUrl, anchorX: 0.84, drawW: 48, drawH: 44 },
  { platIndex: 2, src: decoOrangeCrystalUrl, anchorX: 0.22, drawW: 54, drawH: 50 },
  { platIndex: 2, src: decoBushUrl, anchorX: 0.78, drawW: 42, drawH: 38, flip: true },
  { platIndex: 3, src: decoBushUrl, anchorX: 0.11, drawW: 44, drawH: 40 },
  { platIndex: 3, src: decoRockUrl, anchorX: 0.88, drawW: 32, drawH: 28 },
  { platIndex: 4, src: decoRocksUrl, anchorX: 0.14, drawW: 50, drawH: 42 },
  { platIndex: 4, src: decoRockUrl, anchorX: 0.86, drawW: 34, drawH: 30, flip: true },
]

let platformDecorationsPromise: Promise<PlatformDecoration[]> | null = null

function getPlatformDecorations(): Promise<PlatformDecoration[]> {
  if (!platformDecorationsPromise) {
    platformDecorationsPromise = Promise.all(
      PLATFORM_DECORATION_LAYOUT.map(async (d) => ({
        platIndex: d.platIndex,
        anchorX: d.anchorX,
        drawW: d.drawW,
        drawH: d.drawH,
        flip: d.flip,
        img: await loadImage(d.src),
      })),
    )
  }
  return platformDecorationsPromise
}

const WORLD_W = 1980
/** Default world Y of the lava collision floor; raised toward H at runtime */
const GROUND_Y_DEFAULT = 648
/** Distance from canvas bottom to the lava floor line */
const LAVA_BOTTOM_INSET = 72
const GROUND_H = 10
const FLOOR_TILE_SCALE = 1.15
/** Where the wave crest sits within tile 53 (from top of sprite) */
const FLOOR_SURFACE_WAVE_RATIO = 0.34
/** Extra lift so wave peaks rise above the flat floor line */
const FLOOR_WAVE_POP_ABOVE = 14
/** Lava texture scroll speed (source pixels per frame; shared by fill + surface) */
const LAVA_FILL_FLOW_X = 0.22
/** Gentle vertical motion applied to the whole surface layer (not per-tile) */
const LAVA_SURFACE_BOB = 2
const EMBER_MAX = 48
const EMBER_SPAWN_EVERY = 4
/** Pixels above the wave crest where embers first appear */
const EMBER_SPAWN_LIFT_MIN = 8
const EMBER_SPAWN_LIFT_RANGE = 14
/** Overlap adjacent tiles by 1px to hide sub-pixel seams while scrolling */
const TILE_SEAM_OVERLAP = 1
const PX = 3
/** Run/jump/gravity scale — keeps arc shape while matching run-cycle + camera pacing */
const SPEED = 1.5
const G = 0.6 * SPEED
const JF = -14.5 * SPEED
const SP = 4.75 * SPEED
const RUN_ANIM_INTERVAL = 7 / SPEED
const CAM_FOLLOW = 0.1 + (SPEED - 1) * 0.04
const TRAIL_SPAWN_EVERY = Math.max(3, Math.round(5 / SPEED))
const HOP_OFF_VX_MAX = 4.5 * SPEED
const HOP_OFF_VX_SCALE = 0.14 * SPEED

/** Five floating platforms, staggered Y, tighter horizontal spacing */
const PLATFORM_BLUEPRINT: { x: number; y: number }[] = [
  { x: 28, y: 458 },
  { x: 368, y: 368 },
  { x: 748, y: 292 },
  { x: 1128, y: 352 },
  { x: 1520, y: 438 },
]

const PLAT_W = 252
const PLAT_H = 17
/** Drawn portal size (320×320 GIF, square) */
const PORTAL_DRAW_SIZE = 108
/** Transparent padding below feet in the GIF, scaled to draw size */
const PORTAL_BASE_TRIM = 18

/** Draw height for PNG hero; hitbox is 8x10 cells at PX scale, feet at bottom */
const CHAR_DRAW_H = 84
/** Lower sprite so visible feet meet ground (transparent padding in character PNGs) */
const CHAR_FEET_TRIM = 12

const FONT_PIXEL = '"Pixelify Sans"'
const FONT_SILK = 'Silkscreen'
const FONT_MONO = '"Geist Mono", ui-monospace, monospace'

const TOOLTIP_BG = '#f0ebe0'
const TOOLTIP_BORDER = '#b8892a'
const TOOLTIP_TITLE = '#1a1a2e'
const TOOLTIP_ROUTE = '#5c5348'
const TOOLTIP_CHAMFER = 6

async function loadGameFonts(): Promise<void> {
  const loads = [
    ...[10, 11, 12, 14, 16, 18, 22, 28].map((px) =>
      document.fonts.load(`500 ${px}px ${FONT_PIXEL}`),
    ),
    document.fonts.load('400 11px Silkscreen'),
    document.fonts.load('400 12px Silkscreen'),
    document.fonts.load('400 9px "Geist Mono"'),
    document.fonts.load('400 10px "Geist Mono"'),
    document.fonts.load('400 11px "Geist Mono"'),
  ]
  await Promise.all(loads)
}

function traceChamferedRect(
  fx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  chamfer: number,
) {
  const c = chamfer
  fx.beginPath()
  fx.moveTo(left + c, top)
  fx.lineTo(left + width - c, top)
  fx.lineTo(left + width, top + c)
  fx.lineTo(left + width, top + height - c)
  fx.lineTo(left + width - c, top + height)
  fx.lineTo(left + c, top + height)
  fx.lineTo(left, top + height - c)
  fx.lineTo(left, top + c)
  fx.closePath()
}

const WELCOME_STORAGE_KEY = 'zain-projects-game-welcome-v1'
const POSITION_STORAGE_KEY = 'zain-projects-game-position-v1'

type StoredGameSession = {
  projectsKey: string
  snapshot: PersistedGameSnapshot
}

function readStoredGameSession(projectsKey: string): PersistedGameSnapshot | null {
  try {
    const raw = sessionStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredGameSession
    if (parsed.projectsKey !== projectsKey) return null
    return parsed.snapshot
  } catch {
    return null
  }
}

function writeStoredGameSession(projectsKey: string, snapshot: PersistedGameSnapshot) {
  try {
    const payload: StoredGameSession = { projectsKey, snapshot }
    sessionStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

function clearStoredGameSession() {
  try {
    sessionStorage.removeItem(POSITION_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

const GAME_KEY_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyE',
  'KeyC',
])

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

function releaseNavFocus() {
  const el = document.activeElement
  if (el instanceof HTMLElement && el.closest('.nav-shell')) {
    el.blur()
  }
}

function toGameProjects(projects: readonly ShowcaseProject[]): GameProject[] {
  return projects.map((p) => ({
    name: p.title,
    route: p.route,
    desc: p.description,
    tags: [...p.tags],
    github: p.github,
    live: p.live,
  }))
}

function buildLevel(projects: GameProject[]): { plats: Plat[]; portals: Portal[] } {
  const n = Math.min(projects.length, PLATFORM_BLUEPRINT.length)
  const plats: Plat[] = [{ x: 0, y: GROUND_Y_DEFAULT, w: WORLD_W, h: GROUND_H, ground: true }]
  const portals: Portal[] = []
  for (let i = 0; i < n; i++) {
    const b = PLATFORM_BLUEPRINT[i]
    plats.push({ x: b.x, y: b.y, w: PLAT_W, h: PLAT_H })
    portals.push({
      x: b.x + PLAT_W / 2,
      y: b.y - PORTAL_DRAW_SIZE + PORTAL_BASE_TRIM,
      w: PORTAL_DRAW_SIZE,
      h: PORTAL_DRAW_SIZE,
      proj: projects[i],
      active: false,
      proximity: 0,
    })
  }
  return { plats, portals }
}

type Palette = {
  canvasBg: string
  grid: string
  gridMinor: string
  star: string
  waterLine: string
  bgGradTop: string
  bgGradBottom: string
  bgVignette: string
  platFill: string
  platStroke: string
  platDetail: string
  platDropShadow: string
  portalOuterInactive: string
  portalOuterActive: string
  portalStroke: string
  portalStrokeActive: string
  portalInner: string
  portalInnerActive: string
  portalLine: string
  portalLineActive: string
  portalLabelBg: string
  portalLabelBgActive: string
  portalLabelBorder: string
  portalLabelBorderActive: string
  portalTitle: string
  portalTitleActive: string
  portalRoute: string
  portalRouteActive: string
  particleLight: string
  particleDark: string
  trailLight: string
  trailDark: string
  lakituLine: string
  lakituHook: string
  lakituCloudFill: string
  lakituCloudStroke: string
  lakituText: string
  lakituTextMuted: string
  lakituProp: string
}

function getPalette(theme: Theme): Palette {
  if (theme === 'dark') {
    return {
      canvasBg: '#0a0a0a',
      grid: 'rgba(255, 255, 255, 0.06)',
      gridMinor: 'rgba(255, 255, 255, 0.028)',
      star: 'rgba(220, 220, 220, 0.18)',
      waterLine: 'rgba(120, 120, 120, 0.35)',
      bgGradTop: 'rgba(255, 255, 255, 0.05)',
      bgGradBottom: 'rgba(0, 0, 0, 0.55)',
      bgVignette: 'rgba(0, 0, 0, 0.42)',
      platFill: '#161616',
      platStroke: 'rgba(255, 255, 255, 0.12)',
      platDetail: 'rgba(255, 255, 255, 0.08)',
      platDropShadow: 'rgba(0, 0, 0, 0.35)',
      portalOuterInactive: 'rgba(250, 250, 250, 0.04)',
      portalOuterActive: 'rgba(250, 250, 250, 0.1)',
      portalStroke: '#525252',
      portalStrokeActive: '#fafafa',
      portalInner: 'rgba(64, 64, 64, 0.25)',
      portalInnerActive: 'rgba(250, 250, 250, 0.08)',
      portalLine: 'rgba(115, 115, 115, 0.25)',
      portalLineActive: 'rgba(200, 200, 200, 0.15)',
      portalLabelBg: 'rgba(10, 10, 10, 0.88)',
      portalLabelBgActive: 'rgba(20, 20, 20, 0.94)',
      portalLabelBorder: 'rgba(255, 255, 255, 0.14)',
      portalLabelBorderActive: 'rgba(255, 255, 255, 0.35)',
      portalTitle: '#fafafa',
      portalTitleActive: '#ffffff',
      portalRoute: '#d4d4d4',
      portalRouteActive: '#e8e8e8',
      particleLight: 'rgba(220, 220, 220, 0.45)',
      particleDark: 'rgba(220, 220, 220, 0.45)',
      trailLight: 'rgba(160, 160, 160, 0.28)',
      trailDark: 'rgba(160, 160, 160, 0.28)',
      lakituLine: '#737373',
      lakituHook: '#a3a3a3',
      lakituCloudFill: '#1a1a1a',
      lakituCloudStroke: '#525252',
      lakituText: '#e5e5e5',
      lakituTextMuted: '#737373',
      lakituProp: '#525252',
    }
  }
  return {
    canvasBg: '#ffffff',
    grid: 'rgba(68, 68, 65, 0.08)',
    gridMinor: 'rgba(68, 68, 65, 0.035)',
    star: 'rgba(68, 68, 65, 0.12)',
    waterLine: 'rgba(180, 178, 169, 0.45)',
    bgGradTop: 'rgba(255, 255, 255, 0.9)',
    bgGradBottom: 'rgba(230, 228, 220, 0.35)',
    bgVignette: 'rgba(95, 94, 90, 0.06)',
    platFill: '#ffffff',
    platStroke: 'rgba(68, 68, 65, 0.18)',
    platDetail: 'rgba(180, 178, 169, 0.55)',
    platDropShadow: 'rgba(68, 68, 65, 0.08)',
    portalOuterInactive: 'rgba(68, 68, 65, 0.05)',
    portalOuterActive: 'rgba(68, 68, 65, 0.12)',
    portalStroke: '#b4b2a9',
    portalStrokeActive: '#2c2c2a',
    portalInner: 'rgba(211, 209, 199, 0.15)',
    portalInnerActive: 'rgba(44, 44, 42, 0.06)',
    portalLine: 'rgba(180, 178, 169, 0.15)',
    portalLineActive: 'rgba(68, 68, 65, 0.1)',
      portalLabelBg: 'rgba(255, 255, 255, 0.94)',
      portalLabelBgActive: 'rgba(255, 255, 255, 0.98)',
      portalLabelBorder: 'rgba(20, 20, 20, 0.12)',
      portalLabelBorderActive: 'rgba(20, 20, 20, 0.28)',
      portalTitle: '#141414',
      portalTitleActive: '#0a0a0a',
      portalRoute: '#3d3d3a',
      portalRouteActive: '#52524e',
    particleLight: 'rgba(68, 68, 65, 0.6)',
    particleDark: 'rgba(68, 68, 65, 0.6)',
    trailLight: 'rgba(136, 135, 128, 0.35)',
    trailDark: 'rgba(136, 135, 128, 0.35)',
    lakituLine: '#888780',
    lakituHook: '#444441',
    lakituCloudFill: '#fff',
    lakituCloudStroke: '#b4b2a9',
    lakituText: '#444441',
    lakituTextMuted: '#888780',
    lakituProp: '#888780',
  }
}

export type ProjectsGameProps = {
  projects: readonly ShowcaseProject[]
  theme: Theme
  active: boolean
}

type PlayerMotionState = 'normal' | 'lava' | 'ouch' | 'riding'

type PersistedGameSnapshot = {
  player: {
    x: number
    y: number
    vx: number
    vy: number
    facing: number
    onGround: boolean
    frame: number
    frameTimer: number
    state: PlayerMotionState
    lastSafeX: number
    lastSafeY: number
  }
  camX: number
}

function createInitialPlayer() {
  return {
    x: 120,
    y: PLATFORM_BLUEPRINT[0].y - 10 * PX,
    vx: 0,
    vy: 0,
    w: 8 * PX,
    h: 10 * PX,
    onGround: false,
    frame: 0,
    frameTimer: 0,
    facing: 1,
    trail: [] as { x: number; y: number; life: number }[],
    state: 'normal' as PlayerMotionState,
    lastSafeX: 120,
    lastSafeY: PLATFORM_BLUEPRINT[0].y,
    lastSafePlat: null as Plat | null,
  }
}

function snapshotGameState(
  player: ReturnType<typeof createInitialPlayer>,
  camX: number,
): PersistedGameSnapshot {
  return {
    player: {
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      facing: player.facing,
      onGround: player.onGround,
      frame: player.frame,
      frameTimer: player.frameTimer,
      state: player.state,
      lastSafeX: player.lastSafeX,
      lastSafeY: player.lastSafeY,
    },
    camX,
  }
}

function restorePlayer(saved: PersistedGameSnapshot['player']) {
  const base = createInitialPlayer()
  if (saved.state === 'normal') {
    return {
      ...base,
      ...saved,
      trail: [],
      lastSafePlat: null,
    }
  }
  return {
    ...base,
    x: saved.lastSafeX - base.w / 2,
    y: saved.lastSafeY - base.h,
    vx: 0,
    vy: 0,
    facing: saved.facing,
    onGround: true,
    frame: 0,
    frameTimer: 0,
    state: 'normal' as PlayerMotionState,
    lastSafeX: saved.lastSafeX,
    lastSafeY: saved.lastSafeY,
    lastSafePlat: null,
    trail: [],
  }
}

function loadPersistedSnapshot(
  projectsKey: string,
  memorySnapshot: PersistedGameSnapshot | null,
): PersistedGameSnapshot | null {
  return readStoredGameSession(projectsKey) ?? memorySnapshot
}

function persistGameSnapshot(
  projectsKey: string,
  snapshot: PersistedGameSnapshot,
  memoryRef: { current: PersistedGameSnapshot | null },
) {
  memoryRef.current = snapshot
  writeStoredGameSession(projectsKey, snapshot)
}

export function ProjectsGame({ projects, theme, active }: ProjectsGameProps) {
  const { themeTransition } = useTheme()
  const wrapRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const fgCanvasRef = useRef<HTMLCanvasElement>(null)
  const portalLayerRef = useRef<HTMLDivElement>(null)
  const ehintRef = useRef<HTMLDivElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const tryOpenRef = useRef<(() => void) | null>(null)
  const modalOpenRef = useRef(false)
  const welcomeOpenRef = useRef(false)
  const themeRef = useRef(theme)
  const themeTransitionRef = useRef(themeTransition)
  const lavaGlowBoostRef = useRef(0)
  const gamePersistRef = useRef<PersistedGameSnapshot | null>(null)
  const projectsKeyRef = useRef('')
  const [modal, setModal] = useState<GameProject | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)

  const closeModal = useCallback(() => setModal(null), [])

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const projectsKey = projects.map((p) => p.route).join('|')

  useEffect(() => {
    themeRef.current = theme
    themeTransitionRef.current = themeTransition
    lavaGlowBoostRef.current = getLavaGlowBoost(theme, themeTransition)
  }, [theme, themeTransition])

  useEffect(() => {
    if (projectsKeyRef.current && projectsKeyRef.current !== projectsKey) {
      gamePersistRef.current = null
      clearStoredGameSession()
    }
    projectsKeyRef.current = projectsKey
  }, [projectsKey])

  useEffect(() => {
    modalOpenRef.current = modal !== null
  }, [modal])

  useEffect(() => {
    welcomeOpenRef.current = showWelcome
    if (showWelcome) keysRef.current = {}
  }, [showWelcome])

  useEffect(() => {
    if (!active) return
    try {
      if (!localStorage.getItem(WELCOME_STORAGE_KEY)) setShowWelcome(true)
    } catch {
      setShowWelcome(true)
    }
  }, [active])

  useEffect(() => {
    if (!active) {
      keysRef.current = {}
      tryOpenRef.current = null
      return
    }

    releaseNavFocus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (welcomeOpenRef.current) {
        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
          e.preventDefault()
          dismissWelcome()
        }
        return
      }

      if (!GAME_KEY_CODES.has(e.code)) return
      if (isTypingTarget(e.target)) return

      releaseNavFocus()
      keysRef.current[e.code] = true

      if (e.code === 'KeyE') {
        e.preventDefault()
        if (modalOpenRef.current) closeModal()
        else tryOpenRef.current?.()
        return
      }

      if (e.code === 'KeyC') {
        e.preventDefault()
        if (modalOpenRef.current) closeModal()
        return
      }

      if (
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'Space' ||
        e.code === 'KeyA' ||
        e.code === 'KeyD' ||
        e.code === 'KeyW'
      ) {
        e.preventDefault()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (!GAME_KEY_CODES.has(e.code)) return
      keysRef.current[e.code] = false
    }

    const clearKeys = () => {
      keysRef.current = {}
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', clearKeys)

    return () => {
      clearKeys()
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', clearKeys)
    }
  }, [active, closeModal, dismissWelcome])

  useEffect(() => {
    if (!active) return

    const bgCanvas = bgCanvasRef.current
    const fgCanvas = fgCanvasRef.current
    const wrap = wrapRef.current
    const portalLayer = portalLayerRef.current
    const ehint = ehintRef.current
    if (!bgCanvas || !fgCanvas || !wrap || !portalLayer || !ehint) return

    const ctx = bgCanvas.getContext('2d')
    const fgCtx = fgCanvas.getContext('2d')
    if (!ctx || !fgCtx) return

    const ac = new AbortController()
    let raf = 0
    let teardown: (() => void) | undefined

    void (async () => {
      let art: GameArt
      let platformTiles: PlatformTiles
      let floorTiles: FloorTiles
      let platformDecorations: PlatformDecoration[]
      let sceneBackgrounds: SceneBackgrounds
      try {
        const [gameArt, tiles, floors, decorations, backgrounds] = await Promise.all([
          getGameArt(),
          getPlatformTiles(),
          getFloorTiles(),
          getPlatformDecorations(),
          getSceneBackgrounds(),
          loadGameFonts(),
        ])
        art = gameArt
        platformTiles = tiles
        floorTiles = floors
        platformDecorations = decorations
        sceneBackgrounds = backgrounds
      } catch (e) {
        console.warn('[ProjectsGame] game art failed:', e)
        return
      }
      if (ac.signal.aborted) return

      const c = ctx
      const fg = fgCtx
      const bgCanvasEl = bgCanvas
      const fgCanvasEl = fgCanvas
      const wrapEl = wrap
      const ehintEl = ehint

    const gameProjects = toGameProjects(projects)
    const { plats: PLATS, portals: PORTALS } = buildLevel(gameProjects)

    const floatingPlats = PLATS.filter((pl) => !pl.ground)

    portalLayer.innerHTML = ''
    const decoSprites: HTMLImageElement[] = []
    platformDecorations.forEach((d) => {
      const img = document.createElement('img')
      img.src = d.img.src
      img.alt = ''
      img.className = styles.decoSprite
      img.draggable = false
      portalLayer.appendChild(img)
      decoSprites.push(img)
    })

    const portalSprites: HTMLImageElement[] = []
    PORTALS.forEach((p) => {
      const img = document.createElement('img')
      img.src = portalGifUrl
      img.alt = p.proj.name
      img.className = styles.portalSprite
      img.draggable = false
      portalLayer.appendChild(img)
      portalSprites.push(img)
    })

    let cachedPageBg = getPalette(themeRef.current).canvasBg

    let W = 0
    let H = 0
    let groundY = GROUND_Y_DEFAULT
    let worldYOffset = 0
    let playerCreated = false

    function applyWorldVerticalShift(offset: number) {
      groundY = GROUND_Y_DEFAULT + offset
      const groundPlat = PLATS.find((pl) => pl.ground)
      if (groundPlat) groundPlat.y = groundY

      for (let i = 0; i < floatingPlats.length; i++) {
        floatingPlats[i].y = PLATFORM_BLUEPRINT[i].y + offset
      }

      for (let i = 0; i < PORTALS.length; i++) {
        const b = PLATFORM_BLUEPRINT[i]
        PORTALS[i].x = b.x + PLAT_W / 2
        PORTALS[i].y = b.y + offset - PORTAL_DRAW_SIZE + PORTAL_BASE_TRIM
      }
    }

    function shiftDynamicWorld(dy: number) {
      if (dy === 0) return
      player.y += dy
      player.lastSafeY += dy
      if (cloud.phase !== 'idle') {
        cloud.y += dy
        cloud.targetY += dy
        cloud.dropY += dy
      }
      for (const p of particles) p.y += dy
      for (const b of lavaBubbles) b.y += dy
      for (const e of lavaEmbers) e.y += dy
    }

    function syncPageBg() {
      const domBg = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-background-primary')
        .trim()
      cachedPageBg = domBg || getPalette(themeRef.current).canvasBg
    }
    function resize() {
      W = Math.max(1, Math.floor(wrapEl.clientWidth))
      H = Math.max(1, Math.floor(wrapEl.offsetHeight))
      const nextOffset = Math.max(0, H - LAVA_BOTTOM_INSET - GROUND_Y_DEFAULT)
      const dy = nextOffset - worldYOffset
      applyWorldVerticalShift(nextOffset)
      if (playerCreated) shiftDynamicWorld(dy)
      worldYOffset = nextOffset
      bgCanvasEl.width = W
      bgCanvasEl.height = H
      fgCanvasEl.width = W
      fgCanvasEl.height = H
      syncPageBg()
    }

    function clearBgCanvas() {
      syncPageBg()
      c.fillStyle = cachedPageBg
      c.fillRect(0, 0, W, H)
    }
    resize()

    const saved = loadPersistedSnapshot(projectsKey, gamePersistRef.current)
    let camX = saved?.camX ?? 0
    const player = saved ? restorePlayer(saved.player) : createInitialPlayer()
    if (!saved && worldYOffset !== 0) {
      player.y += worldYOffset
      player.lastSafeY += worldYOffset
    }

    const cloud = {
      phase: 'idle' as CloudPhase,
      x: 0,
      y: 0,
      fromLeft: true,
      timer: 0,
      targetX: 0,
      targetY: 0,
      dropX: 0,
      dropY: 0,
      wobble: 0,
    }

    let particles: {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      size: number
      color: string
    }[] = []
    let lavaBubbles: { x: number; y: number; vx: number; vy: number; life: number; r: number }[] = []
    let lavaEmbers: LavaEmber[] = []
    playerCreated = true
    let tick = 0
    let lavaHitTimer = 0
    let camShake = 0
    let lavaFlash = 0
    const stars = Array.from({ length: 24 }, () => ({
      x: Math.random() * WORLD_W,
      y: 36 + Math.random() * 340,
      r: 1 + Math.random(),
      speed: 0.2 + Math.random() * 0.3,
    }))

    let audioCtx: AudioContext | null = null
    function getAudio() {
      if (!audioCtx)
        audioCtx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      return audioCtx
    }
    function playSound(f1: number, f2: number, dur: number) {
      try {
        const a = getAudio()
        const o = a.createOscillator()
        const g = a.createGain()
        o.connect(g)
        g.connect(a.destination)
        o.frequency.setValueAtTime(f1, a.currentTime)
        o.frequency.exponentialRampToValueAtTime(f2, a.currentTime + dur)
        g.gain.setValueAtTime(0.06, a.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur + 0.05)
        o.start()
        o.stop(a.currentTime + dur + 0.1)
      } catch {
        /* ignore */
      }
    }

    function spawnParticles(x: number, y: number, count = 3, color = '') {
      const c =
        color ||
        (themeRef.current === 'dark' ? 'rgba(220,220,220,0.9)' : 'rgba(68,68,65,0.85)')
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.5,
          vy: -1.5 - Math.random() * 2,
          life: 1,
          size: 2 + Math.random() * 2,
          color: c,
        })
      }
    }

    function spawnLavaSplash(x: number, y: number, count = 10) {
      const colors = ['#ff6b1a', '#ff9a3c', '#ffd166', '#ff4500']
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -2.2 - Math.random() * 3.5,
          life: 0.7 + Math.random() * 0.5,
          size: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }

    /** World Y where the player’s feet meet the visible lava (wave crest / fill line). */
    function getLavaCrestY() {
      const surfaceH = Math.round(floorTiles.surface.height * FLOOR_TILE_SCALE)
      const waveLift = Math.round(surfaceH * FLOOR_SURFACE_WAVE_RATIO) + FLOOR_WAVE_POP_ABOVE
      const surfaceTop = groundY - waveLift
      const bob = Math.round(Math.sin(tick * 0.035) * LAVA_SURFACE_BOB)
      const surfaceY = surfaceTop + bob
      return surfaceY + Math.round(surfaceH * FLOOR_SURFACE_WAVE_RATIO)
    }

    function getLavaContactY() {
      return Math.max(getLavaCrestY() + 10, groundY - 2)
    }

    function spawnLavaEmber(x: number, crestY: number) {
      const fast = Math.random() < 0.28
      const breezy = Math.random() < 0.22
      lavaEmbers.push({
        x: x + (Math.random() - 0.5) * 10,
        y: crestY - EMBER_SPAWN_LIFT_MIN - Math.random() * EMBER_SPAWN_LIFT_RANGE,
        vy: fast ? -(0.85 + Math.random() * 0.65) : -(0.38 + Math.random() * 0.48),
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 0.07 + Math.random() * 0.09,
        wobbleAmp: 0.35 + Math.random() * 0.75,
        age: 0,
        maxLife: fast ? 42 + Math.random() * 28 : 62 + Math.random() * 38,
        size: Math.random() < 0.3 ? 5 : 4,
        breezeVx: breezy ? (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.6) : 0,
      })
    }

    function cloudTopForRideAt(rideWorldY: number) {
      return rideWorldY - CLOUD_RIDE_Y
    }

    /** Platform-top Y values: dropY = surface, hover offsets are above that. */
    function getRescueDrop() {
      const plat = player.lastSafePlat
      if (plat && !plat.ground) {
        return {
          dropX: plat.x + plat.w / 2,
          dropY: plat.y,
        }
      }
      return {
        dropX: player.lastSafeX,
        dropY: player.lastSafeY,
      }
    }

    function syncPlayerOnCloud() {
      player.x = cloud.x - player.w / 2
      // Match drawCharacter feet anchor (hitbox + CHAR_FEET_TRIM)
      player.y = cloud.y + CLOUD_RIDE_Y - player.h - CHAR_FEET_TRIM
    }

    function playSizzle() {
      try {
        const a = getAudio()
        const len = a.sampleRate * 0.18
        const buf = a.createBuffer(1, len, a.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / len)
        }
        const src = a.createBufferSource()
        const g = a.createGain()
        const f = a.createBiquadFilter()
        src.buffer = buf
        f.type = 'bandpass'
        f.frequency.value = 900
        src.connect(f)
        f.connect(g)
        g.connect(a.destination)
        g.gain.value = 0.07
        src.start()
      } catch {
        /* ignore */
      }
    }

    function tryOpen() {
      if (player.state !== 'normal') return
      const p = PORTALS.find((po) => po.active)
      if (p) setModal(p.proj)
    }
    tryOpenRef.current = tryOpen

    function playOuch() {
      try {
        const a = getAudio()
        const o = a.createOscillator()
        const g = a.createGain()
        o.type = 'sawtooth'
        o.connect(g)
        g.connect(a.destination)
        o.frequency.setValueAtTime(380, a.currentTime)
        o.frequency.exponentialRampToValueAtTime(80, a.currentTime + 0.3)
        g.gain.setValueAtTime(0.08, a.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3)
        o.start()
        o.stop(a.currentTime + 0.3)
      } catch {
        /* ignore */
      }
    }

    function beginCloudRescue() {
      if (cloud.phase !== 'idle') return
      const contact = getLavaContactY()
      player.state = 'ouch'
      player.vx = 0
      player.vy = 0
      player.y = contact - player.h

      const playerScreen = player.x + player.w / 2 - camX
      cloud.fromLeft = playerScreen > W / 2
      cloud.x = cloud.fromLeft ? camX - 120 : camX + W + 120
      cloud.y = cloudTopForRideAt(contact - 20)
      cloud.targetX = player.x + player.w / 2
      cloud.targetY = cloudTopForRideAt(contact + 2)
      const drop = getRescueDrop()
      cloud.dropX = drop.dropX
      cloud.dropY = drop.dropY
      cloud.phase = 'ouch'
      cloud.timer = 0
    }

    function startLavaHit() {
      if (cloud.phase !== 'idle' || player.state !== 'normal') return
      const contact = getLavaContactY()
      player.state = 'lava'
      lavaHitTimer = 0
      player.vx *= 0.35
      player.vy = 4 * SPEED
      camShake = 3
      lavaFlash = 10
      playSizzle()
      spawnLavaSplash(player.x + player.w / 2, contact, 14)
      const crestY = getLavaCrestY()
      for (let i = 0; i < 6; i++) {
        spawnLavaEmber(player.x + player.w / 2 + (Math.random() - 0.5) * 40, crestY)
      }
      for (let i = 0; i < 6; i++) {
        lavaBubbles.push({
          x: player.x + player.w / 2 + (Math.random() - 0.5) * 28,
          y: contact + Math.random() * 6,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -1.2 - Math.random() * 1.8,
          life: 0.9,
          r: 2 + Math.random() * 3,
        })
      }
    }

    function updateLavaHit() {
      if (player.state !== 'lava') return
      lavaHitTimer++
      const contact = getLavaContactY()
      if (lavaHitTimer < 14) {
        player.vy = Math.min(player.vy + 0.4 * SPEED, 9 * SPEED)
        player.y += player.vy
        if (player.y + player.h >= contact) {
          player.y = contact - player.h
          player.vy = 0
        }
      } else {
        player.vy = 0
        const sink = 5 * Math.sin(Math.min(1, (lavaHitTimer - 14) / 10) * Math.PI * 0.5)
        const bob = Math.sin(lavaHitTimer * 0.22) * 1.5
        player.y = contact - player.h + sink + bob
      }

      if (lavaHitTimer > 10 && lavaHitTimer % 5 === 0) {
        spawnLavaSplash(player.x + player.w / 2, contact + 2, 2)
      }
      if (lavaHitTimer === 20) playOuch()
      if (camShake > 0) camShake = Math.max(0, camShake - 0.25)

      if (lavaHitTimer >= LAVA_HIT_FRAMES) {
        beginCloudRescue()
      }
    }

    function updateCloud() {
      if (cloud.phase === 'idle') return
      cloud.timer++
      cloud.wobble = Math.sin(tick * 0.08) * 2

      if (cloud.phase === 'ouch') {
        if (cloud.timer > 50) {
          cloud.phase = 'swoop_in'
          cloud.timer = 0
        }
      } else if (cloud.phase === 'swoop_in') {
        cloud.x = ease(cloud.x, cloud.targetX, 0.09)
        cloud.y = ease(cloud.y, cloud.targetY, 0.07)
        if (Math.abs(cloud.x - cloud.targetX) < 8) {
          cloud.phase = 'scoop'
          cloud.timer = 0
          cloud.y = cloud.targetY
          playSound(300, 500, 0.15)
          player.state = 'riding'
          syncPlayerOnCloud()
          spawnParticles(cloud.x, cloud.y + CLOUD_RIDE_Y, 6)
        }
      } else if (cloud.phase === 'scoop') {
        const lift = ease(0, 1, Math.min(1, cloud.timer / 22))
        cloud.y = ease(cloud.y, cloud.targetY - 10 * (1 - lift), 0.14)
        syncPlayerOnCloud()
        if (cloud.timer > 25) {
          cloud.phase = 'rise'
          cloud.timer = 0
        }
      } else if (cloud.phase === 'rise') {
        const riseTargetY = cloudTopForRideAt(cloud.dropY - 58)
        cloud.x = ease(cloud.x, cloud.dropX, 0.04)
        cloud.y = ease(cloud.y, riseTargetY, 0.06)
        syncPlayerOnCloud()
        if (Math.abs(cloud.y - riseTargetY) < 4 && cloud.timer > 40) {
          cloud.phase = 'carry'
          cloud.timer = 0
        }
      } else if (cloud.phase === 'carry') {
        cloud.x = ease(cloud.x, cloud.dropX, 0.07)
        cloud.y = ease(cloud.y, cloudTopForRideAt(cloud.dropY - 42), 0.05)
        syncPlayerOnCloud()
        if (Math.abs(cloud.x - cloud.dropX) < 6 && cloud.timer > 20) {
          cloud.phase = 'descend'
          cloud.timer = 0
        }
      } else if (cloud.phase === 'descend') {
        const landTop = cloudTopForRideAt(cloud.dropY)
        cloud.x = ease(cloud.x, cloud.dropX, 0.1)
        cloud.y = ease(cloud.y, landTop, 0.09)
        syncPlayerOnCloud()
        if (Math.abs(cloud.y - landTop) < 4 && Math.abs(cloud.x - cloud.dropX) < 8) {
          cloud.phase = 'hop_off'
          cloud.timer = 0
        }
      } else if (cloud.phase === 'hop_off') {
        const landTop = cloudTopForRideAt(cloud.dropY)
        cloud.x = ease(cloud.x, cloud.dropX, 0.14)
        cloud.y = ease(cloud.y, landTop, 0.12)
        syncPlayerOnCloud()
        if (cloud.timer >= 12) {
          const cx = player.x + player.w / 2
          const dx = cloud.dropX - cx
          player.state = 'normal'
          player.vy = JF * 0.78
          player.vx = Math.max(-HOP_OFF_VX_MAX, Math.min(HOP_OFF_VX_MAX, dx * HOP_OFF_VX_SCALE))
          player.onGround = false
          player.facing = player.vx >= 0 ? 1 : -1
          playSound(300, 520, 0.1)
          spawnParticles(player.x + player.w / 2, player.y + player.h, 6)
          cloud.phase = 'release'
          cloud.timer = 0
        }
      } else if (cloud.phase === 'release') {
        const exitX = cloud.fromLeft ? camX + W + 150 : camX - 150
        cloud.x = ease(cloud.x, exitX, 0.06)
        cloud.y = ease(cloud.y, cloud.y - 1, 1)
        if (Math.abs(cloud.x - exitX) < 20 || cloud.timer > 80) {
          cloud.phase = 'idle'
        }
      }
    }

    function drawCloud(fx: CanvasRenderingContext2D) {
      if (cloud.phase === 'idle' || cloud.phase === 'ouch') return
      const sx = Math.round(cloud.x - camX - CLOUD_DRAW_W / 2)
      const sy = Math.round(cloud.y + cloud.wobble)
      fx.imageSmoothingEnabled = false
      fx.drawImage(art.cloud, sx, sy, CLOUD_DRAW_W, CLOUD_DRAW_H)
    }

    function pickCharacterFrame(char: CharacterFrames): HTMLImageElement {
      if (player.state === 'lava') {
        return lavaHitTimer < 12 ? char.falling : char.onGround
      }
      if (player.state === 'ouch') return char.onGround
      if (player.state === 'riding') {
        if (cloud.phase === 'hop_off' && cloud.timer >= 6) return char.jump1
        return char.idle
      }
      const fallingIntoLava =
        player.state === 'normal' &&
        !player.onGround &&
        player.vy > 0.5 &&
        player.y + player.h > groundY - 130
      if (fallingIntoLava) return char.falling
      if (!player.onGround) {
        if (player.vy < -0.8) return char.jump1
        if (player.vy > 2) return char.jump2
        return Math.floor(tick / 7) % 2 === 0 ? char.jump1 : char.jump2
      }
      if (Math.abs(player.vx) > 0.5) return player.frame === 0 ? char.run1 : char.run2
      return char.idle
    }

    function drawLavaFlash() {
      if (lavaFlash <= 0) return
      lavaFlash--
      const cx = player.x + player.w / 2 - Math.round(camX)
      const cy = getLavaContactY()
      const a = lavaFlash / 14
      fg.save()
      fg.globalAlpha = a * 0.35
      fg.fillStyle = '#ff6b1a'
      for (let i = 0; i < 5; i++) {
        const w = 18 + i * 10
        fg.fillRect(cx - w / 2, cy - 4 - i * 2, w, 5)
      }
      fg.restore()
    }

    function drawCharacter(char: CharacterFrames) {
      const img = pickCharacterFrame(char)
      if (!img.naturalWidth || !img.naturalHeight) return
      const shakeX = camShake > 0 ? Math.sin(tick * 2.2) * camShake * 0.12 : 0
      const shakeY = camShake > 0 ? Math.cos(tick * 2.8) * camShake * 0.08 : 0
      const cx = player.x + player.w / 2 - Math.round(camX) + shakeX
      const cy = player.y + player.h + CHAR_FEET_TRIM + shakeY
      const th = CHAR_DRAW_H
      const tw = (img.naturalWidth / img.naturalHeight) * th
      const faceForward = img === char.idle
      fg.save()
      fg.imageSmoothingEnabled = false
      fg.translate(cx, cy)
      fg.scale(faceForward ? 1 : player.facing, 1)
      fg.drawImage(img, -tw / 2, -th, tw, th)
      fg.restore()
    }

    function drawParallaxSceneBg(img: HTMLImageElement) {
      const drawH = H
      const drawW = (img.width / img.height) * drawH
      if (drawW <= 0 || drawH <= 0) return

      const scroll = camX * 0.28
      let x = -(scroll % drawW)
      if (x > 0) x -= drawW

      c.save()
      c.imageSmoothingEnabled = true
      const tileW = Math.ceil(drawW) + 1
      for (; x < W + drawW; x += drawW) {
        c.drawImage(img, Math.floor(x), 0, tileW, drawH)
      }
      c.restore()
    }

    function drawBg(pal: Palette) {
      const isDark = themeRef.current === 'dark'
      const sceneBg = isDark ? sceneBackgrounds.dark : sceneBackgrounds.light

      if (sceneBg.naturalWidth > 0) {
        drawParallaxSceneBg(sceneBg)
        return
      }

      c.fillStyle = cachedPageBg
      c.fillRect(0, 0, W, H)

      const sky = c.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, pal.bgGradTop)
      sky.addColorStop(1, pal.bgGradBottom)
      c.fillStyle = sky
      c.fillRect(0, 0, W, H)

      const vx = W * 0.5
      const vy = H * 0.32
      const vig = c.createRadialGradient(vx, vy, 0, vx, H * 0.55, Math.max(W, H) * 0.82)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, pal.bgVignette)
      c.fillStyle = vig
      c.fillRect(0, 0, W, H)

      const gsMajor = 56
      const gsMinor = 14
      c.lineWidth = 0.35
      const oxM = (-camX * 0.08) % gsMajor
      for (let x = oxM - gsMajor; x < W + gsMajor; x += gsMajor) {
        c.strokeStyle = pal.grid
        c.beginPath()
        c.moveTo(x, 0)
        c.lineTo(x, H)
        c.stroke()
      }
      const oxm = (-camX * 0.05) % gsMinor
      for (let x = oxm - gsMinor; x < W + gsMinor; x += gsMinor) {
        c.strokeStyle = pal.gridMinor
        c.beginPath()
        c.moveTo(x, 0)
        c.lineTo(x, H)
        c.stroke()
      }
      for (let y = 0; y < H; y += gsMinor) {
        c.strokeStyle = pal.gridMinor
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(W, y)
        c.stroke()
      }
      for (let y = 0; y < H; y += gsMajor) {
        c.strokeStyle = pal.grid
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(W, y)
        c.stroke()
      }

      stars.forEach((s) => {
        const sx = ((s.x - camX * s.speed) + WORLD_W * 2) % W
        c.fillStyle = pal.star
        c.beginPath()
        c.arc(sx, s.y, s.r, 0, Math.PI * 2)
        c.fill()
      })

    }

    function drawScrollingTile(
      img: HTMLImageElement,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
      srcScrollX: number,
    ) {
      const sw = img.width
      const sh = img.height
      const sx = ((Math.floor(srcScrollX) % sw) + sw) % sw
      const x = Math.round(dx)
      const y = Math.round(dy)
      if (sx === 0) {
        c.drawImage(img, 0, 0, sw, sh, x, y, dw, dh)
        return
      }
      const w1 = Math.floor((dw * (sw - sx)) / sw)
      const w2 = dw - w1
      c.drawImage(img, sx, 0, sw - sx, sh, x, y, w1, dh)
      c.drawImage(img, 0, 0, sx, sh, x + w1, y, w2, dh)
    }

    function drawFloor() {
      const { surface, fill } = floorTiles
      const tileW = Math.round(surface.width * FLOOR_TILE_SCALE)
      const surfaceH = Math.round(surface.height * FLOOR_TILE_SCALE)
      const fillH = Math.round(fill.height * FLOOR_TILE_SCALE)
      const waveLift = Math.round(surfaceH * FLOOR_SURFACE_WAVE_RATIO) + FLOOR_WAVE_POP_ABOVE
      const surfaceTop = groundY - waveLift
      const fillTop = groundY - TILE_SEAM_OVERLAP
      const stepX = tileW - TILE_SEAM_OVERLAP
      const bleed = TILE_SEAM_OVERLAP
      const drawCam = Math.round(camX)
      const lavaScroll = tick * LAVA_FILL_FLOW_X
      const fillScroll = lavaScroll
      const surfaceScroll = lavaScroll
      const globalBob = Math.round(Math.sin(tick * 0.035) * LAVA_SURFACE_BOB)
      const surfaceY = surfaceTop + globalBob

      c.save()
      c.imageSmoothingEnabled = false
      c.translate(-drawCam, 0)

      for (let wx = 0; wx < WORLD_W + tileW; wx += stepX) {
        if (wx + tileW < drawCam - tileW || wx > drawCam + W + tileW) continue
        for (let wy = fillTop; wy < H + fillH; wy += fillH) {
          drawScrollingTile(fill, wx, wy, tileW + bleed, fillH, fillScroll)
        }
      }

      for (let wx = 0; wx < WORLD_W + tileW; wx += stepX) {
        if (wx + tileW < drawCam - tileW || wx > drawCam + W + tileW) continue
        drawScrollingTile(surface, wx, surfaceY, tileW + bleed, surfaceH + bleed, surfaceScroll)
      }

      const isDark = themeRef.current === 'dark'
      const boost = lavaGlowBoostRef.current
      const crestY = surfaceY + Math.round(surfaceH * FLOOR_SURFACE_WAVE_RATIO)

      if (isDark || boost > 0) {
        const pulse = 0.08 + Math.sin(tick * 0.06) * 0.04
        const glow = isDark
          ? pulse * (0.35 + boost * 1.15)
          : pulse * (1 + boost * 2.4)
        c.globalCompositeOperation = 'lighter'
        c.globalAlpha = glow
        c.fillStyle = isDark ? '#ff5a1a' : '#ff9a3c'
        for (let wx = 0; wx < WORLD_W + tileW; wx += stepX) {
          if (wx + tileW < drawCam - tileW || wx > drawCam + W + tileW) continue
          c.fillRect(wx, crestY, tileW + bleed, isDark ? 3 : 2)
        }
        c.globalAlpha = 1
        c.globalCompositeOperation = 'source-over'
      }

      c.restore()
    }

    function drawLavaBubbles() {
      const drawCam = Math.round(camX)
      const intensity = 0.7 + lavaGlowBoostRef.current * 0.3
      c.save()
      c.imageSmoothingEnabled = false
      c.translate(-drawCam, 0)
      for (const b of lavaBubbles) {
        const a = b.life * intensity
        const px = Math.round(b.x)
        const py = Math.round(b.y)
        const r = Math.max(1, Math.round(b.r))
        c.fillStyle = `rgba(255, 140, 40, ${a * 0.9})`
        c.fillRect(px, py, r, r)
        c.fillStyle = `rgba(255, 220, 120, ${a * 0.55})`
        c.fillRect(px, py - 1, Math.max(1, r - 1), 1)
      }
      c.restore()
    }

    function drawLavaEmbers(fx: CanvasRenderingContext2D) {
      const drawCam = Math.round(camX)
      const intensity = 0.62 + lavaGlowBoostRef.current * 0.38
      fx.save()
      fx.imageSmoothingEnabled = false
      fx.translate(-drawCam, 0)

      for (const ember of lavaEmbers) {
        const progress = ember.age / ember.maxLife
        if (progress >= 1) continue

        const fade = 1 - progress * progress * 0.9
        const heat = Math.min(1, progress * 1.25)
        const r = Math.round(252 + (205 - 252) * heat)
        const g = Math.round(188 + (38 - 188) * heat)
        const b = Math.round(40 + (8 - 40) * heat)
        const alpha = fade * (0.68 + (1 - heat) * 0.22) * intensity
        const px = Math.round(ember.x)
        const py = Math.round(ember.y)
        const sz = ember.size

        fx.fillStyle = `rgba(255, 120, 24, ${alpha * 0.28})`
        fx.fillRect(px - 1, py - 1, sz + 2, sz + 2)

        fx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        fx.fillRect(px, py, sz, sz)

        if (progress < 0.28) {
          fx.fillStyle = `rgba(255, 220, 110, ${alpha * 0.65})`
          fx.fillRect(px, py, Math.max(2, sz - 1), Math.max(2, sz - 1))
        }
      }

      fx.restore()
    }

    function drawPlatform(pl: Plat) {
      if (pl.ground) return
      const segments = 2 + PLATFORM_MIDDLE_COUNT
      const baseW = Math.floor(pl.w / segments)
      const tileH = baseW
      const bleed = TILE_SEAM_OVERLAP
      const drawCam = Math.round(camX)

      c.save()
      c.imageSmoothingEnabled = false
      c.translate(-drawCam, 0)

      let segX = pl.x
      const drawSeg = (img: CanvasImageSource, isLast: boolean) => {
        const segW = isLast ? pl.x + pl.w - segX : baseW
        c.drawImage(img, segX, pl.y, segW + bleed, tileH + bleed)
        segX += segW - (isLast ? 0 : bleed)
      }

      drawSeg(platformTiles.left, false)
      for (let i = 0; i < PLATFORM_MIDDLE_COUNT; i++) {
        drawSeg(platformTiles.mid, false)
      }
      drawSeg(platformTiles.right, true)

      c.restore()
    }

    function drawPortalLabel(
      fx: CanvasRenderingContext2D,
      cx: number,
      portalTopY: number,
      name: string,
      route: string,
      active: boolean,
    ) {
      const titleSize = 12
      const routeSize = 9
      const lineGap = 6
      const padX = 12
      const padY = 8

      fx.font = `400 ${titleSize}px ${FONT_SILK}`
      const titleW = fx.measureText(name).width
      fx.font = `400 ${routeSize}px ${FONT_MONO}`
      const routeW = fx.measureText(route).width
      const boxW = Math.max(titleW, routeW) + padX * 2
      const boxH = titleSize + routeSize + lineGap + padY * 2
      const left = cx - boxW / 2
      const top = portalTopY - boxH - 12

      traceChamferedRect(fx, left, top, boxW, boxH, TOOLTIP_CHAMFER)
      fx.fillStyle = TOOLTIP_BG
      fx.fill()
      fx.strokeStyle = TOOLTIP_BORDER
      fx.lineWidth = active ? 2.5 : 2
      fx.stroke()

      fx.textAlign = 'center'
      fx.textBaseline = 'middle'
      const titleY = top + padY + titleSize / 2
      const routeY = titleY + titleSize / 2 + lineGap + routeSize / 2

      fx.font = `400 ${titleSize}px ${FONT_SILK}`
      fx.fillStyle = TOOLTIP_TITLE
      fx.fillText(name, cx, titleY)

      fx.font = `400 ${routeSize}px ${FONT_MONO}`
      fx.fillStyle = TOOLTIP_ROUTE
      fx.fillText(route, cx, routeY)

      fx.textBaseline = 'alphabetic'
    }

    function syncDecorationSprites() {
      const drawCam = Math.round(camX)
      platformDecorations.forEach((d, i) => {
        const img = decoSprites[i]
        const plat = floatingPlats[d.platIndex]
        if (!img || !plat) return
        const centerX = plat.x + plat.w * d.anchorX
        const left = Math.round(centerX - drawCam - d.drawW / 2)
        const top = Math.round(plat.y - d.drawH + 2)
        img.style.left = `${left}px`
        img.style.top = `${top}px`
        img.style.width = `${d.drawW}px`
        img.style.height = `${d.drawH}px`
        img.style.transform = d.flip ? 'scaleX(-1)' : ''
      })
    }

    function portalProximity(p: Portal): number {
      if (player.state !== 'normal') return 0
      const pcx = player.x + player.w / 2
      const pcy = player.y + player.h / 2
      const tcx = p.x
      const tcy = p.y + p.h / 2
      const dx = Math.abs(pcx - tcx)
      const dy = Math.abs(pcy - tcy)
      const rx = p.w * 0.88 + 40
      const ry = p.h * 0.75 + 36
      const dist = Math.hypot(dx / rx, dy / ry)
      if (dist >= 1) return 0
      const t = 1 - dist
      return t * t
    }

    function drawPortalGlow(fx: CanvasRenderingContext2D) {
      const drawCam = Math.round(camX)
      fx.save()
      fx.imageSmoothingEnabled = true
      fx.translate(-drawCam, 0)

      PORTALS.forEach((p, i) => {
        const prox = p.proximity
        if (prox <= 0.02) return

        const cx = p.x
        const cy = p.y + p.h * 0.52
        const baseR = p.w * 0.5
        const pulseT = tick * 0.032 + i * 1.35
        const pulse =
          0.5 +
          (Math.sin(pulseT) * 0.62 + Math.sin(pulseT * 0.55 + 0.6) * 0.38) * 0.5
        const glowR = baseR * (1.05 + prox * 0.35 + pulse * 0.1)

        const innerAlpha = (0.22 + pulse * 0.08) * prox
        const inner = fx.createRadialGradient(cx, cy, baseR * 0.08, cx, cy, glowR)
        inner.addColorStop(0, `rgba(140, 176, 255, ${innerAlpha})`)
        inner.addColorStop(0.42, `rgba(104, 136, 248, ${innerAlpha * 0.58})`)
        inner.addColorStop(1, 'rgba(104, 136, 248, 0)')
        fx.fillStyle = inner
        fx.beginPath()
        fx.arc(cx, cy, glowR, 0, Math.PI * 2)
        fx.fill()

        for (let ring = 0; ring < 2; ring++) {
          const phase = (tick * 0.011 + i * 0.65 + ring * 0.5) % 1
          const eased = 1 - (1 - phase) ** 3
          const ringR = baseR * (0.72 + eased * 1.05)
          const fade = 1 - phase
          const alpha = fade * fade * fade * 0.34 * prox
          fx.strokeStyle = `rgba(120, 168, 255, ${alpha})`
          fx.lineWidth = 1.5 + fade * fade * 2.5
          fx.beginPath()
          fx.arc(cx, cy, ringR, 0, Math.PI * 2)
          fx.stroke()
        }
      })

      fx.restore()
    }

    function syncPortalSprites() {
      const drawCam = Math.round(camX)
      PORTALS.forEach((p, i) => {
        const img = portalSprites[i]
        if (!img) return
        const left = Math.round(p.x - drawCam - p.w / 2)
        const top = Math.round(p.y)
        img.style.left = `${left}px`
        img.style.top = `${top}px`
        img.style.width = `${p.w}px`
        img.style.height = `${p.h}px`
        img.style.transform = ''
        const prox = p.proximity
        if (prox > 0.04) {
          const pulseT = tick * 0.034 + i * 1.1
          const pulse =
            0.68 +
            (Math.sin(pulseT) * 0.62 + Math.sin(pulseT * 0.55 + 0.5) * 0.38) * 0.28
          const blur = 6 + prox * 14 * pulse
          const alpha = 0.32 + prox * 0.4 * pulse
          img.style.filter = `drop-shadow(0 0 ${blur}px rgba(104, 136, 248, ${alpha}))`
        } else {
          img.style.filter = ''
        }
      })
    }

    function drawPortalLabelOn(fx: CanvasRenderingContext2D, p: Portal) {
      const cx = p.x - Math.round(camX)
      drawPortalLabel(fx, cx, p.y, p.proj.name, p.proj.route, p.active)
    }

    function update() {
      tick++
      lavaGlowBoostRef.current = getLavaGlowBoost(
        themeRef.current,
        themeTransitionRef.current,
      )
      const keys = keysRef.current
      if (player.state === 'normal') {
        if (keys.ArrowLeft || keys.KeyA) {
          player.vx = -SP
          player.facing = -1
        } else if (keys.ArrowRight || keys.KeyD) {
          player.vx = SP
          player.facing = 1
        } else player.vx *= 0.75
        if ((keys.ArrowUp || keys.KeyW) && player.onGround) {
          player.vy = JF
          player.onGround = false
          playSound(280, 520, 0.12)
          spawnParticles(player.x + player.w / 2, player.y + player.h)
        }
        player.vy += G
        if (!player.onGround && player.y + player.h > groundY - 150) {
          player.vy += G * 0.95
        }
        player.x += player.vx
        player.y += player.vy
        player.onGround = false
        for (const pl of PLATS) {
          if (
            player.x + player.w > pl.x &&
            player.x < pl.x + pl.w &&
            player.y + player.h > pl.y &&
            player.y + player.h < pl.y + pl.h + 18 &&
            player.vy >= 0
          ) {
            player.y = pl.y - player.h
            player.vy = 0
            player.onGround = true
            if (!pl.ground) {
              player.lastSafeX = pl.x + pl.w / 2
              player.lastSafeY = pl.y
              player.lastSafePlat = pl
            }
          }
        }
        if (player.x < 0) player.x = 0
        if (player.x > WORLD_W - player.w) player.x = WORLD_W - player.w
        if (player.y + player.h >= getLavaContactY() && cloud.phase === 'idle') {
          startLavaHit()
        }
      }

      updateLavaHit()
      updateCloud()

      if (player.state === 'ouch') {
        player.y = getLavaContactY() - player.h
        player.vx = 0
        player.vy = 0
      }

      if (camShake > 0 && player.state !== 'lava') camShake--

      const targetCam = player.x - W / 2 + player.w / 2
      camX += (targetCam - camX) * CAM_FOLLOW
      camX = Math.max(0, Math.min(WORLD_W - W, camX))

      if (Math.abs(player.vx) > 0.5 && player.onGround && player.state === 'normal') {
        player.frameTimer++
        if (player.frameTimer > RUN_ANIM_INTERVAL) {
          player.frame = (player.frame + 1) % 2
          player.frameTimer = 0
        }
        if (tick % TRAIL_SPAWN_EVERY === 0)
          player.trail.push({ x: player.x + player.w / 2, y: player.y + player.h, life: 1 })
      } else if (player.onGround) player.frame = 0

      player.trail = player.trail.filter((t) => {
        t.life -= 0.1
        return t.life > 0
      })
      particles = particles.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12
        p.life -= 0.04
        return p.life > 0
      })

      if (tick % 10 === 0 && lavaBubbles.length < 48) {
        const viewL = camX - 40
        const viewR = camX + W + 40
        const spawnN = 1 + (Math.random() < 0.45 ? 1 : 0)
        for (let i = 0; i < spawnN; i++) {
          lavaBubbles.push({
            x: viewL + Math.random() * (viewR - viewL),
            y: groundY + 2 + Math.random() * 22,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.3 - Math.random() * 0.55,
            life: 0.55 + Math.random() * 0.45,
            r: 1 + Math.random() * 2.5,
          })
        }
      }
      lavaBubbles = lavaBubbles.filter((b) => {
        b.x += b.vx
        b.y += b.vy
        b.vy -= 0.008
        b.life -= 0.018
        return b.life > 0 && b.y > groundY - 48
      })

      if (tick % EMBER_SPAWN_EVERY === 0 && lavaEmbers.length < EMBER_MAX) {
        const crestY = getLavaCrestY()
        const viewL = camX - 24
        const viewR = camX + W + 24
        const spawnN = 1 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.15 ? 1 : 0)
        for (let i = 0; i < spawnN && lavaEmbers.length < EMBER_MAX; i++) {
          spawnLavaEmber(viewL + Math.random() * (viewR - viewL), crestY)
        }
      }

      const emberCullY = getLavaCrestY() - 165
      lavaEmbers = lavaEmbers.filter((ember) => {
        ember.age++
        ember.y += ember.vy
        ember.x +=
          ember.breezeVx +
          Math.sin(ember.age * ember.wobbleFreq + ember.wobblePhase) * ember.wobbleAmp
        if (ember.breezeVx !== 0) {
          ember.breezeVx *= 0.998
          if (Math.abs(ember.breezeVx) < 0.05) ember.breezeVx = 0
        } else if (Math.random() < 0.006) {
          ember.breezeVx = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 1.1)
        }
        return ember.age < ember.maxLife && ember.y > emberCullY
      })

      let nearAny = false
      PORTALS.forEach((p) => {
        p.proximity = portalProximity(p)
        const dx = Math.abs(player.x + player.w / 2 - p.x)
        const dy = Math.abs(player.y + player.h / 2 - (p.y + p.h / 2))
        p.active =
          dx < p.w * 0.55 + 10 && dy < p.h * 0.48 + 24 && player.state === 'normal'
        if (p.active) nearAny = true
      })
      if (nearAny) {
        const ap = PORTALS.find((p) => p.active)
        if (ap) {
          ehintEl.style.display = 'block'
          ehintEl.style.left = `${ap.x - Math.round(camX)}px`
          ehintEl.style.top = `${ap.y - ap.h - 20}px`
        }
      } else ehintEl.style.display = 'none'
    }

    const onResize = () => resize()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') resize()
    }
    const onViewTransitionEnd = () => resize()

    function loop() {
      const pal = getPalette(themeRef.current)
      const isDark = themeRef.current === 'dark'
      update()
      clearBgCanvas()
      drawBg(pal)
      drawFloor()
      drawLavaBubbles()
      PLATS.forEach((pl) => drawPlatform(pl))
      drawPortalGlow(c)
      PORTALS.forEach((p) => drawPortalLabelOn(c, p))
      syncDecorationSprites()
      syncPortalSprites()

      fg.clearRect(0, 0, W, H)
      player.trail.forEach((t) => {
        fg.fillStyle = isDark ? `rgba(160,160,160,${t.life * 0.28})` : `rgba(136,135,128,${t.life * 0.35})`
        fg.fillRect(t.x - Math.round(camX) - 1, t.y - 3, 3, 3)
      })
      particles.forEach((p) => {
        const alpha = p.life
        if (p.color.startsWith('#')) {
          fg.fillStyle = p.color
          fg.globalAlpha = alpha
        } else {
          fg.globalAlpha = alpha * (isDark ? 0.45 : 0.6)
          fg.fillStyle = p.color
        }
        fg.fillRect(p.x - Math.round(camX) - p.size / 2, p.y - p.size / 2, p.size, p.size)
      })
      fg.globalAlpha = 1
      drawLavaEmbers(fg)
      drawLavaFlash()
      drawCloud(fg)
      drawCharacter(art)
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('viewtransitionend', onViewTransitionEnd)

    teardown = () => {
      persistGameSnapshot(projectsKey, snapshotGameState(player, camX), gamePersistRef)
      cancelAnimationFrame(raf)
      tryOpenRef.current = null
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('viewtransitionend', onViewTransitionEnd)
      ehintEl.style.display = 'none'
      portalLayer.innerHTML = ''
    }

    raf = requestAnimationFrame(loop)
    })()

    return () => {
      ac.abort()
      teardown?.()
    }
  }, [active, projects, projectsKey])

  return (
    <>
      <h2 className="sr-only">
        Project platformer — arrow keys or A D to move, W or up arrow to jump, E to open a project, C
        to close
      </h2>
      <div ref={wrapRef} className={styles.wrap} role="application" aria-label="Projects mini game">
        <canvas ref={bgCanvasRef} className={styles.bgCanvas} />
        <div ref={portalLayerRef} className={styles.portalLayer} aria-hidden />
        <canvas ref={fgCanvasRef} className={styles.fgCanvas} />
        <div className={styles.hint}>
          {modal ? (
            <span className={styles.hintRow}>C close</span>
          ) : (
            <>
              <span className={styles.hintRow}>← → move</span>
              <span className={styles.hintSep} aria-hidden="true">
                ·
              </span>
              <span className={styles.hintRow}>↑ jump</span>
              <span className={styles.hintSep} aria-hidden="true">
                ·
              </span>
              <span className={styles.hintRow}>E open</span>
            </>
          )}
        </div>
        <div ref={ehintRef} className={styles.ehint}>
          press E to open
        </div>
        <div
          className={`${styles.overlay} ${showWelcome || modal ? styles.open : ''}`}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return
            if (modal) closeModal()
          }}
          role="presentation"
        >
          {showWelcome ? (
            <div
              className={styles.welcomePanel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pg-welcome-title"
              aria-describedby="pg-welcome-prompt"
            >
              <h2 id="pg-welcome-title" className={styles.welcomeTitle}>
                WELCOME TO ZAIN&apos;S WORLD!
              </h2>
              <p id="pg-welcome-prompt" className={styles.welcomePrompt}>
                press [enter] to continue
              </p>
              </div>
          ) : modal ? (
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pg-modal-title">
              <button type="button" className={styles.close} onClick={closeModal} aria-label="Close">
                ×
              </button>
              <div className={styles.mtag}>{modal.route}</div>
              <div id="pg-modal-title" className={styles.mtitle}>
                {modal.name}
              </div>
              <div className={styles.mdesc}>{modal.desc}</div>
              <div className={styles.mtags}>
                {modal.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
              <div className={styles.links}>
                <a className={`${styles.link} ${styles.linkGh}`} href={modal.github} target="_blank" rel="noreferrer">
                  github ↗
                </a>
                <a className={`${styles.link} ${styles.linkLive}`} href={modal.live} target="_blank" rel="noreferrer">
                  live site ↗
                </a>
              </div>
              <p className={styles.modalDismiss}>press C to close</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
