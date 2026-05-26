import { useEffect, useMemo, useRef, useState } from 'react'
import { safeHref } from '../../../lib/safeHref'
import { preloadImage } from '../../../lib/preloadProjectAssets'
import { readScrollTop, writeScrollTop } from '../../../lib/projectMediaSession'
import styles from './ProjectReportScroll.module.css'

type Props = {
  projectSlug: string
  pageUrls: readonly string[]
  title: string
  placeholderUrl?: string | null
}

export function ProjectReportScroll({ projectSlug, pageUrls, title, placeholderUrl }: Props) {
  const safePageUrls = useMemo(
    () => pageUrls.map((url) => safeHref(url)).filter((url): url is string => url != null),
    [pageUrls],
  )
  const safePlaceholder = safeHref(placeholderUrl)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [firstPageReady, setFirstPageReady] = useState(false)

  useEffect(() => {
    setFirstPageReady(false)
    const first = safePageUrls[0]
    if (!first) return

    void preloadImage(first).then(() => setFirstPageReady(true))
    safePageUrls.slice(1, 3).forEach((url) => {
      void preloadImage(url)
    })
    safePageUrls.slice(3).forEach((url) => {
      void preloadImage(url)
    })
  }, [safePageUrls])

  useEffect(() => {
    scrollerRef.current?.focus({ preventScroll: true })
  }, [safePageUrls])

  useEffect(() => {
    if (!firstPageReady) return
    const scroller = scrollerRef.current
    if (!scroller) return

    const saved = readScrollTop(projectSlug)
    if (saved == null) return

    scroller.scrollTop = saved
    const raf = requestAnimationFrame(() => {
      scroller.scrollTop = saved
    })
    return () => cancelAnimationFrame(raf)
  }, [projectSlug, safePageUrls, firstPageReady])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const onScroll = () => {
      writeScrollTop(projectSlug, scroller.scrollTop)
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [projectSlug, safePageUrls])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'PageUp' || e.code === 'PageDown') {
        e.preventDefault()
        e.stopPropagation()
        const step = e.code === 'PageUp' || e.code === 'PageDown' ? scroller.clientHeight * 0.85 : 72
        const delta = e.code === 'ArrowUp' || e.code === 'PageUp' ? -step : step
        scroller.scrollBy({ top: delta, behavior: 'smooth' })
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [safePageUrls])

  if (safePageUrls.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No report pages</p>
      </div>
    )
  }

  const showPlaceholder = Boolean(safePlaceholder) && !firstPageReady

  return (
    <div className={styles.root}>
      <div className={styles.scrollerWrap}>
        {showPlaceholder ? (
          <img
            className={styles.placeholder}
            src={safePlaceholder}
            alt=""
            decoding="async"
            draggable={false}
          />
        ) : null}
        <div
          ref={scrollerRef}
          className={`${styles.scroller} ${firstPageReady ? styles.scrollerReady : styles.scrollerLoading}`}
          tabIndex={0}
          aria-label={`${title} report`}
          onWheel={(e) => e.stopPropagation()}
        >
          {safePageUrls.map((src, index) => (
            <img
              key={src}
              className={styles.page}
              src={src}
              alt={`${title} report page ${index + 1} of ${safePageUrls.length}`}
              loading="eager"
              decoding={index === 0 ? 'sync' : 'async'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              draggable={false}
              onLoad={() => {
                if (index === 0) setFirstPageReady(true)
              }}
            />
          ))}
        </div>
      </div>
      <p className={styles.hint}>
        {safePageUrls.length} pages · scroll or use ↑ ↓
      </p>
    </div>
  )
}
