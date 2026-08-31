import { useEffect, useMemo, useRef, useState } from 'react'
import { markPhotographyUrlFailed, cardCandidateUrls } from './photographyVariants'
import styles from './PhotographyPinboard.module.css'

type PinboardCardImageProps = {
  thumbSrc: string
  displaySrc?: string | null
  originalSrc?: string | null
  width: number
  height: number
  priority?: boolean
}

export function PinboardCardImage({
  thumbSrc,
  displaySrc,
  originalSrc,
  width,
  height,
  priority = false,
}: PinboardCardImageProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [lazyLoaded, setLazyLoaded] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [urlIndex, setUrlIndex] = useState(0)
  const shouldLoad = priority || lazyLoaded

  const candidates = useMemo(
    () => cardCandidateUrls(thumbSrc, displaySrc, originalSrc),
    [thumbSrc, displaySrc, originalSrc],
  )

  useEffect(() => {
    if (priority || lazyLoaded) return
    const node = rootRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLazyLoaded(true)
          observer.disconnect()
        }
      },
      { rootMargin: '320px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [priority, lazyLoaded])

  const activeSrc = shouldLoad ? (candidates[urlIndex] ?? null) : null

  return (
    <div ref={rootRef} className={styles.cardImgFrame} style={{ aspectRatio: '4 / 3' }}>
      <div className={styles.cardImgSkeleton} aria-hidden />
      {activeSrc ? (
        <img
          key={activeSrc}
          src={activeSrc}
          alt=""
          className={`${styles.cardImg}${loadedSrc === activeSrc ? ` ${styles.cardImgVisible}` : ''}`}
          width={width}
          height={height}
          decoding="async"
          draggable={false}
          onLoad={() => setLoadedSrc(activeSrc)}
          onError={() => {
            markPhotographyUrlFailed(activeSrc)
            setLoadedSrc(null)
            setUrlIndex((i) => i + 1)
          }}
        />
      ) : null}
    </div>
  )
}
