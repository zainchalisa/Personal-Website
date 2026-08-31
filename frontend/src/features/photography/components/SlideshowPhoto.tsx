import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent as ReactTransitionEvent,
} from 'react'
import { logImageNavPaint } from '@/lib/imageLoadMetrics'
import { isImageLoadReady } from '@/lib/preloadImage'
import { resolveSlideshowPhotoMeta } from './photographyPreload'
import { slideshowCandidateUrls } from './photographyVariants'
import styles from './PhotographyPinboard.module.css'

const CROSSFADE_MS = 220

type SlideshowPhotoProps = {
  src: string | null
  fallbackSrc?: string | null
  alt: string
  direction?: 1 | -1
}

export function SlideshowPhoto({
  src,
  fallbackSrc,
  alt,
}: SlideshowPhotoProps) {
  const [baseSrc, setBaseSrc] = useState<string | null>(null)
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const [waiting, setWaiting] = useState(false)

  const baseSrcRef = useRef<string | null>(null)
  const incomingSrcRef = useRef<string | null>(null)
  const navStartedRef = useRef(0)
  const loadGenRef = useRef(0)

  useEffect(() => {
    baseSrcRef.current = baseSrc
  }, [baseSrc])

  useEffect(() => {
    incomingSrcRef.current = incomingSrc
  }, [incomingSrc])

  useEffect(() => {
    if (!src) {
      loadGenRef.current += 1
      setBaseSrc(null)
      setIncomingSrc(null)
      setIncomingVisible(false)
      setWaiting(false)
      baseSrcRef.current = null
      incomingSrcRef.current = null
      return
    }

    const gen = ++loadGenRef.current
    navStartedRef.current = performance.now()

    const alreadyReady = slideshowCandidateUrls(src, fallbackSrc).some(isImageLoadReady)
    setWaiting(!alreadyReady && Boolean(baseSrcRef.current))

    let raf = 0

    void resolveSlideshowPhotoMeta(src, fallbackSrc ?? null).then((meta) => {
      if (gen !== loadGenRef.current) return
      if (meta.width <= 1) {
        setWaiting(false)
        return
      }

      logImageNavPaint(meta.src, performance.now() - navStartedRef.current, alreadyReady)
      setWaiting(false)

      const currentSrc = incomingSrcRef.current ?? baseSrcRef.current
      if (!currentSrc) {
        setBaseSrc(meta.src)
        setIncomingSrc(null)
        setIncomingVisible(false)
        return
      }

      if (currentSrc === meta.src) {
        if (incomingSrcRef.current === meta.src) {
          setBaseSrc(meta.src)
          setIncomingSrc(null)
          setIncomingVisible(false)
        }
        return
      }

      setIncomingSrc(meta.src)
      setIncomingVisible(false)
      raf = requestAnimationFrame(() => {
        if (gen !== loadGenRef.current) return
        setIncomingVisible(true)
      })
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [src, fallbackSrc])

  const commitIncoming = (resolvedSrc: string) => {
    setBaseSrc(resolvedSrc)
    baseSrcRef.current = resolvedSrc
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (incomingSrcRef.current !== resolvedSrc) return
        setIncomingSrc(null)
        setIncomingVisible(false)
      })
    })
  }

  const onIncomingTransitionEnd = (e: ReactTransitionEvent<HTMLImageElement>) => {
    if (e.propertyName !== 'opacity' || e.target !== e.currentTarget) return
    if (!incomingVisible || !incomingSrc) return
    commitIncoming(incomingSrc)
  }

  if (!src && !baseSrc && !incomingSrc) return null

  const incomingStyle: CSSProperties = {
    transitionDuration: `${CROSSFADE_MS}ms`,
  }

  return (
    <div className={styles.ssImgStack}>
      {!baseSrc && !incomingSrc ? <div className={styles.ssImgLoading} aria-hidden /> : null}
      {waiting && baseSrc ? <div className={styles.ssImgWaiting} aria-hidden /> : null}
      {baseSrc ? (
        <img
          src={baseSrc}
          alt={incomingSrc ? '' : alt}
          className={styles.ssImgLayerBase}
          decoding="async"
          draggable={false}
        />
      ) : null}
      {incomingSrc ? (
        <img
          src={incomingSrc}
          alt={alt}
          className={`${styles.ssImgLayerFade}${incomingVisible ? ` ${styles.ssImgLayerFadeVisible}` : ''}`}
          style={incomingStyle}
          decoding="async"
          draggable={false}
          onTransitionEnd={onIncomingTransitionEnd}
        />
      ) : null}
    </div>
  )
}
