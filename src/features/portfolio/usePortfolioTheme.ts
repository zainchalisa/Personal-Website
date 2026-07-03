import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { readSystemPortfolioTheme, type PortfolioTheme } from './portfolioTheme'
import { patchPortfolioSession, readPortfolioSession } from './portfolioSessionState'
import './portfolio-theme.css'

function applyPortfolioTheme(next: PortfolioTheme) {
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next

  const themeColor = next === 'dark' ? '#1a3a5c' : '#c7d4f0'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', themeColor)
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
