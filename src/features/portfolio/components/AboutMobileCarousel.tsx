import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import styles from './AboutMobileCarousel.module.css'

const LOOP_COUNT = 3
const MOUNT_SETTLE_MS = 560
const SCROLL_SETTLE_FALLBACK_MS = 280

type SlideMetrics = {
  stride: number
}

function smootherstep(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * x * (x * (x * 6 - 15) + 10)
}

function readSlideFocus(slide: HTMLElement) {
  const raw = slide.style.getPropertyValue('--focus')
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function getSlideMetrics(el: HTMLDivElement): SlideMetrics | null {
  const slide = el.querySelector<HTMLElement>(`[data-slide="true"]`)
  if (!slide) return null

  const style = getComputedStyle(el)
  const gap = Number.parseFloat(style.columnGap || style.gap) || 0
  return { stride: slide.offsetWidth + gap }
}

function nearestSlideFromScroll(el: HTMLDivElement, count = 0) {
  const slides = el.querySelectorAll<HTMLElement>('[data-slide="true"]')
  if (slides.length === 0) return { extendedIdx: 0, realIdx: 0, itemId: undefined as string | undefined }

  const center = el.scrollLeft + el.clientWidth / 2
  let bestExtended = 0
  let bestReal = 0
  let bestItemId: string | undefined
  let bestDistance = Infinity

  slides.forEach((slide, extendedIdx) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
    const distance = Math.abs(center - slideCenter)
    const inMiddleLoop = count > 0 && extendedIdx >= count && extendedIdx < count * 2
    const adjustedDistance = inMiddleLoop ? distance - 1 : distance

    if (adjustedDistance < bestDistance) {
      bestDistance = adjustedDistance
      bestExtended = extendedIdx
      bestReal = Number(slide.dataset.realIdx ?? 0)
      bestItemId = slide.dataset.itemId
    }
  })

  return { extendedIdx: bestExtended, realIdx: bestReal, itemId: bestItemId }
}

function scrollToExtendedIndex(
  el: HTMLDivElement,
  extendedIdx: number,
  behavior: ScrollBehavior = 'auto',
  options?: { programmatic?: boolean },
) {
  const slides = el.querySelectorAll<HTMLElement>('[data-slide="true"]')
  const slide = slides[extendedIdx]
  if (!slide) return

  if (options?.programmatic) {
    el.dataset.programmaticScroll = 'true'
  }

  const target = slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
  const clamped = Math.max(0, Math.min(target, maxScroll))
  el.scrollTo({ left: clamped, behavior })
}

function repositionIfNeeded(
  el: HTMLDivElement,
  count: number,
  options?: { onReposition?: () => void },
) {
  if (count === 0) return false

  const { extendedIdx, realIdx } = nearestSlideFromScroll(el, count)
  const targetExtendedIdx = count + realIdx
  if (extendedIdx === targetExtendedIdx) return false

  const slides = el.querySelectorAll<HTMLElement>('[data-slide="true"]')
  const currentSlide = slides[extendedIdx]
  const preservedFocus = currentSlide ? readSlideFocus(currentSlide) : 1

  options?.onReposition?.()

  // Carry focus onto the middle-loop copy so the jump doesn't re-animate.
  slides.forEach((slide, idx) => {
    const focus = idx === targetExtendedIdx ? preservedFocus : 0
    slide.style.setProperty('--focus', focus.toFixed(4))
  })

  const prevSnap = el.style.scrollSnapType
  el.style.scrollSnapType = 'none'
  scrollToExtendedIndex(el, targetExtendedIdx, 'auto', { programmatic: true })
  el.style.scrollSnapType = prevSnap
  return true
}

function setFocusOnExtendedIndex(el: HTMLDivElement, extendedIdx: number, focus = 1) {
  const slides = el.querySelectorAll<HTMLElement>('[data-slide="true"]')
  slides.forEach((slide, idx) => {
    slide.style.setProperty('--focus', idx === extendedIdx ? focus.toFixed(4) : '0')
  })
}

function updateSlideProximity(
  el: HTMLDivElement,
  options: { blend?: number; dragging?: boolean; immediate?: boolean } = {},
) {
  const slides = el.querySelectorAll<HTMLElement>('[data-slide="true"]')
  const metrics = getSlideMetrics(el)
  if (!metrics || metrics.stride <= 0 || slides.length === 0) return

  const center = el.scrollLeft + el.clientWidth / 2
  const falloff = metrics.stride * 1.2
  const blend = options.blend ?? (options.dragging ? 0.38 : 0.22)

  slides.forEach((slide) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
    const distance = Math.abs(center - slideCenter)
    const raw = Math.max(0, 1 - distance / falloff)
    const target = smootherstep(raw)
    const current = readSlideFocus(slide)
    const focus = options.immediate ? target : current + (target - current) * blend
    slide.style.setProperty('--focus', focus.toFixed(4))
  })
}

