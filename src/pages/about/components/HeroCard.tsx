import { useEffect, useRef } from 'react'
import profileDark from '../assets/profile image dark.png'
import profileLight from '../assets/profile image light.png'
import zainPortrait from '../assets/zain_transparent_background.png'
import type { Theme } from '../../../hooks/useTheme'
import styles from './HeroCard.module.css'

type HeroCardProps = {
  theme: Theme
}

export function HeroCard({ theme }: HeroCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const frameSrc = theme === 'dark' ? profileDark : profileLight

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let rafId = 0
    let hovering = false
    let targetRotY = 0
    let targetRotX = 0
    let currentRotY = 0
    let currentRotX = 0

    const applyTransform = () => {
      card.style.transform = `perspective(700px) rotateY(${currentRotY.toFixed(2)}deg) rotateX(${currentRotX.toFixed(2)}deg)`
    }

    const tick = () => {
      currentRotY += (targetRotY - currentRotY) * 0.14
      currentRotX += (targetRotX - currentRotX) * 0.14

      const settled =
        !hovering &&
        Math.abs(currentRotY) < 0.04 &&
        Math.abs(currentRotX) < 0.04 &&
        Math.abs(targetRotY) < 0.04 &&
        Math.abs(targetRotX) < 0.04

      if (settled) {
        currentRotY = 0
        currentRotX = 0
        card.style.transform = ''
        rafId = 0
        return
      }

      applyTransform()
      rafId = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      targetRotY = Math.max(-6, Math.min(6, dx * 6))
      targetRotX = Math.max(-6, Math.min(6, -dy * 6))
      startLoop()
    }

    const onEnter = () => {
      hovering = true
      card.addEventListener('mousemove', onMove, { passive: true })
      startLoop()
    }

    const onLeave = () => {
      hovering = false
      card.removeEventListener('mousemove', onMove)
      targetRotY = 0
      targetRotX = 0
      startLoop()
    }

    card.addEventListener('mouseenter', onEnter)
    card.addEventListener('mouseleave', onLeave)

    return () => {
      card.removeEventListener('mouseenter', onEnter)
      card.removeEventListener('mouseleave', onLeave)
      card.removeEventListener('mousemove', onMove)
      if (rafId) cancelAnimationFrame(rafId)
      card.style.transform = ''
    }
  }, [])

  return (
    <div ref={cardRef} className={styles.heroCard}>
      <svg className={styles.svgFilters} aria-hidden="true">
        <defs>
          <filter
            id="portrait-stroke"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="dilated" />
            <feFlood floodColor="#ffffff" result="white" />
            <feComposite in="white" in2="dilated" operator="in" result="outline" />
            <feMerge>
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <img className={styles.frame} src={frameSrc} alt="" decoding="async" />
      <div className={styles.scene}>
        <div className={styles.portraitWrap} aria-hidden="true">
          <div className={styles.portraitGlowLayer}>
            <img
              className={styles.portraitGlow}
              src={zainPortrait}
              alt=""
              decoding="async"
            />
          </div>
          <img
            className={styles.portrait}
            src={zainPortrait}
            alt=""
            decoding="async"
          />
        </div>
        <a
          className={styles.statusBar}
          href="/photon"
          aria-label="Learn more about Photon, a Mac app for your memories"
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <span className={styles.statusText}>
            recently built photon, an app to help find your memories!
          </span>
          <span className={styles.statusMore} aria-hidden="true">
            check it out →
          </span>
        </a>
      </div>
    </div>
  )
}
