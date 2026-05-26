import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { safeHref } from '../../../lib/safeHref'
import { preloadImage } from '../../../lib/preloadProjectAssets'
import { readSlideshowIndex, writeSlideshowIndex } from '../../../lib/projectMediaSession'
import styles from './ProjectShowcaseSlideshow.module.css'

const SWIPE_THRESHOLD_PX = 48
const SLIDE_MOUNT_RADIUS = 2

type Props = {
  projectSlug: string
  slideUrls: readonly string[]
  title: string
  placeholderUrl?: string | null
}

export function ProjectShowcaseSlideshow({ projectSlug, slideUrls, title, placeholderUrl }: Props) {
  const safeSlideUrls = useMemo(
    () => slideUrls.map((url) => safeHref(url)).filter((url): url is string => url != null),
    [slideUrls],
  )
  const safePlaceholder = safeHref(placeholderUrl)
  const maxSlideIndex = Math.max(0, safeSlideUrls.length - 1)

  const [pageIndex, setPageIndex] = useState(() =>
    readSlideshowIndex(projectSlug, maxSlideIndex),
  )
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [failed, setFailed] = useState(false)
  const [firstSlideReady, setFirstSlideReady] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const pageIndexRef = useRef(pageIndex)
  const skipPersistRef = useRef(true)
  const pointerStartX = useRef(0)
  const pointerStartY = useRef(0)
  const pointerActive = useRef(false)

  const pageCount = safeSlideUrls.length

  useEffect(() => {
    pageIndexRef.current = pageIndex
  }, [pageIndex])

  const goPrev = useCallback(() => {
    setPageIndex((i) => Math.max(0, i - 1))
    setFailed(false)
  }, [])

  const goNext = useCallback(() => {
    setPageIndex((i) => (pageCount > 0 ? Math.min(pageCount - 1, i + 1) : i))
    setFailed(false)
  }, [pageCount])

  const goToSlide = useCallback((index: number) => {
    setPageIndex(index)
    setFailed(false)
  }, [])

  useEffect(() => {
    skipPersistRef.current = true
    const restored = readSlideshowIndex(projectSlug, maxSlideIndex)
    pageIndexRef.current = restored
    setPageIndex(restored)
    setDragOffset(0)
    setFailed(false)
    setFirstSlideReady(false)

    const target = safeSlideUrls[restored]
    if (!target) return

    void preloadImage(target).then(() => setFirstSlideReady(true))

    safeSlideUrls.forEach((url, i) => {
      if (i !== restored && Math.abs(i - restored) <= 3) {
        void preloadImage(url)
      }
    })
    safeSlideUrls.forEach((url, i) => {
      if (Math.abs(i - restored) > 3) {
        void preloadImage(url)
      }
    })
  }, [safeSlideUrls, projectSlug, maxSlideIndex])

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    writeSlideshowIndex(projectSlug, pageIndex)
  }, [projectSlug, pageIndex])

  useEffect(() => {
    return () => {
      writeSlideshowIndex(projectSlug, pageIndexRef.current)
    }
  }, [projectSlug])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        goPrev()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        goNext()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [goPrev, goNext])

  const finishDrag = useCallback(
    (deltaX: number) => {
      if (deltaX <= -SWIPE_THRESHOLD_PX) goNext()
      else if (deltaX >= SWIPE_THRESHOLD_PX) goPrev()
      setDragOffset(0)
      setIsDragging(false)
    },
    [goNext, goPrev],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    pointerActive.current = true
    pointerStartX.current = e.clientX
    pointerStartY.current = e.clientY
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActive.current) return
    const deltaX = e.clientX - pointerStartX.current
    const deltaY = e.clientY - pointerStartY.current
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) return
    const atStart = pageIndex === 0 && deltaX > 0
    const atEnd = pageIndex === pageCount - 1 && deltaX < 0
    const resisted = atStart || atEnd ? deltaX * 0.35 : deltaX
    setDragOffset(resisted)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActive.current) return
    pointerActive.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const deltaX = e.clientX - pointerStartX.current
    const moved = Math.abs(deltaX) > 8
    if (moved) {
      finishDrag(deltaX)
      return
    }
    setDragOffset(0)
    setIsDragging(false)
  }

  const onPointerCancel = () => {
    pointerActive.current = false
    setDragOffset(0)
    setIsDragging(false)
  }

  const canGoPrev = pageIndex > 0
  const canGoNext = pageCount > 0 && pageIndex < pageCount - 1

  const getSlideOpacity = (index: number): number => {
    if (index === pageIndex) {
      if (!isDragging || dragOffset === 0) return 1
      const width = viewportRef.current?.clientWidth ?? 1
      const progress = Math.min(1, Math.abs(dragOffset) / width)
      return 1 - progress * 0.55
    }
    if (isDragging && dragOffset < 0 && index === pageIndex + 1) {
      const width = viewportRef.current?.clientWidth ?? 1
      return Math.min(1, (-dragOffset / width) * 0.85)
    }
    if (isDragging && dragOffset > 0 && index === pageIndex - 1) {
      const width = viewportRef.current?.clientWidth ?? 1
      return Math.min(1, (dragOffset / width) * 0.85)
    }
    return 0
  }

  if (pageCount === 0) {
    return (
      <div className={styles.frame}>
        <p className={styles.empty}>No showcase slides</p>
      </div>
    )
  }

  const showPlaceholder = Boolean(safePlaceholder) && !firstSlideReady
  const showNav = pageCount > 1 && firstSlideReady

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        {showNav ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="Previous slide"
          >
            ‹
          </button>
        ) : null}

        <div
          ref={viewportRef}
          className={styles.viewport}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {showPlaceholder ? (
            <img
              className={styles.placeholder}
              src={safePlaceholder}
              alt=""
              decoding="async"
              draggable={false}
            />
          ) : null}
          {failed ? (
            <p className={styles.error}>Could not load slide</p>
          ) : (
            <div
              className={`${styles.slidesStack} ${isDragging ? styles.slidesStackDragging : ''} ${firstSlideReady ? styles.slidesStackReady : styles.slidesStackLoading}`}
            >
              {safeSlideUrls.map((src, index) => {
                const mountRadius = isDragging ? SLIDE_MOUNT_RADIUS + 1 : SLIDE_MOUNT_RADIUS
                if (Math.abs(index - pageIndex) > mountRadius) return null
                const isActive = index === pageIndex
                const opacity = getSlideOpacity(index)
                return (
                  <div
                    key={src}
                    className={`${styles.slideFrame} ${isActive ? styles.slideFrameActive : ''}`}
                    style={{ opacity }}
                    aria-hidden={!isActive && opacity < 0.05}
                  >
                    <img
                      className={styles.slide}
                      src={src}
                      alt={`${title} showcase slide ${index + 1} of ${pageCount}`}
                      draggable={false}
                      decoding={index === 0 ? 'sync' : 'async'}
                      loading="eager"
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      onLoad={() => {
                        if (index === pageIndex) setFirstSlideReady(true)
                      }}
                      onError={() => setFailed(true)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {showNav ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="Next slide"
          >
            ›
          </button>
        ) : null}
      </div>

      <div className={styles.footer}>
        {showNav ? (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnMobile}`}
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="Previous slide"
          >
            ‹
          </button>
        ) : (
          <span className={styles.footerSide} />
        )}

        {showNav ? (
          <div className={styles.dots} role="tablist" aria-label="Slide indicators">
            {safeSlideUrls.map((src, index) => (
              <button
                key={src}
                type="button"
                role="tab"
                className={`${styles.dot} ${index === pageIndex ? styles.dotActive : ''}`}
                aria-selected={index === pageIndex}
                aria-label={`Go to slide ${index + 1} of ${pageCount}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        ) : null}

        {showNav ? (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnMobile}`}
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="Next slide"
          >
            ›
          </button>
        ) : (
          <span className={styles.footerSide} />
        )}
      </div>
    </div>
  )
}
