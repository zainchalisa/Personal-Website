import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  THEME_TRANSITION_MS,
  easeInOutQuad,
  type Theme,
  type ThemeTransition,
} from './themeTransition'

export type { Theme } from './themeTransition'

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

type ThemeContextValue = {
  theme: Theme
  themeTransition: ThemeTransition | null
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)
  const [themeTransition, setThemeTransition] = useState<ThemeTransition | null>(null)
  const rafRef = useRef(0)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.documentElement.toggleAttribute('data-theme-transitioning', themeTransition?.active ?? false)
  }, [theme, themeTransition?.active])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readStoredTheme() !== null) return
      setThemeTransition(null)
      setTheme(mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      setThemeTransition(null)
      setTheme(next)
      return
    }

    cancelAnimationFrame(rafRef.current)
    const from = theme
    const start = performance.now()

    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setTheme(next)
    setThemeTransition({ from, to: next, progress: 0, active: true })

    const tick = (now: number) => {
      const linear = Math.min(1, (now - start) / THEME_TRANSITION_MS)
      const progress = easeInOutQuad(linear)

      if (linear < 1) {
        setThemeTransition({ from, to: next, progress, active: true })
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      setThemeTransition(null)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [theme])

  return createElement(
    ThemeContext.Provider,
    { value: { theme, themeTransition, toggleTheme } },
    children,
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
