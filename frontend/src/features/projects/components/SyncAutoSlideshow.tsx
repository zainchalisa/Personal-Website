import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { safeHref } from '@/lib/safeHref'
import styles from './TerminalSlideChrome.module.css'

const INTERVAL_MS = 4000

type Props = {
  slideUrls: readonly string[]
  title: string
  variant?: 'desktop' | 'mobile'
}

export function SyncAutoSlideshow({ slideUrls, title, variant = 'desktop' }: Props) {
  const safeSlideUrls = useMemo(
    () => slideUrls.map((url) => safeHref(url)).filter((url): url is string => url != null),
    [slideUrls],
  )
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = safeSlideUrls.length
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(performance.now())

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
    startRef.current = performance.now()
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => (count > 0 ? (i + 1) % count : i))
    startRef.current = performance.now()
  }, [count])

  useEffect(() => {
    setIndex(0)
    startRef.current = performance.now()
  }, [safeSlideUrls])

  useEffect(() => {
    if (paused || count <= 1) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      if (elapsed >= INTERVAL_MS) {
        setIndex((i) => (i + 1) % count)
        startRef.current = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [paused, count, index])

  if (count === 0) {
    return null
  }

  return (
    <div
      className={`${styles.root} ${variant === 'mobile' ? styles.rootMobile : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        startRef.current = performance.now()
      }}
    >
      <div className={styles.controlsRow}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <div className={styles.viewport}>
          {safeSlideUrls.map((src, i) => (
            <img
              key={src}
              className={`${styles.slide} ${i === index ? styles.slideActive : ''}`}
              src={src}
              alt={`${title} slide ${i + 1} of ${count}`}
              draggable={false}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.navBtn}
          onClick={goNext}
          disabled={index >= count - 1}
          aria-label="Next slide"
        >
          ›
        </button>

        <span className={styles.counter}>
          {index + 1} / {count}
        </span>
      </div>
    </div>
  )
}
