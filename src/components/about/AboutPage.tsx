import { useEffect, useRef } from 'react'
import type { PageId } from '../../types'
import type { Theme } from '../../useTheme'
import { PixelSkyline } from './Background/PixelSkyline'
import { CursorTrail } from './effects/CursorTrail'
import { Hero } from './Hero/Hero'
import styles from './AboutPage.module.css'
import './about-tokens.css'

type AboutPageProps = {
  onNavigate: (page: PageId) => void
  theme: Theme
}

export function AboutPage({ onNavigate, theme }: AboutPageProps) {
  const flashRef = useRef<HTMLDivElement>(null)
  const prevTheme = useRef(theme)

  useEffect(() => {
    document.documentElement.classList.add('about-scroll')
    return () => {
      document.documentElement.classList.remove('about-scroll')
    }
  }, [])

  useEffect(() => {
    if (prevTheme.current !== theme) {
      const el = flashRef.current
      if (el) {
        el.classList.remove(styles.flashActive)
        void el.offsetWidth
        el.classList.add(styles.flashActive)
        const t = window.setTimeout(() => el.classList.remove(styles.flashActive), 200)
        return () => window.clearTimeout(t)
      }
    }
    prevTheme.current = theme
  }, [theme])

  return (
    <div className={`about-app ${styles.root}`} data-theme={theme}>
      <PixelSkyline />
      <CursorTrail />
      <div ref={flashRef} className={styles.flash} aria-hidden="true" />
      <main className={styles.main}>
        <Hero onNavigate={onNavigate} theme={theme} />
      </main>
    </div>
  )
}
