import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { readSystemPortfolioTheme, type PortfolioTheme } from './portfolioTheme'
import { patchPortfolioSession, readPortfolioSession } from './portfolioSessionState'
import './portfolio-theme.css'

function applyPortfolioTheme(next: PortfolioTheme) {
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next

  const themeColor = next === 'dark' ? '#1c3356' : '#cfcce8'
  // iOS Safari reads theme-color at load and frequently ignores in-place content
  // mutations. Removing the existing node(s) and inserting a fresh one forces a re-read
  // so the status bar / toolbar re-tint when the user toggles themes.
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove())
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', themeColor)
  document.head.appendChild(meta)
}

export function usePortfolioTheme() {
  const [theme, setThemeState] = useState<PortfolioTheme>(() => {
    const saved = readPortfolioSession()?.theme
    const initial = saved ?? readSystemPortfolioTheme()
    applyPortfolioTheme(initial)
    return initial
  })

  const setTheme = useCallback((next: PortfolioTheme) => {
    const apply = () => {
      setThemeState(next)
      patchPortfolioSession({ theme: next })
    }

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || typeof document.startViewTransition !== 'function') {
      apply()
      return
    }

    document.startViewTransition(apply)
  }, [])

  const syncSystemTheme = useCallback(() => {
    if (readPortfolioSession()?.theme) return
    setThemeState(readSystemPortfolioTheme())
  }, [])

  useLayoutEffect(() => {
    applyPortfolioTheme(theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      syncSystemTheme()
    }

    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [syncSystemTheme])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSystemTheme()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [syncSystemTheme])

  return { theme, setTheme }
}
