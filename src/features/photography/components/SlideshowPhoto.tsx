import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type CSSProperties,
  type TransitionEvent as ReactTransitionEvent,
} from 'react'
import {
  crossfadeIncomingScale,
  getImageMeta,
  preloadImageMeta,
  shouldCrossfade,
  type CrossfadeMode,
  type ImageOrientation,
} from '@/shared/lib/preloadImage'
import styles from './PhotographyPinboard.module.css'

const CROSSFADE_MS = 320
const SWAP_MS = 220
const SLIDE_PX = 10

/** Toggle: 'match-orientation' | 'always' | 'scale-incoming' */
const CROSSFADE_MODE: CrossfadeMode = 'always'

type SlideshowPhotoProps = {
  src: string | null
  alt: string
  direction?: 1 | -1
}

type CrossfadeState = {
  src: string
  active: boolean
  incomingScale: number
}

function motionVars(direction: 1 | -1): CSSProperties {
  const enterX = direction > 0 ? `${SLIDE_PX}px` : `-${SLIDE_PX}px`
  const exitX = direction > 0 ? `-${SLIDE_PX}px` : `${SLIDE_PX}px`
  return {
    ['--ss-enter-x' as string]: enterX,
    ['--ss-exit-x' as string]: exitX,
  }
}

export function SlideshowPhoto({ src, alt, direction = 1 }: SlideshowPhotoProps) {
  const [baseSrc, setBaseSrc] = useState<string | null>(null)
  const [baseVisible, setBaseVisible] = useState(true)
  const [baseOutgoing, setBaseOutgoing] = useState(false)
  const [baseEntering, setBaseEntering] = useState(false)
  const [baseInstant, setBaseInstant] = useState(false)
  const [overlay, setOverlay] = useState<CrossfadeState | null>(null)
  const [pendingSwapSrc, setPendingSwapSrc] = useState<string | null>(null)

  const baseSrcRef = useRef<string | null>(null)
  const baseOrientationRef = useRef<ImageOrientation | null>(null)
  const srcRef = useRef<string | null>(src)

  useEffect(() => {
    srcRef.current = src
  }, [src])

  useEffect(() => {
    baseSrcRef.current = baseSrc
  }, [baseSrc])

  useEffect(() => {
    if (!src) {
      setBaseSrc(null)
      setBaseVisible(true)
      setBaseOutgoing(false)
      setBaseEntering(false)
      setBaseInstant(false)
      setOverlay(null)
      setPendingSwapSrc(null)
      baseSrcRef.current = null
      baseOrientationRef.current = null
      return
    }

    let cancelled = false
    let raf = 0

    void preloadImageMeta(src).then((meta) => {
      if (cancelled) return

      const currentSrc = baseSrcRef.current
      if (!currentSrc) {
        setBaseSrc(meta.src)
        setBaseVisible(true)
        setBaseOutgoing(false)
        setBaseEntering(false)
        setBaseInstant(false)
        setOverlay(null)
        setPendingSwapSrc(null)
        baseOrientationRef.current = meta.orientation
        return
      }

      if (currentSrc === meta.src) {
        setOverlay(null)
        setPendingSwapSrc(null)
        return
      }

      const currentMeta = getImageMeta(currentSrc)
      const useCrossfade = shouldCrossfade(currentMeta ?? null, meta, CROSSFADE_MODE)
      const incomingScale =
        useCrossfade && CROSSFADE_MODE === 'scale-incoming' && currentMeta
          ? crossfadeIncomingScale(currentMeta, meta)
          : 1

      if (useCrossfade) {
        setPendingSwapSrc(null)
        setBaseEntering(false)
        setBaseInstant(false)
        setBaseVisible(true)
        setBaseOutgoing(false)
        setOverlay({ src: meta.src, active: false, incomingScale })
        raf = requestAnimationFrame(() => {
          if (cancelled) return
          setOverlay({ src: meta.src, active: true, incomingScale })
          setBaseOutgoing(true)
        })
        return
      }

      setOverlay(null)
      setBaseOutgoing(false)
      setBaseEntering(false)
      setBaseInstant(false)
      setPendingSwapSrc(meta.src)
      setBaseVisible(false)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [src])

  const onOverlayTransitionEnd = (e: ReactTransitionEvent<HTMLImageElement>) => {
    if (e.propertyName !== 'opacity' || !overlay?.active || e.target !== e.currentTarget) return
    if (overlay.src !== src) return

    const committedSrc = overlay.src
    // Commit the new image to the base layer WHILE the opaque overlay still
    // covers it. baseInstant snaps the base to opaque (no fade) so it's fully
    // painted before the overlay is removed — no white/undecoded frame.
    setBaseSrc(committedSrc)
    baseOrientationRef.current = getImageMeta(committedSrc)?.orientation ?? null
    setBaseOutgoing(false)
    setBaseVisible(true)
    setBaseInstant(true)
    // Drop the overlay only after the base has painted the new src (two frames).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (srcRef.current !== committedSrc) return
        setOverlay((cur) => (cur && cur.src === committedSrc ? null : cur))
        setBaseInstant(false)
      })
    })
  }

  const onBaseTransitionEnd = (e: ReactTransitionEvent<HTMLImageElement>) => {
    if (e.propertyName !== 'opacity' || e.target !== e.currentTarget) return
    if (baseVisible || !pendingSwapSrc || pendingSwapSrc !== src) return

    const nextSrc = pendingSwapSrc

    // Only reveal once the image is paint-ready; otherwise the async decode
    // can lag the fade-in and flash a blank frame before it lands.
    const commitSwap = () => {
      if (srcRef.current !== nextSrc) return
      setBaseSrc(nextSrc)
      baseOrientationRef.current = getImageMeta(nextSrc)?.orientation ?? null
      setPendingSwapSrc(null)
      setBaseVisible(false)
      setBaseEntering(true)
    }

    const decoder = new Image()
    decoder.src = nextSrc
    if (typeof decoder.decode === 'function') {
      decoder.decode().then(commitSwap, commitSwap)
    } else {
      commitSwap()
    }
  }

  const onBaseAnimationEnd = (e: ReactAnimationEvent<HTMLImageElement>) => {
    if (e.animationName !== styles.ssImgEnter || e.target !== e.currentTarget) return
    if (pendingSwapSrc || !baseEntering || baseSrc !== src) return

    setBaseEntering(false)
    setBaseVisible(true)
  }

  if (!baseSrc && !overlay && !pendingSwapSrc) {
    return src ? <div className={styles.ssImgLoading} aria-hidden /> : null
  }

  const isSwapping = pendingSwapSrc != null || baseEntering
  const motionStyle = motionVars(direction)
  const overlayStyle: CSSProperties = {
    ...motionStyle,
    ['--ss-incoming-scale' as string]: String(overlay?.incomingScale ?? 1),
    transitionDuration: `${CROSSFADE_MS}ms`,
  }

  return (
    <div className={styles.ssImgStack} style={motionStyle}>
        {baseSrc ? (
          <img
            src={baseSrc}
            alt={alt}
            className={[
              styles.ssImgLayerBase,
              baseEntering
                ? styles.ssImgLayerBaseEntering
                : baseOutgoing
                  ? styles.ssImgLayerBaseOutgoing
                  : !baseVisible
                    ? styles.ssImgLayerBaseHidden
                    : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              transitionDuration: `${baseInstant ? 0 : isSwapping ? SWAP_MS : CROSSFADE_MS}ms`,
            }}
            decoding="async"
            draggable={false}
            onTransitionEnd={onBaseTransitionEnd}
            onAnimationEnd={onBaseAnimationEnd}
          />
        ) : null}
        {overlay ? (
          <img
            src={overlay.src}
            alt=""
            aria-hidden
            className={`${styles.ssImgLayerFade}${overlay.active ? ` ${styles.ssImgLayerFadeVisible}` : ''}`}
            style={overlayStyle}
            decoding="async"
            draggable={false}
            onTransitionEnd={onOverlayTransitionEnd}
          />
        ) : null}
    </div>
  )
}
