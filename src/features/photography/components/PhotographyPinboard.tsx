import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTheme } from '@/shared/hooks/useTheme'
import type { Theme } from '@/shared/hooks/useTheme'
import { getPhotographyLightBoost } from '@/shared/hooks/themeTransition'
import {
  buildBoardRegions,
  getRegionFocusPoint,
  resolvePhotographyOpenRegion,
  toSlideshowTarget,
  type BoardRegionId,
  type BoardCountryLayout,
  type BoardRegionLayout,
  type SlideshowTarget,
} from './pinboardData'
import { hasPinboardPhotoAssets } from './photographyPhotos'
import { regionVisitedBarPercent } from './regionCountryTotals'
import { debounce } from '@/shared/lib/debounce'
import { preloadImage, preloadImages, clearImagePreloadCache } from '@/shared/lib/preloadImage'
import {
  preloadCountryGallery,
  preloadRegionGallery,
  preloadSlideshowRemainder,
} from './photographyPreload'
import { PINBOARD_THEMES, MOBILE_BOARD_BASE } from './pinboardThemes'
import { SlideshowPhoto } from './SlideshowPhoto'
import {
  BOARD_H,
  BOARD_W,
  clamp,
  drawPinboardBoard,
  drawPinboardLightOverlay,
  makePhotoSvg,
  MOBILE_WORLD_SCALE,
} from './pinboardUtils'
import styles from './PhotographyPinboard.module.css'
import mobileStyles from '../../portfolio/components/PhotographyMobile.module.css'
import { PhotographyMobileRegionPills } from '../../portfolio/components/PhotographyMobileRegionPills'
import { patchPortfolioSession, readPortfolioSession } from '../../portfolio/portfolioSessionState'

const CAM_LERP = 0.11
const FLY_DURATION_MS = 1180
const TILT_RADIUS = 210
const TILT_MAX = 9
const LIFT_MAX = 7
const TILT_LERP = 0.15
const CARD_ENTRANCE_MS = 720
const STRING_DELAY_AFTER_CARD_MS = 100
const REGION_LABEL_BASE_DELAY = 280
const STAGGER_REGION_MS = 68
const CARD_BASE_GAP_MS = 300
const STAGGER_CARD_MS = 62
const PHOTO_ENTRANCE_KEY = 'zain-photo-entrance-v1'
const COMING_SOON_DISMISSED_KEY = 'zain-photo-coming-soon-v1'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function hasSeenPhotoEntrance(): boolean {
  try {
    return sessionStorage.getItem(PHOTO_ENTRANCE_KEY) === '1'
  } catch {
    return false
  }
}

function markPhotoEntranceSeen(): void {
  try {
    sessionStorage.setItem(PHOTO_ENTRANCE_KEY, '1')
  } catch {
    /* private mode */
  }
}

