import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTheme } from '../../../hooks/useTheme'
import type { Theme } from '../../../hooks/useTheme'
import { getPhotographyLightBoost } from '../../../hooks/themeTransition'
import {
  buildBoardRegions,
  getRegionFocusPoint,
  toSlideshowTarget,
  type BoardRegionId,
  type BoardCountryLayout,
  type BoardRegionLayout,
  type SlideshowTarget,
} from './pinboardData'
import { hasPinboardPhotoAssets } from './photographyPhotos'
import { regionVisitedBarPercent } from './regionCountryTotals'
import { debounce } from '../../../lib/debounce'
import { PINBOARD_THEMES } from './pinboardThemes'
import {
  BOARD_H,
  BOARD_W,
  clamp,
  drawPinboardBoard,
  drawPinboardLightOverlay,
  makePhotoSvg,
} from './pinboardUtils'
import styles from './PhotographyPinboard.module.css'

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

type PhotographyPinboardProps = {
  active?: boolean
  theme?: Theme
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
  onReadyChange,
}: PhotographyPinboardProps) {
  const { themeTransition } = useTheme()
  const themeTransitionRef = useRef(themeTransition)
  const regions = useMemo(() => buildBoardRegions(), [])
  const th = PINBOARD_THEMES[theme]

  useEffect(() => {
    themeTransitionRef.current = themeTransition
  }, [themeTransition])

  const frameRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const lightCanvasRef = useRef<HTMLCanvasElement>(null)
  const cardRefs = useRef<CardEl[]>([])
  const camRef = useRef({ x: 0, y: 0, tX: 0, tY: 0 })
  const mouseRef = useRef({ x: BOARD_W / 2, y: BOARD_H / 2 })
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
  const didInitialFlyRef = useRef(false)

  const [slideshow, setSlideshow] = useState<SlideshowTarget | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
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

  const cameraTargetFor = useCallback(
    (focusX: number, focusY: number) => {
      const w = rw()
      const h = rh()
      const maxX = Math.max(0, BOARD_W - w)
      const maxY = Math.max(0, BOARD_H - h)
      return {
        x: clamp(focusX - w / 2, 0, maxX),
        y: clamp(focusY - h / 2, 0, maxY),
      }
    },
    [rw, rh],
  )

  const flyToRegion = useCallback(
    (region: BoardRegionLayout, instant = false) => {
      const focus = getRegionFocusPoint(region)
      const { x: toX, y: toY } = cameraTargetFor(focus.x, focus.y)
      const cam = camRef.current
      cam.tX = toX
      cam.tY = toY
      setActiveRegionId(region.id)

      if (instant) {
        flyRef.current = null
        cam.x = toX
        cam.y = toY
        return
      }

      flyRef.current = {
        fromX: cam.x,
        fromY: cam.y,
        toX,
        toY,
        startMs: performance.now(),
      }
    },
    [cameraTargetFor],
  )

  useEffect(() => {
    if (!active) {
      setMounted(false)
      setLegendMounted(false)
      setFloating(false)
      entranceCompleteRef.current = false
      return
    }

    const skipFullEntrance = shouldSkipFullPhotoEntrance()

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
      onReadyChange?.(false)
      return
    }
    const canvas = bgCanvasRef.current
    if (canvas) {
      canvas.width = BOARD_W
      canvas.height = BOARD_H
      const ctx = canvas.getContext('2d')
      if (ctx) drawPinboardBoard(ctx, th.boardBase)
    }
    onReadyChange?.(true)
  }, [active, theme, th.boardBase, onReadyChange])

  useEffect(() => {
    if (!active || didInitialFlyRef.current) return
    didInitialFlyRef.current = true
    const first = regions[0]
    if (first) {
      flyToRegion(first, true)
    }
  }, [active, regions, flyToRegion])

  useEffect(() => {
    if (!active) return
    let raf = 0
    let lastLightMs = 0
    const LIGHT_INTERVAL_MS = 1000 / 30
    const tick = (now: number) => {
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
  }, [active, theme, th])

  useEffect(() => {
    if (!active) return
    const tick = () => {
      const cam = camRef.current
      const fly = flyRef.current
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
      } else {
        cam.x += (cam.tX - cam.x) * CAM_LERP
        cam.y += (cam.tY - cam.y) * CAM_LERP
      }
      const world = worldRef.current
      if (world) {
        world.style.transform = `translate3d(${-Math.round(cam.x)}px,${-Math.round(cam.y)}px,0)`
      }

      const cardShadow = th.cardShadow
      const applyTilt =
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
          el.style.boxShadow = `3px 3px 0 ${cardShadow}`
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
  }, [active, th.cardShadow])

  const updateMouse = useCallback(
    (clientX: number, clientY: number) => {
      const frame = frameRef.current
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      mouseRef.current = {
        x: clientX - rect.left + camRef.current.x,
        y: clientY - rect.top + camRef.current.y,
      }
    },
    [],
  )

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      interactingRef.current = true
      flyRef.current = null
      dragRef.current = {
        active: true,
        didDrag: false,
        sx: e.clientX,
        sy: e.clientY,
        cx: camRef.current.tX,
        cy: camRef.current.tY,
      }
      frameRef.current?.setPointerCapture(e.pointerId)
    },
    [],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      updateMouse(e.clientX, e.clientY)
      const d = dragRef.current
      if (!d.active) return
      const dx = e.clientX - d.sx
      const dy = e.clientY - d.sy
      if (Math.abs(dx) + Math.abs(dy) > 4) d.didDrag = true
      camRef.current.tX = clamp(d.cx - dx, 0, Math.max(0, BOARD_W - rw()))
      camRef.current.tY = clamp(d.cy - dy, 0, Math.max(0, BOARD_H - rh()))
    },
    [updateMouse, rw, rh],
  )

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false
    interactingRef.current = false
  }, [])

  const onPointerEnter = useCallback(() => {
    interactingRef.current = true
  }, [])

  const onPointerLeave = useCallback(() => {
    interactingRef.current = false
    dragRef.current.active = false
  }, [])

  const openSlideshow = useCallback(
    (layout: BoardCountryLayout, region: BoardRegionLayout) => {
      setSlideshow(toSlideshowTarget(layout, region.name))
      setSlideIndex(0)
    },
    [],
  )

  const onCardPointerDown = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation()
    dragRef.current.active = false
    dragRef.current.didDrag = false
  }, [])

  const closeSlideshow = useCallback(() => {
    setSlideshow(null)
    setSlideIndex(0)
  }, [])

  const ssNav = useCallback(
    (dir: number) => {
      if (!slideshow) return
      setSlideIndex((i) =>
        Math.max(0, Math.min(slideshow.photos.length - 1, i + dir)),
      )
    },
    [slideshow],
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
      cam.tX = clamp(cam.tX, 0, Math.max(0, BOARD_W - rw()))
      cam.tY = clamp(cam.tY, 0, Math.max(0, BOARD_H - rh()))
    }, 120)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active, rw, rh])

  const currentPhoto = slideshow?.photos[slideIndex]
  const slideCaption = currentPhoto
    ? `${currentPhoto.city} · ${currentPhoto.year}`
    : ''

  if (!active) return null

  return (
    <div
      className={`photography-pinboard-host ${styles.root}`}
      aria-label="Travel photography pinboard"
    >
      <div
        ref={frameRef}
        className={`${styles.frame} ${styles.frameEntrance}`}
        style={{
          backgroundColor: th.boardBase,
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
            const sub =
              c.card.cities.length > 0
                ? `${c.card.cities.slice(0, 2).join(' · ')} · ${c.card.photoCount} photos`
                : `${c.card.photoCount} photo${c.card.photoCount === 1 ? '' : 's'}`
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
                  className={`${styles.cardMotion} ${styles.cardEntrance}${floating ? ` ${styles.cardFloatActive}` : ''}`}
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
                  className={styles.card}
                  style={{
                    background: th.cardBg,
                    boxShadow: `3px 3px 0 ${th.cardShadow}`,
                    transform: `rotate(${c.rot}deg)`,
                  }}
                  onPointerDown={onCardPointerDown}
                  onPointerUp={(e) => e.stopPropagation()}
                  onPointerCancel={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!dragRef.current.didDrag) openSlideshow(c, r)
                  }}
                  aria-label={`View photos from ${c.card.displayName}`}
                >
                  <div
                    className={styles.pin}
                    style={{
                      background: r.pin,
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
                  <span className={styles.cardName} style={{ color: th.cardName }}>
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
            <p className="photography-coming-soon-label">gallery</p>
            <p className="photography-coming-soon-title">photos coming soon</p>
            <p className="photography-coming-soon-note">
              places mapped · images on the way
            </p>
          </div>
        ) : null}

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
          <span>drag to explore · click a card</span>
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
          <span style={{ color: th.navHeader }}>regions</span>
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

        <div
          className={`${styles.overlay}${slideshow ? ` ${styles.overlayOpen}` : ''}`}
        role="dialog"
        aria-modal={slideshow ? true : undefined}
        aria-hidden={!slideshow}
        aria-label={
          slideshow ? `Photos from ${slideshow.displayName}` : undefined
        }
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSlideshow()
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {slideshow ? (
          <div
            className={styles.slideshow}
            style={{
              background: th.ssBg,
              ['--ss-border' as string]: th.ssBorder,
              ['--ss-img-bg' as string]: th.ssImgBg,
              ['--ss-control-bg' as string]: th.ssControlBg,
              ['--ss-control-hover-bg' as string]: th.ssControlHoverBg,
              ['--ss-control-icon' as string]: th.ssControlIcon,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.ssImgWrap}>
              {currentPhoto?.src ? (
                <img
                  src={currentPhoto.src}
                  alt={slideCaption}
                  className={styles.ssImg}
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
                onClick={closeSlideshow}
              >
                <CloseIcon />
              </button>
            </div>
            {slideshow.photos.length > 1 ? (
              <div className={styles.ssDots}>
                {slideshow.photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.ssDot}
                    style={{
                      background:
                        i === slideIndex ? th.ssDotActive : th.ssDotInactive,
                    }}
                    aria-label={`Photo ${i + 1}`}
                    onClick={() => setSlideIndex(i)}
                  />
                ))}
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
              <span className={styles.ssCaption} style={{ color: th.ssCaption }}>
                {slideCaption || 'Photo coming soon'}
              </span>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}
