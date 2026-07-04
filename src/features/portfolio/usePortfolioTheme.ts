import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { readSystemPortfolioTheme, type PortfolioTheme } from './portfolioTheme'
import { patchPortfolioSession, readPortfolioSession } from './portfolioSessionState'
import './portfolio-theme.css'

const LEGACY_THEME_STORAGE_KEY = 'theme'

function applyPortfolioTheme(next: PortfolioTheme) {
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next

  // Note: Safari 26+ ignores theme-color entirely and derives the browser-chrome tint from the
  // <body> background-color (see portfolio-theme.css). This meta is kept in sync for Android
  // Chrome and older iOS which still honor it.
  const themeColor = next === 'dark' ? '#1c3356' : '#cfcce8'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', themeColor)
}

function resolveInitialPortfolioTheme(): PortfolioTheme {
  const saved = readPortfolioSession()?.theme
  if (saved === 'light' || saved === 'dark') return saved
  return readSystemPortfolioTheme()
}

export function usePortfolioTheme() {
  const [theme, setThemeState] = useState<PortfolioTheme>(() => {
    const initial = resolveInitialPortfolioTheme()
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
    const next = readSystemPortfolioTheme()
    setThemeState(next)
    applyPortfolioTheme(next)
  }, [])

  useLayoutEffect(() => {
    applyPortfolioTheme(theme)
  }, [theme])

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    } catch {
      /* private mode */
    }
  }, [])

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