function hasDismissedComingSoon(): boolean {
  try {
    return sessionStorage.getItem(COMING_SOON_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function markComingSoonDismissed(): void {
  try {
    sessionStorage.setItem(COMING_SOON_DISMISSED_KEY, '1')
  } catch {
    /* private mode */
  }
}

function shouldSkipFullPhotoEntrance(): boolean {
  return hasSeenPhotoEntrance() || prefersReducedMotion()
}

function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5
}

type FlyAnimation = {
  fromX: number
  fromY: number
  toX: number
  toY: number
  startMs: number
}

type RubberBandSnap = {
  fromX: number
  fromY: number
  toX: number
  toY: number
  startMs: number
}

const INERTIA_FRICTION = 0.92
const INERTIA_MIN = 0.04
const VELOCITY_SAMPLE_MAX = 5
const VELOCITY_SAMPLE_MAX_DT = 48
const PAN_RUBBER_BAND_RATE = 0.35
const PAN_RUBBER_BAND_MAX_OVERFLOW = 80
const RUBBER_BAND_SNAP_MS = 220
const SS_SWIPE_NAV_PX = 48
const SS_SWIPE_DISMISS_PX = 72
const SS_SWIPE_AXIS_RATIO = 1.25
const MIN_ZOOM_SCALE = 0.4
const MAX_ZOOM_SCALE_DESKTOP = 1.75
const MAX_ZOOM_SCALE_MOBILE = 1.6
const WHEEL_ZOOM_SENSITIVITY = 0.004
const SCALE_LERP = 0.18

type VelocitySample = { dx: number; dy: number; dt: number }

function weightedVelocityFromSamples(
  samples: VelocitySample[],
): { vx: number; vy: number } {
  if (samples.length === 0) return { vx: 0, vy: 0 }

  let sumWx = 0
  let sumWy = 0
  let sumW = 0
  for (const { dx, dy, dt } of samples) {
    if (dt <= 0) continue
    const dist = Math.hypot(dx, dy)
    if (dist <= 0) continue
    sumWx += (dx / dt) * dist
    sumWy += (dy / dt) * dist
    sumW += dist
  }

  if (sumW <= 0) return { vx: 0, vy: 0 }
  return { vx: sumWx / sumW, vy: sumWy / sumW }
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function applyPanRubberBand(raw: number, max: number): number {
  if (raw < 0) {
    return -Math.min(-raw * PAN_RUBBER_BAND_RATE, PAN_RUBBER_BAND_MAX_OVERFLOW)
  }
  if (raw > max) {
    return max + Math.min((raw - max) * PAN_RUBBER_BAND_RATE, PAN_RUBBER_BAND_MAX_OVERFLOW)
  }
  return raw
}

function camOutOfBounds(
  tX: number,
  tY: number,
  maxX: number,
  maxY: number,
): boolean {
  return tX < 0 || tX > maxX || tY < 0 || tY > maxY
}

function inertiaMovesTowardBounds(
  tX: number,
  tY: number,
  worldVx: number,
  worldVy: number,
  maxX: number,
  maxY: number,
): boolean {
  if (tX < 0 && worldVx < 0) return false
  if (tX > maxX && worldVx > 0) return false
  if (tY < 0 && worldVy < 0) return false
  if (tY > maxY && worldVy > 0) return false
  return true
}

function maxZoomScale(isMobile: boolean): number {
  return isMobile ? MAX_ZOOM_SCALE_MOBILE : MAX_ZOOM_SCALE_DESKTOP
}

function defaultZoomScale(isMobile: boolean): number {
  return isMobile ? MOBILE_WORLD_SCALE : 1
}

function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function pointerMidpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

type PhotographyPinboardProps = {
  active?: boolean
  theme?: Theme
  variant?: 'desktop' | 'mobile'
  onReadyChange?: (ready: boolean) => void
}

function ChevronIcon({ dir }: { dir: 'prev' | 'next' }) {
  const points = dir === 'prev' ? '15 18 9 12 15 6' : '9 6 15 12 9 18'
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <polyline points={points} />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

type CardEl = {
  layout: BoardCountryLayout
  region: BoardRegionLayout
  el: HTMLButtonElement
  tiltX: number
  tiltY: number
  lift: number
}

export default function PhotographyPinboard({
  active = true,
  theme = 'dark',
  variant = 'desktop',
  onReadyChange,
}: PhotographyPinboardProps) {
  const isMobile = variant === 'mobile'
  const { themeTransition } = useTheme()
  const themeTransitionRef = useRef(themeTransition)
  const regions = useMemo(
    () => buildBoardRegions(isMobile ? { mobile: true } : undefined),
    [isMobile],
  )
  const th = PINBOARD_THEMES[theme]
  const boardBase = isMobile ? MOBILE_BOARD_BASE[theme] : th.boardBase

  useEffect(() => {
    themeTransitionRef.current = themeTransition
  }, [themeTransition])

  const frameRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const lightCanvasRef = useRef<HTMLCanvasElement>(null)
  const cardRefs = useRef<CardEl[]>([])
  const camRef = useRef({ x: 0, y: 0, tX: 0, tY: 0 })
  const zoomRef = useRef({
    scale: defaultZoomScale(isMobile),
    tScale: defaultZoomScale(isMobile),
  })
  const mouseRef = useRef({ x: BOARD_W / 2, y: BOARD_H / 2 })
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef({
    active: false,
    startDist: 0,
    startScale: 1,
    startCamX: 0,
    startCamY: 0,
    focalSx: 0,
    focalSy: 0,
  })
  const dragRef = useRef({
    active: false,
    didDrag: false,
    sx: 0,
    sy: 0,
    cx: 0,
    cy: 0,
  })
  const rafRef = useRef(0)
  const interactingRef = useRef(false)
  const flyRef = useRef<FlyAnimation | null>(null)
  const rubberBandSnapRef = useRef<RubberBandSnap | null>(null)
  const didInitialFlyRef = useRef(false)
  const initialViewStateAppliedRef = useRef(false)
  const velocitySampleBufferRef = useRef<VelocitySample[]>([])
  const lastPointerRef = useRef({ x: 0, y: 0, t: 0 })
  const ssImgWrapRef = useRef<HTMLDivElement>(null)
  const ssSwipeRef = useRef({
    active: false,
    pointerId: -1,
    sx: 0,
    sy: 0,
  })
  const inertiaRef = useRef({ active: false, vx: 0, vy: 0 })

  const [slideshow, setSlideshow] = useState<SlideshowTarget | null>(null)
  const slideshowRef = useRef<SlideshowTarget | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1)
  const [activeRegionId, setActiveRegionId] = useState<BoardRegionId | null>(null)
  const [mounted, setMounted] = useState(false)
  const [legendMounted, setLegendMounted] = useState(false)
  const [floating, setFloating] = useState(false)
  const [comingSoonVisible, setComingSoonVisible] = useState(
    () => !hasPinboardPhotoAssets() && !hasDismissedComingSoon(),
  )
  const entranceCompleteRef = useRef(false)

  const dismissComingSoon = useCallback(() => {
    if (!comingSoonVisible) return
    setComingSoonVisible(false)
    markComingSoonDismissed()
  }, [comingSoonVisible])

  useEffect(() => {
    if (!active || !comingSoonVisible) return
    const onDismiss = () => dismissComingSoon()
    window.addEventListener('pointerdown', onDismiss, { capture: true, once: true })
    return () => window.removeEventListener('pointerdown', onDismiss, { capture: true })
  }, [active, comingSoonVisible, dismissComingSoon])

  const sortedCards = useMemo(() => {
    const cards = regions.flatMap((region) =>
      region.countries.map((layout) => ({ layout, region })),
    )
    return cards.sort((a, b) => a.layout.y - b.layout.y)
  }, [regions])

  const sortedRegions = useMemo(
    () => [...regions].sort((a, b) => a.cy - b.cy),
    [regions],
  )

  const regionFocusPoints = useMemo(
    () =>
      regions
        .filter((r) => r.countries.length > 0)
        .map((r) => ({ id: r.id, ...getRegionFocusPoint(r) })),
    [regions],
  )

  const activeRegionIdRef = useRef<BoardRegionId | null>(null)
  useEffect(() => {
    activeRegionIdRef.current = activeRegionId
  }, [activeRegionId])

  const preloadOpts = useMemo(() => ({ mobile: isMobile }), [isMobile])

  useEffect(() => {
    if (!active || !activeRegionId) return
    const region = regions.find((r) => r.id === activeRegionId)
    if (region) preloadRegionGallery(region, preloadOpts)
  }, [active, activeRegionId, regions, preloadOpts])

  const persistPhotographySession = useCallback(() => {
    patchPortfolioSession({
      photography: {
        activeRegionId,
        cam: { ...camRef.current },
        zoom: {
          scale: zoomRef.current.scale,
          tScale: zoomRef.current.tScale,
        },
        slideshow:
          !isMobile && slideshow
            ? {
                country: slideshow.country,
                slideIndex,
                slideDirection,
              }
            : null,
      },
    })
  }, [activeRegionId, slideshow, slideIndex, slideDirection, isMobile])

  useEffect(() => {
    if (!active) return
    persistPhotographySession()
  }, [active, persistPhotographySession])

  useEffect(() => {
    if (!active) return
    const onHide = () => persistPhotographySession()
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [active, persistPhotographySession])

  useEffect(() => {
    if (active) return
    clearImagePreloadCache()
  }, [active])

  useEffect(
    () => () => {
      if (isMobile) clearImagePreloadCache()
    },
    [isMobile],
  )

  const regionStaggerIndex = useMemo(() => {
    const indexByRegion = new Map<string, number>()
    sortedRegions.forEach((region, index) => {
      indexByRegion.set(region.id, index)
    })
    return indexByRegion
  }, [sortedRegions])

  const cardStaggerIndex = useMemo(() => {
    const indexByCountry = new Map<string, number>()
    sortedCards.forEach(({ layout }, index) => {
      indexByCountry.set(layout.card.country, index)
    })
    return indexByCountry
  }, [sortedCards])

  const showComingSoon = comingSoonVisible
  const totalCards = sortedCards.length
  const regionLabelBaseDelay = REGION_LABEL_BASE_DELAY
  const lastRegionLabelDelay =
    regionLabelBaseDelay +
    Math.max(0, sortedRegions.length - 1) * STAGGER_REGION_MS
  const cardBaseDelay = lastRegionLabelDelay + CARD_BASE_GAP_MS
  const lastCardDelay = cardBaseDelay + totalCards * STAGGER_CARD_MS

  const stringLineDelay = useCallback(
    (countryKey: string) => {
      const staggerIndex = cardStaggerIndex.get(countryKey) ?? 0
      return (
        cardBaseDelay +
        staggerIndex * STAGGER_CARD_MS +
        CARD_ENTRANCE_MS +
        STRING_DELAY_AFTER_CARD_MS
      )
    },
    [cardBaseDelay, cardStaggerIndex],
  )

  const rw = useCallback(
    () => frameRef.current?.clientWidth ?? 1,
    [],
  )
  const rh = useCallback(
    () => frameRef.current?.clientHeight ?? 1,
    [],
  )

  const getCamBounds = useCallback((displayScale?: number) => {
    const scale = displayScale ?? zoomRef.current.tScale
    const w = rw()
    const h = rh()
    return {
      scale,
      maxX: Math.max(0, BOARD_W - w / scale),
      maxY: Math.max(0, BOARD_H - h / scale),
    }
  }, [rw, rh])

  const updateNearestMobileRegion = useCallback(() => {
    if (!isMobile || regionFocusPoints.length === 0) return

    const cam = camRef.current
    const { scale } = getCamBounds(zoomRef.current.scale)
    const viewCx = cam.x + rw() / (2 * scale)
    const viewCy = cam.y + rh() / (2 * scale)
    let nearestId = regionFocusPoints[0].id
    let nearestDist = Infinity
    for (const fp of regionFocusPoints) {
      const dx = fp.x - viewCx
      const dy = fp.y - viewCy
      const dist = dx * dx + dy * dy
      if (dist < nearestDist) {
        nearestDist = dist
        nearestId = fp.id
      }
    }
    if (nearestId !== activeRegionIdRef.current) {
      activeRegionIdRef.current = nearestId
      setActiveRegionId(nearestId)
    }
  }, [isMobile, regionFocusPoints, getCamBounds, rw, rh])

  const cameraTargetFor = useCallback(
    (focusX: number, focusY: number) => {
      const w = rw()
      const h = rh()
      const { scale, maxX, maxY } = getCamBounds()
      const navOffsetWorld = isMobile ? 0 : 52 / scale
      return {
        x: clamp(focusX - w / (2 * scale) - navOffsetWorld, 0, maxX),
        y: clamp(focusY - h / (2 * scale), 0, maxY),
      }
    },
    [getCamBounds, isMobile, rw, rh],
  )

  const flyCameraTo = useCallback((toX: number, toY: number, instant = false) => {
    const cam = camRef.current
    cam.tX = toX
    cam.tY = toY

    if (instant) {
      flyRef.current = null
      rubberBandSnapRef.current = null
      cam.x = toX
      cam.y = toY
      return
    }

    rubberBandSnapRef.current = null
    flyRef.current = {
      fromX: cam.x,
      fromY: cam.y,
      toX,
      toY,
      startMs: performance.now(),
    }
  }, [])

  const flyToRegion = useCallback(
    (region: BoardRegionLayout, instant = false) => {
      const focus = getRegionFocusPoint(region)
      const { x: toX, y: toY } = cameraTargetFor(focus.x, focus.y)
      setActiveRegionId(region.id)
      preloadRegionGallery(region, preloadOpts)
      flyCameraTo(toX, toY, instant)
    },
    [cameraTargetFor, flyCameraTo, preloadOpts],
  )

  const flyToBoardCenter = useCallback(
    (instant = false) => {
      const { scale, maxX, maxY } = getCamBounds()
      const toX = clamp(BOARD_W / 2 - rw() / (2 * scale), 0, maxX)
      const toY = clamp(BOARD_H / 2 - rh() / (2 * scale), 0, maxY)
      flyCameraTo(toX, toY, instant)
    },
    [flyCameraTo, getCamBounds, rw, rh],
  )

  useEffect(() => {
    if (!active) {
      setMounted(false)
      setLegendMounted(false)
      setFloating(false)
      entranceCompleteRef.current = false
      return
    }

    if (entranceCompleteRef.current) {
      setMounted(true)
      setFloating(true)
      setLegendMounted(true)
      return
    }

    const skipFullEntrance =
      shouldSkipFullPhotoEntrance() || Boolean(readPortfolioSession()?.photography)

    if (skipFullEntrance) {
      setMounted(true)
      setFloating(true)
      entranceCompleteRef.current = true
    }

    let legendTimer: number | undefined
    if (prefersReducedMotion()) {
      setLegendMounted(true)
    } else {
      legendTimer = window.setTimeout(() => setLegendMounted(true), 50)
    }

    if (skipFullEntrance) {
      return () => {
        if (legendTimer !== undefined) window.clearTimeout(legendTimer)
      }
    }

    const mountTimer = window.setTimeout(() => setMounted(true), 50)
    const entranceTimer = window.setTimeout(() => {
      entranceCompleteRef.current = true
    }, lastCardDelay + CARD_ENTRANCE_MS)
    const floatTimer = window.setTimeout(() => {
      setFloating(true)
      markPhotoEntranceSeen()
    }, lastCardDelay + CARD_ENTRANCE_MS + 260)

    return () => {
      if (legendTimer !== undefined) window.clearTimeout(legendTimer)
      window.clearTimeout(mountTimer)
      window.clearTimeout(entranceTimer)
      window.clearTimeout(floatTimer)
    }
  }, [active, lastCardDelay])

  useEffect(() => {
    if (!active) {
      didInitialFlyRef.current = false
      initialViewStateAppliedRef.current = false
      onReadyChange?.(false)
      return
    }
    const canvas = bgCanvasRef.current
    if (canvas) {
      canvas.width = BOARD_W
      canvas.height = BOARD_H
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawPinboardBoard(ctx, boardBase, {
          highContrast: isMobile,
        })
      }
    }
    onReadyChange?.(true)
  }, [active, theme, boardBase, isMobile, onReadyChange])

  useLayoutEffect(() => {
    if (!active) return

    let settleTimer: number | undefined

    const applyInitialView = () => {
      if (didInitialFlyRef.current) return false

      const frame = frameRef.current
      if (!frame || frame.clientWidth < 2 || frame.clientHeight < 2) return false

      const photoSession = readPortfolioSession()?.photography
      if (!initialViewStateAppliedRef.current) {
        if (photoSession?.zoom) {
          zoomRef.current.scale = photoSession.zoom.scale
          zoomRef.current.tScale = photoSession.zoom.tScale
        }

        if (!isMobile && photoSession?.slideshow) {
          const { country, slideIndex: savedIndex, slideDirection: savedDir } =
            photoSession.slideshow
          for (const region of regions) {
            const layout = region.countries.find((c) => c.card.country === country)
            if (layout) {
              setSlideshow(toSlideshowTarget(layout, region.name))
              setSlideIndex(savedIndex)
              setSlideDirection(savedDir)
              flyToRegion(region, true)
              initialViewStateAppliedRef.current = true
              break
            }
          }
        }

        initialViewStateAppliedRef.current = true
      }

      let targetRegion: BoardRegionLayout | null = null
      if (!isMobile && photoSession?.slideshow) {
        const country = photoSession.slideshow.country
        targetRegion =
          regions.find((region) =>
            region.countries.some((layout) => layout.card.country === country),
          ) ?? null
      } else if (photoSession?.activeRegionId) {
        targetRegion =
          regions.find((region) => region.id === photoSession.activeRegionId) ?? null
      }

      if (!targetRegion) {
        targetRegion = resolvePhotographyOpenRegion(regions, {
          activeRegionId: photoSession?.activeRegionId,
        })
      }

      if (targetRegion) {
        flyToRegion(targetRegion, true)
      }

      if (settleTimer !== undefined) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        didInitialFlyRef.current = true
        settleTimer = undefined
      }, 320)

      return true
    }

    applyInitialView()

    const frame = frameRef.current
    if (!frame) return

    const observer = new ResizeObserver(() => {
      applyInitialView()
    })
    observer.observe(frame)

    return () => {
      observer.disconnect()
      if (settleTimer !== undefined) window.clearTimeout(settleTimer)
    }
  }, [active, flyToRegion, regions, isMobile])

  useEffect(() => {
    if (!active) return
    let raf = 0
    let lastLightMs = 0
    const LIGHT_INTERVAL_MS = 1000 / 30
    const tick = (now: number) => {
      if (isMobile && slideshowRef.current) {
        raf = requestAnimationFrame(tick)
        return
      }

      if (interactingRef.current) {
        raf = requestAnimationFrame(tick)
        return
      }

      const lightCanvas = lightCanvasRef.current
      const frame = frameRef.current
      if (
        lightCanvas &&
        frame &&
        now - lastLightMs >= LIGHT_INTERVAL_MS
      ) {
        lastLightMs = now
        const w = frame.offsetWidth
        const h = frame.offsetHeight
        if (lightCanvas.width !== w || lightCanvas.height !== h) {
          lightCanvas.width = w
          lightCanvas.height = h
        }
        const ctx = lightCanvas.getContext('2d')
        if (ctx) {
          drawPinboardLightOverlay(
            ctx,
            lightCanvas.width,
            lightCanvas.height,
            theme,
            th,
            now / 1000,
            getPhotographyLightBoost(themeTransitionRef.current, now / 1000),
          )
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, theme, th, isMobile])

  useEffect(() => {
    if (!active) return
    const isInteracting = () =>
      dragRef.current.active || pinchRef.current.active
    const tick = () => {
      const cam = camRef.current
      const fly = flyRef.current
      const rubberBand = rubberBandSnapRef.current
      if (fly) {
        const t = Math.min(1, (performance.now() - fly.startMs) / FLY_DURATION_MS)
        const ease = easeOutQuint(t)
        cam.x = fly.fromX + (fly.toX - fly.fromX) * ease
        cam.y = fly.fromY + (fly.toY - fly.fromY) * ease
        if (t >= 1) {
          cam.x = fly.toX
          cam.y = fly.toY
          flyRef.current = null
        }
      } else if (rubberBand) {
        const t = Math.min(1, (performance.now() - rubberBand.startMs) / RUBBER_BAND_SNAP_MS)
        const ease = easeOutQuad(t)
        cam.tX = rubberBand.fromX + (rubberBand.toX - rubberBand.fromX) * ease
        cam.tY = rubberBand.fromY + (rubberBand.toY - rubberBand.fromY) * ease
        cam.x = cam.tX
        cam.y = cam.tY
        if (t >= 1) {
          cam.tX = rubberBand.toX
          cam.tY = rubberBand.toY
          cam.x = cam.tX
          cam.y = cam.tY
          rubberBandSnapRef.current = null
        }
      } else {
        const inertiaWasActive = inertiaRef.current.active
        if (inertiaWasActive && !dragRef.current.active) {
          const { maxX, maxY } = getCamBounds()
          cam.tX = clamp(cam.tX + inertiaRef.current.vx, 0, maxX)
          cam.tY = clamp(cam.tY + inertiaRef.current.vy, 0, maxY)
          inertiaRef.current.vx *= INERTIA_FRICTION
          inertiaRef.current.vy *= INERTIA_FRICTION
          if (
            Math.abs(inertiaRef.current.vx) + Math.abs(inertiaRef.current.vy) <
            INERTIA_MIN
          ) {
            inertiaRef.current.active = false
          }
        }
        if (inertiaWasActive && !inertiaRef.current.active) {
          updateNearestMobileRegion()
        }
        if (isInteracting()) {
          cam.x = cam.tX
          cam.y = cam.tY
        } else {
          cam.x += (cam.tX - cam.x) * CAM_LERP
          cam.y += (cam.tY - cam.y) * CAM_LERP
        }
      }
      const zoom = zoomRef.current
      if (isInteracting()) {
        zoom.scale = zoom.tScale
      } else {
        zoom.scale += (zoom.tScale - zoom.scale) * SCALE_LERP
      }
      const world = worldRef.current
      const { scale } = getCamBounds(zoom.scale)
      if (world) {
        world.style.transformOrigin = '0 0'
        world.style.transform = `scale(${scale}) translate3d(${-cam.x}px,${-cam.y}px,0)`
      }

      const cardShadow = th.cardShadow
      const applyTilt =
        !isMobile &&
        entranceCompleteRef.current &&
        !prefersReducedMotion() &&
        (interactingRef.current || dragRef.current.active)
      for (const card of cardRefs.current) {
        const c = card.layout
        const { el } = card
        if (!applyTilt) {
          card.tiltX = 0
          card.tiltY = 0
          card.lift = 0
          el.style.transform = `rotate(${c.rot}deg)`
          el.style.boxShadow = isMobile
            ? `0 4px 14px ${cardShadow}`
            : `3px 3px 0 ${cardShadow}`
          continue
        }
        const dx = mouseRef.current.x - (c.x + c.w / 2)
        const dy = mouseRef.current.y - (c.y + 40)
        const dist = Math.sqrt(dx * dx + dy * dy)
        const inf = Math.max(0, 1 - dist / TILT_RADIUS)
        const targetTx = (dy / Math.max(dist, 1)) * inf * TILT_MAX
        const targetTy = (-dx / Math.max(dist, 1)) * inf * TILT_MAX
        const targetLift = inf * LIFT_MAX
        card.tiltX += (targetTx - card.tiltX) * TILT_LERP
        card.tiltY += (targetTy - card.tiltY) * TILT_LERP
        card.lift += (targetLift - card.lift) * TILT_LERP
        el.style.transform = `rotate(${c.rot}deg) perspective(500px) rotateX(${card.tiltX.toFixed(2)}deg) rotateY(${card.tiltY.toFixed(2)}deg) translateZ(${card.lift.toFixed(2)}px)`
        const shadowOff = 3 + card.lift * 0.45
        el.style.boxShadow = `${shadowOff.toFixed(1)}px ${shadowOff.toFixed(1)}px 0 ${cardShadow}`
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, th.cardShadow, isMobile, getCamBounds, rw, rh, updateNearestMobileRegion])

  const updateMouse = useCallback(
    (clientX: number, clientY: number) => {
      const frame = frameRef.current
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      const scale = zoomRef.current.scale
      mouseRef.current = {
        x: (clientX - rect.left) / scale + camRef.current.x,
        y: (clientY - rect.top) / scale + camRef.current.y,
      }
    },
    [],
  )

  const zoomAtScreenPoint = useCallback(
    (newScale: number, clientX: number, clientY: number) => {
      const frame = frameRef.current
      const cam = camRef.current
      const zoom = zoomRef.current
      if (!frame) return

      const clampedScale = clamp(newScale, MIN_ZOOM_SCALE, maxZoomScale(isMobile))
      const oldScale = zoom.tScale
      if (clampedScale === oldScale) return

      const rect = frame.getBoundingClientRect()
      const sx = clientX - rect.left
      const sy = clientY - rect.top
      const { maxX, maxY } = getCamBounds(clampedScale)

      cam.tX = clamp(cam.tX + sx * (1 / oldScale - 1 / clampedScale), 0, maxX)
      cam.tY = clamp(cam.tY + sy * (1 / oldScale - 1 / clampedScale), 0, maxY)
      zoom.tScale = clampedScale
    },
    [getCamBounds, isMobile],
  )

  const beginPinch = useCallback(() => {
    const frame = frameRef.current
    if (!frame) return
    const pts = [...pointersRef.current.values()]
    if (pts.length < 2) return

    const [a, b] = [pts[0], pts[1]]
    const mid = pointerMidpoint(a, b)
    const rect = frame.getBoundingClientRect()
    const cam = camRef.current
    const zoom = zoomRef.current

    pinchRef.current = {
      active: true,
      startDist: pointerDistance(a, b),
      startScale: zoom.tScale,
      startCamX: cam.tX,
      startCamY: cam.tY,
      focalSx: mid.x - rect.left,
      focalSy: mid.y - rect.top,
    }
    flyRef.current = null
    inertiaRef.current.active = false
    dragRef.current.active = false
  }, [])

  const updatePinch = useCallback(() => {
    const pinch = pinchRef.current
    if (!pinch.active) return
    const pts = [...pointersRef.current.values()]
    if (pts.length < 2) return

    const [a, b] = [pts[0], pts[1]]
    const dist = pointerDistance(a, b)
    if (pinch.startDist < 1) return

    const newScale = clamp(
      pinch.startScale * (dist / pinch.startDist),
      MIN_ZOOM_SCALE,
      maxZoomScale(isMobile),
    )
    const { maxX, maxY } = getCamBounds(newScale)
    const wx = pinch.startCamX + pinch.focalSx / pinch.startScale
    const wy = pinch.startCamY + pinch.focalSy / pinch.startScale

    camRef.current.tX = clamp(wx - pinch.focalSx / newScale, 0, maxX)
    camRef.current.tY = clamp(wy - pinch.focalSy / newScale, 0, maxY)
    zoomRef.current.tScale = newScale
    if (Math.abs(newScale - pinch.startScale) > 0.01) {
      dragRef.current.didDrag = true
    }
  }, [getCamBounds, isMobile])

  const startRubberBandSnap = useCallback(() => {
    const cam = camRef.current
    const { maxX, maxY } = getCamBounds()
    if (!camOutOfBounds(cam.tX, cam.tY, maxX, maxY)) return

    flyRef.current = null
    inertiaRef.current.active = false
    rubberBandSnapRef.current = {
      fromX: cam.tX,
      fromY: cam.tY,
      toX: clamp(cam.tX, 0, maxX),
      toY: clamp(cam.tY, 0, maxY),
      startMs: performance.now(),
    }
  }, [getCamBounds])

  useEffect(() => {
    slideshowRef.current = slideshow
    if (!slideshow) return
    dragRef.current.active = false
    dragRef.current.didDrag = false
    interactingRef.current = false
    inertiaRef.current.active = false
    rubberBandSnapRef.current = null
    pinchRef.current.active = false
    pointersRef.current.clear()
    ssSwipeRef.current.active = false
  }, [slideshow])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (slideshowRef.current) return
      if (e.button !== 0) return
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      frameRef.current?.setPointerCapture(e.pointerId)

      if (pointersRef.current.size === 1) {
        interactingRef.current = true
        flyRef.current = null
        rubberBandSnapRef.current = null
        inertiaRef.current.active = false
        velocitySampleBufferRef.current = []
        lastPointerRef.current = { x: e.clientX, y: e.clientY, t: performance.now() }
        dragRef.current = {
          active: true,
          didDrag: false,
          sx: e.clientX,
          sy: e.clientY,
          cx: camRef.current.tX,
          cy: camRef.current.tY,
        }
      } else if (pointersRef.current.size === 2) {
        beginPinch()
      }
    },
    [beginPinch],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (slideshowRef.current) return
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      updateMouse(e.clientX, e.clientY)

      if (pointersRef.current.size >= 2 && pinchRef.current.active) {
        updatePinch()
        return
      }

      const d = dragRef.current
      if (!d.active) return
      const dx = e.clientX - d.sx
      const dy = e.clientY - d.sy
      if (Math.abs(dx) + Math.abs(dy) > 4) d.didDrag = true
      const now = performance.now()
      const dt = now - lastPointerRef.current.t
      const moveDx = e.clientX - lastPointerRef.current.x
      const moveDy = e.clientY - lastPointerRef.current.y
      if (dt > 0 && dt < VELOCITY_SAMPLE_MAX_DT) {
        const buf = velocitySampleBufferRef.current
        buf.push({ dx: moveDx, dy: moveDy, dt })
        if (buf.length > VELOCITY_SAMPLE_MAX) buf.shift()
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY, t: now }
      const { scale, maxX, maxY } = getCamBounds()
      camRef.current.tX = applyPanRubberBand(d.cx - dx / scale, maxX)
      camRef.current.tY = applyPanRubberBand(d.cy - dy / scale, maxY)
    },
    [updateMouse, getCamBounds, updatePinch],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (slideshowRef.current) {
        pointersRef.current.delete(e.pointerId)
        return
      }
      pointersRef.current.delete(e.pointerId)
      try {
        frameRef.current?.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }

      const wasPinching = pinchRef.current.active
      if (pointersRef.current.size < 2) {
        pinchRef.current.active = false
      }
      if (wasPinching && !pinchRef.current.active) {
        velocitySampleBufferRef.current = []
      }

      if (pointersRef.current.size === 0) {
        dragRef.current.active = false
        interactingRef.current = false
        const cam = camRef.current
        const { scale, maxX, maxY } = getCamBounds()
        const { vx, vy } = weightedVelocityFromSamples(
          velocitySampleBufferRef.current,
        )
        const speed = Math.abs(vx) + Math.abs(vy)
        const willStartInertia = isMobile && speed > 0.12
        const outOfBounds = camOutOfBounds(cam.tX, cam.tY, maxX, maxY)

        let startedInertia = false
        if (willStartInertia) {
          const worldVx = (-vx * 14) / scale
          const worldVy = (-vy * 14) / scale
          if (
            !outOfBounds ||
            inertiaMovesTowardBounds(
              cam.tX,
              cam.tY,
              worldVx,
              worldVy,
              maxX,
              maxY,
            )
          ) {
            inertiaRef.current = {
              active: true,
              vx: worldVx,
              vy: worldVy,
            }
            startedInertia = true
          }
        }

        if (outOfBounds && !startedInertia) {
          startRubberBandSnap()
        }
        updateNearestMobileRegion()
        velocitySampleBufferRef.current = []
      } else if (pointersRef.current.size === 1) {
        const remaining = [...pointersRef.current.entries()][0]
        if (remaining) {
          const [, pt] = remaining
          velocitySampleBufferRef.current = []
          lastPointerRef.current = { x: pt.x, y: pt.y, t: performance.now() }
          dragRef.current = {
            active: true,
            didDrag: false,
            sx: pt.x,
            sy: pt.y,
            cx: camRef.current.tX,
            cy: camRef.current.tY,
          }
        }
      }
    },
    [isMobile, getCamBounds, startRubberBandSnap, updateNearestMobileRegion],
  )

  const focusMobileRegion = useCallback(
    (id: BoardRegionId | null) => {
      setActiveRegionId(id)
      if (id === null) {
        flyToBoardCenter(false)
        return
      }
      const region = regions.find((r) => r.id === id)
      if (region) flyToRegion(region, false)
    },
    [regions, flyToRegion, flyToBoardCenter],
  )

  const onPointerEnter = useCallback(() => {
    interactingRef.current = true
  }, [])

  const onPointerLeave = useCallback(() => {
    interactingRef.current = false
    dragRef.current.active = false
  }, [])

  const openSlideshow = useCallback(
    (layout: BoardCountryLayout, region: BoardRegionLayout) => {
      preloadCountryGallery(layout.card.photos, preloadOpts)
      setSlideshow(toSlideshowTarget(layout, region.name))
      setSlideIndex(0)
      setSlideDirection(1)
    },
    [preloadOpts],
  )

  const onCardPointerDown = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation()
    dragRef.current.active = false
    dragRef.current.didDrag = false
  }, [])

  const onCardPointerDownCapture = useCallback(() => {
    dragRef.current.didDrag = false
  }, [])

  const onSlideshowControlPointerDown = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation()
    dragRef.current.active = false
    dragRef.current.didDrag = false
    inertiaRef.current.active = false
  }, [])

  const stopSlideshowPointer = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation()
  }, [])

  const closeSlideshow = useCallback(() => {
    setSlideshow(null)
    setSlideIndex(0)
    setSlideDirection(1)
    if (isMobile) clearImagePreloadCache()
  }, [isMobile])

  const ssNav = useCallback(
    (dir: number) => {
      if (!slideshow) return
      setSlideDirection(dir > 0 ? 1 : -1)
      setSlideIndex((i) =>
        Math.max(0, Math.min(slideshow.photos.length - 1, i + dir)),
      )
    },
    [slideshow],
  )

  const onSlideshowSwipePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMobile || e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return

      e.stopPropagation()
      ssSwipeRef.current = {
        active: true,
        pointerId: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [isMobile],
  )

  const onSlideshowSwipePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!ssSwipeRef.current.active || e.pointerId !== ssSwipeRef.current.pointerId) return
    e.stopPropagation()
  }, [])

  const onSlideshowSwipePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!ssSwipeRef.current.active || e.pointerId !== ssSwipeRef.current.pointerId) return

      e.stopPropagation()
      const { sx, sy, pointerId } = ssSwipeRef.current
      ssSwipeRef.current.active = false

      try {
        e.currentTarget.releasePointerCapture(pointerId)
      } catch {
        /* already released */
      }

      if (!slideshow) return

      const dx = e.clientX - sx
      const dy = e.clientY - sy

      if (dy > SS_SWIPE_DISMISS_PX && dy > Math.abs(dx) * SS_SWIPE_AXIS_RATIO) {
        closeSlideshow()
        return
      }

      if (
        Math.abs(dx) > SS_SWIPE_NAV_PX &&
        Math.abs(dx) > Math.abs(dy) * SS_SWIPE_AXIS_RATIO
      ) {
        if (dx < 0) ssNav(1)
        else ssNav(-1)
      }
    },
    [slideshow, closeSlideshow, ssNav],
  )

  useEffect(() => {
    if (!slideshow) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSlideshow()
        return
      }
      if (e.key === 'ArrowLeft') ssNav(-1)
      if (e.key === 'ArrowRight') ssNav(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slideshow, closeSlideshow, ssNav])

  // Warm nearby slides whenever the viewer moves through a gallery.
  useEffect(() => {
    if (!slideshow) return
    const back = isMobile ? 1 : 2
    const ahead = isMobile ? 2 : 8
    const sources: (string | null)[] = []
    for (let i = slideIndex - back; i <= slideIndex + ahead; i++) {
      if (i < 0 || i >= slideshow.photos.length) continue
      sources.push(slideshow.photos[i]?.src ?? null)
    }
    preloadImages(sources)
    preloadSlideshowRemainder(slideshow.photos, preloadOpts)
  }, [slideshow, slideIndex, isMobile, preloadOpts])

  const registerCard = useCallback(
    (
      countryKey: string,
      layout: BoardCountryLayout,
      region: BoardRegionLayout,
      el: HTMLButtonElement | null,
    ) => {
      cardRefs.current = cardRefs.current.filter((c) => c.layout.card.country !== countryKey)
      if (el) cardRefs.current.push({ layout, region, el, tiltX: 0, tiltY: 0, lift: 0 })
    },
    [],
  )

  useEffect(() => {
    if (!active) return
    const onResize = debounce(() => {
      const cam = camRef.current
      const { maxX, maxY } = getCamBounds()
      cam.tX = clamp(cam.tX, 0, maxX)
      cam.tY = clamp(cam.tY, 0, maxY)
    }, 120)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active, getCamBounds])

  useEffect(() => {
    const frame = frameRef.current
    if (!active || !frame) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      flyRef.current = null
      inertiaRef.current.active = false
      const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_SENSITIVITY)
      zoomAtScreenPoint(zoomRef.current.tScale * factor, e.clientX, e.clientY)
    }

    frame.addEventListener('wheel', onWheel, { passive: false })
    return () => frame.removeEventListener('wheel', onWheel)
  }, [active, zoomAtScreenPoint])

  const currentPhoto = slideshow?.photos[slideIndex]
  const slideCaption = currentPhoto
    ? `${currentPhoto.city} · ${currentPhoto.year}`
    : ''

  const activeRegion = activeRegionId
    ? regions.find((r) => r.id === activeRegionId)
    : null

  if (!active) return null

  return (
    <div
      className={`photography-pinboard-host ${styles.root}`}
      aria-label="Travel photography pinboard"
    >
      <div
        ref={frameRef}
        className={`${styles.frame} ${styles.frameEntrance}${isMobile ? ` ${styles.frameMobile}` : ''}`}
        style={{
          backgroundColor: boardBase,
          opacity: mounted ? 1 : 0,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div
          ref={worldRef}
          className={`${styles.world} ${styles.boardEntrance}`}
          style={{
            width: BOARD_W,
            height: BOARD_H,
            opacity: mounted ? 1 : 0,
            transitionDelay: '0ms',
          }}
        >
        <canvas
          ref={bgCanvasRef}
          className={styles.boardCanvas}
          width={BOARD_W}
          height={BOARD_H}
          aria-hidden
        />

        {sortedRegions.map((r) => {
          if (isMobile) return null
          const regionIndex = regionStaggerIndex.get(r.id) ?? 0
          const regionDelay = regionLabelBaseDelay + regionIndex * STAGGER_REGION_MS

          return (
            <div
              key={r.id}
            className={`${styles.clusterLabelWrap} ${styles.clusterLabelEntrance}`}
            style={{
              left: r.cx,
              top: r.cy - 20,
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? 'translate3d(-50%, 0, 0) scale(1)'
                : 'translate3d(-50%, 0.65rem, 0) scale(0.9)',
              transitionDelay: `${regionDelay}ms`,
            }}
          >
            <button
              type="button"
              className={styles.clusterLabel}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                flyToRegion(r)
              }}
              aria-label={`Focus ${r.name}`}
            >
              <div
                className={styles.clInner}
                style={{
                  background: th.clBg,
                  border: `1px solid ${th.clBorder}`,
                }}
              >
                <div className={styles.clDot} style={{ background: r.pin }} />
                <span className={styles.clName} style={{ color: th.clName }}>
                  {r.name}
                </span>
                <span className={styles.clCount} style={{ color: th.clCount }}>
                  {r.countries.length}/{r.total}
                </span>
              </div>
            </button>
            </div>
          )
        })}

        {regions.flatMap((r, ri) =>
          r.countries.map((c, ci) => {
            const imgH = Math.round(c.w * 0.75)
            const sub = `${c.card.photoCount} photo${c.card.photoCount === 1 ? '' : 's'}`
            const staggerIndex = cardStaggerIndex.get(c.card.country) ?? 0
            const cardDelay = cardBaseDelay + staggerIndex * STAGGER_CARD_MS
            const floatDuration = `${3 + (staggerIndex % 5) * 0.4}s`
            const floatDelay = `${(staggerIndex * 0.37) % 2}s`

            return (
              <div
                key={c.card.country}
                className={styles.cardShell}
                style={{
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  zIndex: c.z,
                }}
              >
                <div
                  className={`${styles.cardMotion} ${styles.cardEntrance}${floating ? ` ${styles.cardFloatActive}` : ''}${isMobile ? ` ${styles.cardMotionMobile}` : ''}`}
                  style={{
                    ['--float-duration' as string]: floatDuration,
                    ['--float-delay' as string]: floatDelay,
                    opacity: mounted ? 1 : 0,
                    ...(floating
                      ? {}
                      : {
                          transform: mounted
                            ? 'translate3d(0, 0, 0) scale(1)'
                            : 'translate3d(0, -1.35rem, 0) scale(0.91)',
                        }),
                    transitionDelay: `${cardDelay}ms`,
                  }}
                >
                <button
                  type="button"
                  ref={(el) => registerCard(c.card.country, c, r, el)}
                  className={`${styles.card}${isMobile ? ` ${styles.cardMobile}` : ''}`}
                  style={{
                    background: th.cardBg,
                    boxShadow: isMobile
                      ? `0 4px 14px ${th.cardShadow}`
                      : `3px 3px 0 ${th.cardShadow}`,
                    transform: `rotate(${c.rot}deg)`,
                  }}
                  onPointerDownCapture={onCardPointerDownCapture}
                  onPointerDown={(e) => {
                    onCardPointerDown(e)
                    preloadCountryGallery(c.card.photos, preloadOpts)
                  }}
                  onPointerEnter={() => {
                    const firstSrc =
                      c.card.previewPhoto?.src ?? c.card.photos.find((photo) => photo.src)?.src
                    if (firstSrc) void preloadImage(firstSrc)
                  }}
                  onPointerUp={(e) => e.stopPropagation()}
                  onPointerCancel={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!dragRef.current.didDrag) openSlideshow(c, r)
                  }}
                  aria-label={`View photos from ${c.card.displayName}`}
                >
                  <div
                    className={`${styles.pin}${isMobile ? ` ${styles.pinMobile}` : ''}`}
                    style={{
                      background: isMobile ? '#c9a227' : r.pin,
                      transform: 'translateX(-50%) scale(1)',
                    }}
                  />
                  {c.card.previewPhoto?.src ? (
                    <img
                      src={c.card.previewPhoto.src}
                      alt=""
                      className={styles.cardImg}
                      width={c.w}
                      height={imgH}
                      draggable={false}
                    />
                  ) : (
                    <svg
                      className={styles.cardImgSvg}
                      viewBox={`0 0 ${c.w} ${imgH}`}
                      width={c.w}
                      height={imgH}
                      aria-hidden
                      dangerouslySetInnerHTML={{
                        __html: makePhotoSvg(
                          c.w,
                          imgH,
                          c.c1,
                          c.c2,
                          ri * 10 + ci,
                        ),
                      }}
                    />
                  )}
                  <span
                    className={`${styles.cardName}${isMobile ? ` ${styles.cardNameMobile}` : ''}`}
                    style={{ color: th.cardName }}
                  >
                    {c.card.displayName}
                  </span>
                  <span className={styles.cardSub} style={{ color: th.cardSub }}>
                    {sub}
                  </span>
                </button>
                </div>
              </div>
            )
          }),
        )}

        {!isMobile ? (
        <svg
          className={styles.stringSvg}
          width={BOARD_W}
          height={BOARD_H}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          aria-hidden
        >
          {regions.map((r) => {
            const hubDelay =
              r.countries.length > 0
                ? Math.min(...r.countries.map((c) => stringLineDelay(c.card.country)))
                : regionLabelBaseDelay

            return (
              <g key={r.id}>
                {r.countries.map((c) => {
                  const x1 = r.cx
                  const y1 = r.cy - 12
                  const x2 = c.x + c.w / 2
                  const y2 = c.y + 2
                  const lineDelay = stringLineDelay(c.card.country)

                  return (
                    <line
                      key={c.card.country}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={th.stringSt}
                      strokeWidth={1}
                      strokeDasharray="3 6"
                      className={styles.stringLine}
                      style={{
                        opacity: mounted ? 1 : 0,
                        transitionDelay: `${lineDelay}ms`,
                      }}
                    />
                  )
                })}
                <circle
                  cx={r.cx}
                  cy={r.cy - 12}
                  r={3}
                  fill={r.pin}
                  className={styles.stringHub}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transitionDelay: `${hubDelay}ms`,
                  }}
                />
              </g>
            )
          })}
        </svg>
        ) : null}
        </div>

        <canvas
          ref={lightCanvasRef}
          className={styles.lightOverlay}
          aria-hidden
        />

        {showComingSoon ? (
          <div
            className={`photography-coming-soon ${styles.comingSoonEntrance}`}
            role="status"
            aria-live="polite"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? 'translate(-50%, -50%) rotate(-1.25deg)'
                : 'translate(-50%, calc(-50% + 0.85rem)) rotate(-1.25deg) scale(0.96)',
              transitionDelay: `${lastCardDelay + 240}ms`,
            }}
          >
            <p className="photography-coming-soon-label">Gallery</p>
            <p className="photography-coming-soon-title">Photos coming soon</p>
            <p className="photography-coming-soon-note">
              Places mapped · images on the way
            </p>
          </div>
        ) : null}

        {isMobile ? (
          <>
            <div className={mobileStyles.regionPill} aria-live="polite">
              <span
                className={mobileStyles.regionPillDot}
                style={{ background: activeRegion?.pin ?? '#b8892a' }}
              />
              {activeRegion ? activeRegion.name : 'All'}
              <span className={mobileStyles.regionPillFrac}>
                {activeRegion
                  ? `${activeRegion.countries.length}/${activeRegion.total}`
                  : `${regions.reduce((s, r) => s + r.countries.length, 0)}/${regions.reduce((s, r) => s + r.total, 0)}`}
              </span>
            </div>

            <PhotographyMobileRegionPills
              theme={theme}
              regions={regions}
              activeRegionId={activeRegionId}
              onSelectRegion={focusMobileRegion}
            />
          </>
        ) : (
          <>
        <div
          className={`${styles.hud} ${styles.hudEntrance}`}
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted
              ? 'translate3d(-50%, 0, 0)'
              : 'translate3d(-50%, 0.85rem, 0)',
            transitionDelay: `${lastCardDelay + 180}ms`,
          }}
        >
          <span>Drag to explore · click a card</span>
        </div>

        <nav
        className={`${styles.regionNav} ${styles.regionNavEntrance}`}
        aria-label="Regions"
        style={{
          opacity: legendMounted ? 1 : 0,
          transform: legendMounted ? 'translate3d(0, 0, 0)' : 'translate3d(1.25rem, 0, 0)',
          transitionDelay: '220ms',
          backgroundColor: th.navBg,
          borderColor: th.navBorder,
        }}
      >
        <div
          className={styles.rnHeader}
          style={{ borderBottomColor: th.navBorder }}
        >
          <span style={{ color: th.navHeader }}>Regions</span>
        </div>
        {regions.map((r) => {
          const visited = r.countries.length
          const barPct = regionVisitedBarPercent(visited, r.total)
          return (
            <button
              key={r.id}
              type="button"
              className={styles.rnItem}
              style={{
                borderBottomColor: th.navBorder,
                background:
                  activeRegionId === r.id ? th.navHover : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activeRegionId !== r.id) {
                  e.currentTarget.style.background = th.navHover
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  activeRegionId === r.id ? th.navHover : 'transparent'
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                flyToRegion(r)
              }}
            >
              <span className={styles.rnPip} style={{ background: r.pin }} />
              <span className={styles.rnName} style={{ color: th.navName }}>
                {r.name}
              </span>
              <span className={styles.rnProgress}>
                <span className={styles.rnFrac} style={{ color: th.navFrac }}>
                  {visited}/{r.total}
                </span>
                <span
                  className={styles.rnBarWrap}
                  style={{ background: th.navBarBg }}
                >
                  <span
                    className={styles.rnBarFill}
                    style={{
                      width: `${barPct}%`,
                      minWidth: visited > 0 ? 4 : 0,
                      background: r.pin,
                    }}
                  />
                </span>
              </span>
            </button>
          )
        })}
        </nav>
          </>
        )}

        <div
          className={`${styles.overlay}${slideshow ? ` ${styles.overlayOpen}` : ''}${isMobile ? ` ${styles.overlayMobile}` : ''}`}
        role="dialog"
        aria-modal={slideshow ? true : undefined}
        aria-hidden={!slideshow}
        aria-label={
          slideshow ? `Photos from ${slideshow.displayName}` : undefined
        }
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSlideshow()
        }}
        onPointerDown={stopSlideshowPointer}
        onPointerMove={stopSlideshowPointer}
        onPointerUp={stopSlideshowPointer}
        onPointerCancel={stopSlideshowPointer}
      >
        {slideshow ? (
          <div
            className={`${styles.slideshow}${isMobile ? ` ${styles.slideshowMobile}` : ''}`}
            style={{
              background: th.ssBg,
              ['--ss-border' as string]: th.ssBorder,
              ['--ss-img-bg' as string]: th.ssImgBg,
              ['--ss-control-bg' as string]: th.ssControlBg,
              ['--ss-control-hover-bg' as string]: th.ssControlHoverBg,
              ['--ss-control-icon' as string]: th.ssControlIcon,
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={stopSlideshowPointer}
            onPointerMove={stopSlideshowPointer}
            onPointerUp={stopSlideshowPointer}
            onPointerCancel={stopSlideshowPointer}
          >
            <div
              ref={ssImgWrapRef}
              className={styles.ssImgWrap}
              {...(isMobile
                ? {
                    onPointerDown: onSlideshowSwipePointerDown,
                    onPointerMove: onSlideshowSwipePointerMove,
                    onPointerUp: onSlideshowSwipePointerUp,
                    onPointerCancel: onSlideshowSwipePointerUp,
                  }
                : {})}
            >
              {currentPhoto?.src ? (
                <SlideshowPhoto
                  key={slideshow.displayName}
                  src={currentPhoto.src}
                  alt={slideCaption}
                  direction={slideDirection}
                />
              ) : (
                <svg
                  className={styles.ssImg}
                  viewBox="0 0 960 720"
                  aria-hidden
                  dangerouslySetInnerHTML={{
                    __html: makePhotoSvg(960, 720, slideshow.c1, slideshow.c2, slideIndex),
                  }}
                />
              )}
              <button
                type="button"
                className={styles.ssPrev}
                aria-label="Previous photo"
                style={{
                  opacity: slideIndex > 0 ? 1 : 0.35,
                  color: th.ssControlIcon,
                  background: th.ssControlBg,
                }}
                onPointerDown={onSlideshowControlPointerDown}
                onPointerUp={stopSlideshowPointer}
                onPointerCancel={stopSlideshowPointer}
                onClick={() => ssNav(-1)}
              >
                <ChevronIcon dir="prev" />
              </button>
              <button
                type="button"
                className={styles.ssNext}
                aria-label="Next photo"
                style={{
                  opacity: slideIndex < slideshow.photos.length - 1 ? 1 : 0.35,
                  color: th.ssControlIcon,
                  background: th.ssControlBg,
                }}
                onPointerDown={onSlideshowControlPointerDown}
                onPointerUp={stopSlideshowPointer}
                onPointerCancel={stopSlideshowPointer}
                onClick={() => ssNav(1)}
              >
                <ChevronIcon dir="next" />
              </button>
              <button
                type="button"
                className={styles.ssClose}
                aria-label="Close slideshow"
                style={{
                  color: th.ssControlIcon,
                  background: th.ssControlBg,
                }}
                onPointerDown={onSlideshowControlPointerDown}
                onPointerUp={stopSlideshowPointer}
                onPointerCancel={stopSlideshowPointer}
                onClick={closeSlideshow}
              >
                <CloseIcon />
              </button>
            </div>
            {slideshow.photos.length > 1 ? (
              <div className={styles.ssDotsProgress} aria-hidden>
                <div
                  className={styles.ssDotsProgressTrack}
                  style={{ background: th.ssDotInactive }}
                >
                  <div
                    className={styles.ssDotsProgressFill}
                    style={{
                      background: th.ssDotActive,
                      width: `${((slideIndex + 1) / slideshow.photos.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
            <div className={styles.ssBody}>
              <div className={styles.ssCountry} style={{ color: th.ssName }}>
                {slideshow.displayName}
              </div>
              <span className={styles.ssRegionLabel} style={{ color: th.ssRegion }}>
                {slideshow.regionName} · {slideshow.photoCount} photos
              </span>
              <span className={styles.ssCounter} style={{ color: th.ssCounter }}>
                {slideshow.photos.length > 0
                  ? `${slideIndex + 1} / ${slideshow.photos.length}`
                  : ''}
              </span>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}
