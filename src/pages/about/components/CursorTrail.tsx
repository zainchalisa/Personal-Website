import { useEffect, useRef } from 'react'
import styles from './CursorTrail.module.css'

const TRAIL_SIZES = [7, 6, 5, 4, 4, 3, 2]
const TRAIL_OPACITIES = [0.55, 0.45, 0.38, 0.3, 0.24, 0.18, 0.12]
const BURST_COLORS = [
  'var(--accent-y)',
  'var(--accent-b)',
  'var(--accent-p)',
  'var(--accent-g)',
  'var(--accent-o)',
]

type Point = { x: number; y: number }

export function CursorTrail() {
  const mouseRef = useRef<Point>({ x: -100, y: -100 })
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionsRef = useRef<Point[]>(
    TRAIL_SIZES.map(() => ({ x: -100, y: -100 })),
  )
  const rafRef = useRef<number>(0)
  const activeRef = useRef(false)
  const burstContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    function tick() {
      if (document.hidden) {
        activeRef.current = false
        return
      }

      const target = mouseRef.current
      const positions = positionsRef.current
      let settled = true

      for (let i = 0; i < positions.length; i++) {
        const prev = i === 0 ? target : positions[i - 1]
        const factor = 0.45 - i * 0.04
        const nextX = lerp(positions[i].x, prev.x, factor)
        const nextY = lerp(positions[i].y, prev.y, factor)
        if (Math.abs(nextX - positions[i].x) > 0.5 || Math.abs(nextY - positions[i].y) > 0.5) {
          settled = false
        }
        positions[i] = { x: nextX, y: nextY }
        const el = trailRefs.current[i]
        if (el) {
          el.style.transform = `translate(${nextX}px, ${nextY}px) translate(-50%, -50%)`
        }
      }

      if (settled) {
        activeRef.current = false
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (!activeRef.current) {
        activeRef.current = true
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    const onClick = (e: MouseEvent) => {
      const container = burstContainerRef.current
      if (!container) return
      const count = 5
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const dist = 36 + Math.random() * 28
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist
        const el = document.createElement('div')
        el.className = styles.burst
        el.style.left = `${e.clientX}px`
        el.style.top = `${e.clientY}px`
        el.style.setProperty('--dx', `${dx}px`)
        el.style.setProperty('--dy', `${dy}px`)
        el.style.background = BURST_COLORS[i % BURST_COLORS.length]
        container.appendChild(el)
        window.setTimeout(() => el.remove(), 500)
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        activeRef.current = false
        cancelAnimationFrame(rafRef.current)
      }
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('click', onClick)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(rafRef.current)
      activeRef.current = false
    }
  }, [])

  return (
    <>
      {TRAIL_SIZES.map((size, i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el
          }}
          className={styles.dot}
          style={{
            width: size,
            height: size,
            opacity: TRAIL_OPACITIES[i],
          }}
        />
      ))}
      <div ref={burstContainerRef} className={styles.burstLayer} aria-hidden="true" />
    </>
  )
}