type ExtendedItem<T> = {
  item: T
  realIdx: number
  key: string
}

type AboutMobileCarouselProps<T> = {
  items: T[]
  activeIdx: number
  onActiveChange: (idx: number, itemId?: string) => void
  getKey: (item: T) => string
  renderSlide: (item: T, idx: number) => ReactNode
  loading?: boolean
}

export function AboutMobileCarousel<T>({
  items,
  activeIdx,
  onActiveChange,
  getKey,
  renderSlide,
  loading = false,
}: AboutMobileCarouselProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isRepositioningRef = useRef(false)
  const skipExternalSyncRef = useRef(false)
  const skipInitialActiveSyncRef = useRef(true)
  const scrollEndTimerRef = useRef<number | null>(null)
  const proximityFrameRef = useRef<number | null>(null)
  const settleFramesRemainingRef = useRef(0)
  const isDraggingRef = useRef(false)
  const activeIdxRef = useRef(activeIdx)
  const onActiveChangeRef = useRef(onActiveChange)
  const lastCarouselWidthRef = useRef(0)
  const settleHandledRef = useRef(false)
  const layoutSeedingRef = useRef(false)
  const suppressResizeSettleRef = useRef(true)
  const seedGenerationRef = useRef(0)
  const transitionSuppressTimerRef = useRef<number | null>(null)
  const mountSettledUntilRef = useRef(0)
  const skipInitialResizeRef = useRef(true)
  const count = items.length

  const itemsSignature = useMemo(
    () => items.map((item) => getKey(item)).join('|'),
    [count, items],
  )

  useEffect(() => {
    activeIdxRef.current = activeIdx
  }, [activeIdx])

  useEffect(() => {
    onActiveChangeRef.current = onActiveChange
  }, [onActiveChange])

  const extendedItems = useMemo<ExtendedItem<T>[]>(() => {
    if (count === 0) return []

    return Array.from({ length: LOOP_COUNT }, (_, loop) =>
      items.map((item, idx) => ({
        item,
        realIdx: idx,
        key: `${loop}-${getKey(item)}`,
      })),
    ).flat()
    // getKey is read at build time; items carries the stable identity.
  }, [count, items])

  const runProximityFrame = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      proximityFrameRef.current = null
      return
    }

    const dragging = isDraggingRef.current
    const settling = settleFramesRemainingRef.current > 0
    const blend = dragging ? 0.38 : settling ? 0.34 : 0.22
    updateSlideProximity(el, { dragging, blend })

    if (settling) {
      settleFramesRemainingRef.current -= 1
    }

    if (dragging || settling) {
      proximityFrameRef.current = requestAnimationFrame(runProximityFrame)
    } else {
      proximityFrameRef.current = null
    }
  }, [])

  const ensureProximityLoop = useCallback(() => {
    if (proximityFrameRef.current !== null) return
    proximityFrameRef.current = requestAnimationFrame(runProximityFrame)
  }, [runProximityFrame])

  const stopProximityLoop = useCallback(() => {
    if (proximityFrameRef.current !== null) {
      cancelAnimationFrame(proximityFrameRef.current)
      proximityFrameRef.current = null
    }
    settleFramesRemainingRef.current = 0
  }, [])

  const clearTransitionSuppressTimer = useCallback(() => {
    if (transitionSuppressTimerRef.current !== null) {
      window.clearTimeout(transitionSuppressTimerRef.current)
      transitionSuppressTimerRef.current = null
    }
  }, [])

  const extendTransitionSuppress = useCallback(
    (durationMs = 260) => {
      const el = scrollRef.current
      if (!el) return

      el.classList.add(styles.carouselRepositioning)
      mountSettledUntilRef.current = performance.now() + durationMs
      clearTransitionSuppressTimer()
      transitionSuppressTimerRef.current = window.setTimeout(() => {
        transitionSuppressTimerRef.current = null
        mountSettledUntilRef.current = 0
        el.classList.remove(styles.carouselRepositioning)
      }, durationMs)
    },
    [clearTransitionSuppressTimer],
  )

  const runSettleAnimation = useCallback(() => {
    if (performance.now() < mountSettledUntilRef.current) return
    settleFramesRemainingRef.current = 14
    ensureProximityLoop()
  }, [ensureProximityLoop])

  const scrollToMiddleLoopIndex = useCallback(
    (
      idx: number,
      behavior: ScrollBehavior = 'auto',
      options?: { programmatic?: boolean; seed?: boolean },
    ) => {
      const el = scrollRef.current
      if (!el || count === 0) return

      const targetExtendedIdx = count + idx
      if (options?.programmatic) {
        el.dataset.programmaticScroll = 'true'
        el.classList.add(styles.carouselRepositioning)
      }

      const prevSnap = el.style.scrollSnapType
      el.style.scrollSnapType = 'none'
      scrollToExtendedIndex(el, targetExtendedIdx, behavior, { programmatic: options?.programmatic })
      el.style.scrollSnapType = prevSnap

      if (options?.seed) {
        setFocusOnExtendedIndex(el, targetExtendedIdx, 1)
      } else {
        updateSlideProximity(el, { immediate: true })
      }
    },
    [count],
  )

  const finishLayoutSeed = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    layoutSeedingRef.current = false
    delete el.dataset.programmaticScroll
    extendTransitionSuppress(MOUNT_SETTLE_MS)
  }, [extendTransitionSuppress])

  const seedCarouselLayout = useCallback(() => {
    const el = scrollRef.current
    if (!el || count === 0) return

    const generation = seedGenerationRef.current + 1
    seedGenerationRef.current = generation
    layoutSeedingRef.current = true
    mountSettledUntilRef.current = performance.now() + MOUNT_SETTLE_MS
    stopProximityLoop()
    clearTransitionSuppressTimer()
    scrollToMiddleLoopIndex(activeIdxRef.current, 'auto', { programmatic: true, seed: true })
    lastCarouselWidthRef.current = el.clientWidth
    suppressResizeSettleRef.current = true
    skipInitialResizeRef.current = true

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (seedGenerationRef.current !== generation) return
        finishLayoutSeed()
      })
    })
  }, [
    clearTransitionSuppressTimer,
    count,
    finishLayoutSeed,
    scrollToMiddleLoopIndex,
    stopProximityLoop,
  ])

  // Re-seed when the carousel becomes visible or the tab item list changes.
  useLayoutEffect(() => {
    if (loading || count === 0) return
    seedCarouselLayout()
  }, [loading, count, itemsSignature, seedCarouselLayout])

  // Programmatic jumps (e.g. filmstrip tap) — skip when the swipe already moved scroll.
  useEffect(() => {
    if (skipInitialActiveSyncRef.current) {
      skipInitialActiveSyncRef.current = false
      return
    }

    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false
      return
    }

    const el = scrollRef.current
    if (el && count > 0) {
      const { realIdx, extendedIdx } = nearestSlideFromScroll(el, count)
      const middleExtendedIdx = count + activeIdx

      if (realIdx === activeIdx) {
        if (extendedIdx !== middleExtendedIdx) {
          isRepositioningRef.current = true
          el.classList.add(styles.carouselRepositioning)
          repositionIfNeeded(el, count, {
            onReposition: () => {
              skipExternalSyncRef.current = true
            },
          })
          updateSlideProximity(el, { immediate: true })
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isRepositioningRef.current = false
              delete el.dataset.programmaticScroll
              el.classList.remove(styles.carouselRepositioning)
              updateSlideProximity(el, { immediate: true })
            })
          })
        }
        return
      }
    }

    scrollToMiddleLoopIndex(activeIdx, 'smooth')
  }, [activeIdx, count, scrollToMiddleLoopIndex])

  useEffect(() => {
    if (loading) return

    const el = scrollRef.current
    if (!el || count === 0) return

    const isProgrammaticScroll = () => el.dataset.programmaticScroll === 'true'

    const commitActiveIdxFromScroll = () => {
      const { realIdx, itemId } = nearestSlideFromScroll(el, count)
      if (realIdx === activeIdxRef.current) return false

      skipExternalSyncRef.current = true
      activeIdxRef.current = realIdx
      onActiveChangeRef.current(realIdx, itemId)
      return true
    }

    const finishRepositionCleanup = () => {
      if (el.dataset.programmaticScroll !== 'true') return
      if (layoutSeedingRef.current) return
      delete el.dataset.programmaticScroll
      el.classList.remove(styles.carouselRepositioning)
      isRepositioningRef.current = false
      updateSlideProximity(el, { immediate: true })
    }

    const finishScroll = (): boolean => {
      isRepositioningRef.current = true
      commitActiveIdxFromScroll()
      const didReposition = repositionIfNeeded(el, count, {
        onReposition: () => {
          skipExternalSyncRef.current = true
          el.classList.add(styles.carouselRepositioning)
        },
      })
      if (!didReposition) {
        updateSlideProximity(el, { immediate: true })
        requestAnimationFrame(() => {
          isRepositioningRef.current = false
          el.classList.remove(styles.carouselRepositioning)
        })
      } else {
        // scrollend may not fire for instant programmatic jumps — fallback cleanup.
        window.setTimeout(finishRepositionCleanup, 48)
      }
      return didReposition
    }

    const tryFinishScroll = () => {
      if (
        settleHandledRef.current ||
        layoutSeedingRef.current ||
        performance.now() < mountSettledUntilRef.current
      ) {
        return
      }
      settleHandledRef.current = true
      const didReposition = finishScroll()
      if (!didReposition) {
        runSettleAnimation()
      }
    }

    const scheduleFinishAfterSettle = () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current)
      }
      // Fallback for browsers without scrollend — wait for momentum to finish.
      scrollEndTimerRef.current = window.setTimeout(() => {
        scrollEndTimerRef.current = null
        tryFinishScroll()
      }, SCROLL_SETTLE_FALLBACK_MS)
    }

    const onPointerDown = () => {
      settleHandledRef.current = false
      settleFramesRemainingRef.current = 0
      isDraggingRef.current = true
      el.classList.add(styles.carouselDragging)
      ensureProximityLoop()
    }

    const onScroll = () => {
      if (layoutSeedingRef.current || isRepositioningRef.current || isProgrammaticScroll()) return

      ensureProximityLoop()
      commitActiveIdxFromScroll()
      scheduleFinishAfterSettle()
    }

    const onScrollEnd = () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current)
        scrollEndTimerRef.current = null
      }

      if (isProgrammaticScroll()) {
        isDraggingRef.current = false
        el.classList.remove(styles.carouselDragging)
        finishRepositionCleanup()
        return
      }

      isDraggingRef.current = false
      el.classList.remove(styles.carouselDragging)
      ensureProximityLoop()

      // Let scroll-snap finish painting before reading the settled slide.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tryFinishScroll()
        })
      })
    }

    const onResize = () => {
      scrollToMiddleLoopIndex(activeIdxRef.current, 'auto')
    }

    const onCarouselResize = (entries: ResizeObserverEntry[]) => {
      if (isDraggingRef.current || isRepositioningRef.current || layoutSeedingRef.current) return
      if (performance.now() < mountSettledUntilRef.current) return

      const width = entries[0]?.contentRect.width ?? el.clientWidth
      if (width === 0) return

      if (skipInitialResizeRef.current) {
        skipInitialResizeRef.current = false
        lastCarouselWidthRef.current = width
        return
      }

      if (Math.abs(width - lastCarouselWidthRef.current) < 1) return
      lastCarouselWidthRef.current = width

      requestAnimationFrame(() => {
        scrollToMiddleLoopIndex(activeIdxRef.current, 'auto', { programmatic: true, seed: true })
        requestAnimationFrame(() => {
          updateSlideProximity(el, { immediate: true })
          if (!suppressResizeSettleRef.current) {
            runSettleAnimation()
          }
          suppressResizeSettleRef.current = false
        })
      })
    }

    lastCarouselWidthRef.current = el.clientWidth
    skipInitialResizeRef.current = true

    const resizeObserver = new ResizeObserver(onCarouselResize)
    resizeObserver.observe(el)

    el.addEventListener('pointerdown', onPointerDown, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scrollend', onScrollEnd)
    window.addEventListener('resize', onResize)

    return () => {
      resizeObserver.disconnect()
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('resize', onResize)
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current)
      }
      clearTransitionSuppressTimer()
      stopProximityLoop()
    }
  }, [
    clearTransitionSuppressTimer,
    count,
    ensureProximityLoop,
    loading,
    runSettleAnimation,
    scrollToMiddleLoopIndex,
    stopProximityLoop,
  ])

  if (loading) {
    return (
      <div className={styles.carouselHost}>
        <div className={styles.carousel} aria-busy="true">
          <div className={styles.skeletonSlide}>
            <div className={styles.skeletonBlock} />
          </div>
        </div>
      </div>
    )
  }

  if (count === 0) return null

  return (
    <div className={styles.carouselHost}>
      <div
        ref={scrollRef}
        className={styles.carousel}
        aria-roledescription="carousel"
        aria-live="polite"
      >
        {extendedItems.map(({ item, realIdx, key }) => (
          <div
            key={key}
            className={styles.slide}
            data-slide="true"
            data-real-idx={realIdx}
            data-item-id={getKey(item)}
            aria-hidden={realIdx !== activeIdx}
          >
            {renderSlide(item, realIdx)}
          </div>
        ))}
      </div>
    </div>
  )
}
