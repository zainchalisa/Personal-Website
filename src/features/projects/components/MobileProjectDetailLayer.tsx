import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './TerminalProjects.module.css'

const DISMISS_THRESHOLD_PX = 96
const EDGE_ZONE_PX = 48
const AXIS_LOCK_PX = 8

type Props = {
  onClose: () => void
  children: ReactNode
}

export function MobileProjectDetailLayer({ onClose, children }: Props) {
  const layerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const axisRef = useRef<'x' | 'y' | null>(null)
  const closingRef = useRef(false)

  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)

  const finishClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    setDragging(false)
    setDragX(window.innerWidth)
    window.setTimeout(() => {
      onClose()
      closingRef.current = false
      setClosing(false)
      setDragX(0)
      axisRef.current = null
    }, 260)
  }, [onClose])

  const snapBack = useCallback(() => {
    setDragging(false)
    axisRef.current = null
    setDragX(0)
  }, [])

  useEffect(() => {
    const el = layerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (closingRef.current) return
      const touch = e.touches[0]
      if (!touch) return

      startXRef.current = touch.clientX
      startYRef.current = touch.clientY
      axisRef.current = null
    }

    const onTouchMove = (e: TouchEvent) => {
      if (closingRef.current) return
      const touch = e.touches[0]
      if (!touch) return

      const dx = touch.clientX - startXRef.current
      const dy = touch.clientY - startYRef.current

      if (axisRef.current == null) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return

        const horizontal = Math.abs(dx) > Math.abs(dy)
        if (!horizontal) {
          axisRef.current = 'y'
          return
        }

        const fromEdge = startXRef.current <= EDGE_ZONE_PX
        const scrollTop =
          el.querySelector('[data-mobile-detail-scroll]')?.scrollTop ?? 0
        if (!fromEdge && scrollTop > 0) {
          axisRef.current = 'y'
          return
        }

        axisRef.current = 'x'
        setDragging(true)
      }

      if (axisRef.current !== 'x') return

      const next = Math.max(0, dx)
      setDragX(next)
      if (next > 0) e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (closingRef.current) return
      const touch = e.changedTouches[0]
      if (!touch || axisRef.current !== 'x') {
        snapBack()
        return
      }

      const dx = touch.clientX - startXRef.current
      if (dx >= DISMISS_THRESHOLD_PX) {
        finishClose()
        return
      }

      snapBack()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [finishClose, snapBack])

  const dragProgress = Math.min(1, dragX / DISMISS_THRESHOLD_PX)

  return (
    <div className={styles.mobileDetail}>
      <div
        ref={layerRef}
        className={styles.mobileDetailSurface}
        style={{
          transform: `translateX(${dragX}px)`,
          transition:
            dragging || closing
              ? closing
                ? 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)'
                : 'none'
              : 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow:
            dragX > 0
              ? `-12px 0 32px rgba(0, 0, 0, ${0.18 + dragProgress * 0.22})`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
