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

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      const rotY = Math.max(-6, Math.min(6, dx * 6))
      const rotX = Math.max(-6, Math.min(6, -dy * 6))
      card.style.transform = `perspective(700px) rotateY(${rotY}deg) rotateX(${rotX}deg)`
    }

    const onEnter = () => {
      card.addEventListener('mousemove', onMove)
    }

    const onLeave = () => {
      card.removeEventListener('mousemove', onMove)
      card.style.transform = ''
    }

    card.addEventListener('mouseenter', onEnter)
    card.addEventListener('mouseleave', onLeave)

    return () => {
      card.removeEventListener('mouseenter', onEnter)
      card.removeEventListener('mouseleave', onLeave)
      card.removeEventListener('mousemove', onMove)
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
              className={styles.portraitGlowSoft}
              src={zainPortrait}
              alt=""
              decoding="async"
            />
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
