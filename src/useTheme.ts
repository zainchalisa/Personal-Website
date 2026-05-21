import { useEffect, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* private mode */
  }
  return null
}

function readSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveInitialTheme(): Theme {
  return readStoredTheme() ?? readSystemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readStoredTheme() !== null) return
      setTheme(mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }

    const apply = () => {
      flushSync(() => {
        setTheme(next)
      })
    }

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduceMotion && typeof document.startViewTransition === 'function') {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  return { theme, toggleTheme }
}
