import { useCallback, useEffect, useMemo, useState } from 'react'
import { safeHref } from '@/shared/lib/safeHref'
import styles from './TerminalSlideChrome.module.css'

type Props = {
  slideUrls: readonly string[]
  title: string
  variant?: 'desktop' | 'mobile'
}

export function TerminalSlideshow({ slideUrls, title, variant = 'desktop' }: Props) {
  const safeSlideUrls = useMemo(
    () => slideUrls.map((url) => safeHref(url)).filter((url): url is string => url != null),
    [slideUrls],
  )
  const [index, setIndex] = useState(0)
  const count = safeSlideUrls.length

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(count - 1, i + 1))
  }, [count])

  useEffect(() => {
    setIndex(0)
  }, [safeSlideUrls])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [goPrev, goNext])

  if (count === 0) {
    return (
      <div className={styles.empty}>
        <p>No showcase slides</p>
      </div>
    )
  }

  return (
    <div className={`${styles.root} ${variant === 'mobile' ? styles.rootMobile : ''}`}>
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
              decoding={i === 0 ? 'sync' : 'async'}
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
