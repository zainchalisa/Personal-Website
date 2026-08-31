import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Theme } from '@/hooks/themeTransition'
import type { BoardRegionId, BoardRegionLayout } from '@/features/photography/components/pinboardData'
import { regionVisitedBarPercent } from '@/features/photography/components/regionCountryTotals'
import styles from './PhotographyMobile.module.css'

type PillItem = {
  id: BoardRegionId | null
  name: string
  pin: string
  visited: number
  total: number
}

type PhotographyMobileRegionPillsProps = {
  theme: Theme
  regions: BoardRegionLayout[]
  activeRegionId: BoardRegionId | null
  onSelectRegion: (id: BoardRegionId | null) => void
}

function buildPillItems(regions: BoardRegionLayout[]): PillItem[] {
  return regions.map((r) => ({
    id: r.id,
    name: r.name,
    pin: r.pin,
    visited: r.countries.length,
    total: r.total,
  }))
}

export function PhotographyMobileRegionPills({
  theme,
  regions,
  activeRegionId,
  onSelectRegion,
}: PhotographyMobileRegionPillsProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [edgePad, setEdgePad] = useState(0)
  const items = useMemo(() => buildPillItems(regions), [regions])

  const activeIndex = useMemo(() => {
    const idx = items.findIndex((item) => item.id === activeRegionId)
    return idx >= 0 ? idx : 0
  }, [items, activeRegionId])

  const measureEdgePad = useCallback(() => {
    const strip = stripRef.current
    if (!strip) return

    const pills = pillRefs.current.filter(Boolean) as HTMLButtonElement[]
    if (pills.length === 0) return

    const maxPillW = Math.max(...pills.map((pill) => pill.offsetWidth))
    setEdgePad(Math.max(0, strip.clientWidth / 2 - maxPillW / 2))
  }, [])

  useLayoutEffect(() => {
    measureEdgePad()
  }, [items, measureEdgePad])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return

    const observer = new ResizeObserver(() => measureEdgePad())
    observer.observe(strip)
    for (const pill of pillRefs.current) {
      if (pill) observer.observe(pill)
    }

    return () => observer.disconnect()
  }, [items, measureEdgePad])

  const scrollPillToCenter = useCallback((index: number, smooth = true) => {
    const strip = stripRef.current
    const pill = pillRefs.current[index]
    if (!strip || !pill) return

    const targetScroll = pill.offsetLeft - (strip.clientWidth - pill.offsetWidth) / 2
    const maxScroll = strip.scrollWidth - strip.clientWidth
    const clamped = Math.max(0, Math.min(targetScroll, maxScroll))

    strip.classList.add(styles.pillStripNoSnap)
    strip.scrollTo({
      left: clamped,
      behavior: smooth ? 'smooth' : 'auto',
    })

    const releaseSnap = () => strip.classList.remove(styles.pillStripNoSnap)
    if (smooth) {
      strip.addEventListener('scrollend', releaseSnap, { once: true })
      window.setTimeout(releaseSnap, 420)
    } else {
      releaseSnap()
    }
  }, [])

  const isFirstCenterRef = useRef(true)

  useLayoutEffect(() => {
    if (edgePad <= 0) return
    const smooth = !isFirstCenterRef.current
    isFirstCenterRef.current = false
    scrollPillToCenter(activeIndex, smooth)
  }, [activeIndex, edgePad, scrollPillToCenter])

  const pickCenteredPill = useCallback(() => {
    const strip = stripRef.current
    if (!strip) return

    const stripRect = strip.getBoundingClientRect()
    const stripCenter = stripRect.left + stripRect.width / 2
    let closestIndex = 0
    let minDistance = Infinity

    pillRefs.current.forEach((pill, index) => {
      if (!pill) return
      const pillRect = pill.getBoundingClientRect()
      const pillCenter = pillRect.left + pillRect.width / 2
      const distance = Math.abs(pillCenter - stripCenter)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    scrollPillToCenter(closestIndex, true)

    const item = items[closestIndex]
    if (item && item.id !== activeRegionId) {
      onSelectRegion(item.id)
    }
  }, [activeRegionId, items, onSelectRegion, scrollPillToCenter])

  const onStripPointerDown = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation()
  }, [])

  const onStripPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      e.stopPropagation()
      if ((e.target as HTMLElement).closest('button')) return
      window.setTimeout(() => pickCenteredPill(), 120)
    },
    [pickCenteredPill],
  )

  const onPillClick = useCallback(
    (index: number, e: ReactMouseEvent) => {
      e.stopPropagation()
      const item = items[index]
      if (!item) return
      onSelectRegion(item.id)
      scrollPillToCenter(index, true)
    },
    [items, onSelectRegion, scrollPillToCenter],
  )

  return (
    <div className={styles.pillStripWrap} data-photo-theme={theme}>
      <p className={styles.exploreHintPill}>Drag to explore · click a card</p>
      <div
        ref={stripRef}
        className={styles.pillStrip}
        role="tablist"
        aria-label="Regions"
        onPointerDown={onStripPointerDown}
        onPointerUp={onStripPointerUp}
        onPointerCancel={onStripPointerUp}
      >
        <div
          className={styles.pillStripSpacer}
          style={{ width: edgePad, minWidth: edgePad }}
          aria-hidden
        />
        {items.map((item, index) => {
          const isActive = item.id === activeRegionId
          const barPct = regionVisitedBarPercent(item.visited, item.total)
          return (
            <button
              key={item.id ?? 'all'}
              ref={(el) => {
                pillRefs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.statusPill}${isActive ? ` ${styles.statusPillActive}` : ''}`}
              onClick={(e) => onPillClick(index, e)}
            >
              <span className={styles.statusPillRow}>
                <span className={styles.statusPillDot} style={{ background: item.pin }} />
                <span className={styles.statusPillName}>{item.name}</span>
                <span className={styles.statusPillFrac}>
                  {item.visited}/{item.total}
                </span>
              </span>
              <span className={styles.statusPillBarWrap}>
                <span
                  className={styles.statusPillBarFill}
                  style={{
                    width: `${barPct}%`,
                    minWidth: item.visited > 0 ? 3 : 0,
                    background: item.pin,
                  }}
                />
              </span>
            </button>
          )
        })}
        <div
          className={styles.pillStripSpacer}
          style={{ width: edgePad, minWidth: edgePad }}
          aria-hidden
        />
      </div>
    </div>
  )
}
