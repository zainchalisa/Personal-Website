import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Theme } from '../../useTheme'
import {
  buildBoardRegions,
  toSlideshowTarget,
  type BoardCountryLayout,
  type BoardRegionLayout,
  type SlideshowTarget,
} from './pinboardData'
import { PINBOARD_THEMES } from './pinboardThemes'
import {
  BOARD_H,
  BOARD_W,
  clamp,
  makeBoardTexture,
  makePhotoSvg,
} from './pinboardUtils'
import styles from './PhotographyPinboard.module.css'

const CAM_LERP = 0.09
const TILT_RADIUS = 210
const TILT_MAX = 9
const LIFT_MAX = 7

export type PhotographyPinboardProps = {
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
}

export default function PhotographyPinboard({
  active = true,
  theme = 'dark',
  onReadyChange,
}: PhotographyPinboardProps) {
  const regions = useMemo(() => buildBoardRegions(), [])
  const th = PINBOARD_THEMES[theme]

  const frameRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
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

  const [boardTexture, setBoardTexture] = useState('')
  const [slideshow, setSlideshow] = useState<SlideshowTarget | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)

  const rw = useCallback(
    () => frameRef.current?.clientWidth ?? 1,
    [],
  )
  const rh = useCallback(
    () => frameRef.current?.clientHeight ?? 1,
    [],
  )

  const flyTo = useCallback(
    (cx: number, cy: number) => {
      const w = rw()
      const h = rh()
      camRef.current.tX = clamp(cx - w / 2, 0, BOARD_W - w)
      camRef.current.tY = clamp(cy - h / 2, 0, BOARD_H - h)
    },
    [rw, rh],
  )

  useEffect(() => {
    if (!active) return
    setBoardTexture(makeBoardTexture(th))
    onReadyChange?.(true)
    const first = regions[0]
    if (first) {
      flyTo(first.cx, first.cy)
      camRef.current.x = camRef.current.tX
      camRef.current.y = camRef.current.tY
    }
    return () => onReadyChange?.(false)
  }, [active, theme, th, regions, flyTo, onReadyChange])

  useEffect(() => {
    if (!active) return
    const tick = () => {
      const cam = camRef.current
      cam.x += (cam.tX - cam.x) * CAM_LERP
      cam.y += (cam.tY - cam.y) * CAM_LERP
      const world = worldRef.current
      if (world) {
        world.style.transform = `translate(${-Math.round(cam.x)}px,${-Math.round(cam.y)}px)`
      }

      const cardShadow = th.cardShadow
      for (const { layout, el } of cardRefs.current) {
        const c = layout
        const dx = mouseRef.current.x - (c.x + c.w / 2)
        const dy = mouseRef.current.y - (c.y + 40)
        const dist = Math.sqrt(dx * dx + dy * dy)
        const inf = Math.max(0, 1 - dist / TILT_RADIUS)
        const tx = (dy / Math.max(dist, 1)) * inf * TILT_MAX
        const ty = (-dx / Math.max(dist, 1)) * inf * TILT_MAX
        const br = layout.rot
        el.style.transform = `rotate(${br}deg) perspective(500px) rotateX(${tx.toFixed(1)}deg) rotateY(${ty.toFixed(1)}deg) translateZ(${(inf * LIFT_MAX).toFixed(1)}px)`
        const shadowOff = 3 + inf * 3
        el.style.boxShadow = `${shadowOff.toFixed(0)}px ${shadowOff.toFixed(0)}px 0 ${cardShadow}`
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
      camRef.current.tX = clamp(d.cx - dx, 0, BOARD_W - rw())
      camRef.current.tY = clamp(d.cy - dy, 0, BOARD_H - rh())
    },
    [updateMouse, rw, rh],
  )

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false
  }, [])

  const openSlideshow = useCallback(
    (layout: BoardCountryLayout, region: BoardRegionLayout) => {
      if (dragRef.current.didDrag) return
      setSlideshow(toSlideshowTarget(layout, region.name))
      setSlideIndex(0)
    },
    [],
  )

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
      if (el) cardRefs.current.push({ layout, region, el })
    },
    [],
  )

  useEffect(() => {
    if (!active) return
    const onResize = () => {
      const cam = camRef.current
      cam.tX = clamp(cam.tX, 0, BOARD_W - rw())
      cam.tY = clamp(cam.tY, 0, BOARD_H - rh())
    }
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
      ref={frameRef}
      className={`photography-pinboard-host ${styles.frame}`}
      style={{ background: th.boardBg }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Travel photography pinboard"
    >
      <div
        ref={worldRef}
        className={styles.world}
        style={{ width: BOARD_W, height: BOARD_H }}
      >
        {boardTexture ? (
          <div
            className={styles.boardBg}
            style={{
              width: BOARD_W,
              height: BOARD_H,
              backgroundImage: `url(${boardTexture})`,
            }}
            aria-hidden
          />
        ) : null}

        <svg
          className={styles.stringSvg}
          width={BOARD_W}
          height={BOARD_H}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          aria-hidden
        >
          {regions.map((r) => (
            <g key={r.id}>
              {r.countries.map((c) => (
                <line
                  key={c.card.country}
                  x1={r.cx}
                  y1={r.cy - 12}
                  x2={c.x + c.w / 2}
                  y2={c.y + 2}
                  stroke={th.stringSt}
                  strokeWidth={1}
                  strokeDasharray="3 6"
                />
              ))}
              <circle cx={r.cx} cy={r.cy - 12} r={3} fill={r.pin} />
            </g>
          ))}
        </svg>

        {regions.map((r) => (
          <div
            key={r.id}
            className={styles.clusterLabel}
            style={{
              left: r.cx,
              top: r.cy - 20,
              transform: 'translateX(-50%)',
            }}
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
          </div>
        ))}

        {regions.flatMap((r, ri) =>
          r.countries.map((c, ci) => {
            const imgH = Math.round(c.w * 0.75)
            const sub =
              c.card.cities.length > 0
                ? `${c.card.cities.slice(0, 2).join(' · ')} · ${c.card.photoCount} photos`
                : `${c.card.photoCount} photo${c.card.photoCount === 1 ? '' : 's'}`

            return (
              <button
                key={c.card.country}
                type="button"
                ref={(el) => registerCard(c.card.country, c, r, el)}
                className={styles.card}
                style={{
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  background: th.cardBg,
                  boxShadow: `3px 3px 0 ${th.cardShadow}`,
                }}
                onClick={() => openSlideshow(c, r)}
                aria-label={`View photos from ${c.card.displayName}`}
              >
                <div className={styles.pin} style={{ background: r.pin }} />
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
            )
          }),
        )}
      </div>

      <div className={styles.hud} style={{ background: th.hudBg }}>
        <span style={{ color: th.hudText }}>drag to explore · click a card</span>
      </div>

      <nav
        className={styles.regionNav}
        style={{ background: th.navBg }}
        aria-label="Regions"
      >
        <div
          className={styles.rnHeader}
          style={{ borderBottomColor: th.navBorder }}
        >
          <span style={{ color: th.navHeader }}>regions</span>
        </div>
        {regions.map((r) => {
          const visited = r.countries.length
          const pct = Math.round((visited / r.total) * 100)
          return (
            <button
              key={r.id}
              type="button"
              className={styles.rnItem}
              style={{ borderBottomColor: th.navBorder }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = th.navHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => flyTo(r.cx, r.cy)}
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
                    style={{ width: `${pct}%`, background: r.pin }}
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
      >
        {slideshow ? (
          <div className={styles.slideshow} style={{ background: th.ssBg }}>
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
                  viewBox="0 0 320 240"
                  aria-hidden
                  dangerouslySetInnerHTML={{
                    __html: makePhotoSvg(320, 240, slideshow.c1, slideshow.c2, slideIndex),
                  }}
                />
              )}
              <button
                type="button"
                className={styles.ssPrev}
                aria-label="Previous photo"
                style={{ opacity: slideIndex > 0 ? 1 : 0.3 }}
                onClick={() => ssNav(-1)}
              >
                <ChevronIcon dir="prev" />
              </button>
              <button
                type="button"
                className={styles.ssNext}
                aria-label="Next photo"
                style={{
                  opacity:
                    slideIndex < slideshow.photos.length - 1 ? 1 : 0.3,
                }}
                onClick={() => ssNav(1)}
              >
                <ChevronIcon dir="next" />
              </button>
              <button
                type="button"
                className={styles.ssClose}
                aria-label="Close slideshow"
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
  )
}
