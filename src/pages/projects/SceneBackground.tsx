import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import lightBgUrl from './assets/environment/bg_lightmode.png'
import darkBgVolcanoUrl from './assets/environment/bg_volcano.png'
import {
  SCENE_TRANSITION_MS,
  applyFrame,
  lerpFrame,
  type SceneFrameState,
} from './sceneDayNightTransition'
import styles from './ProjectsGame.module.css'

const STAR_COUNT = 55

function starSize(): number {
  return Math.random() < 0.2 ? 2.5 : Math.random() < 0.5 ? 1.5 : 1
}

function createStars(): HTMLDivElement[] {
  const stars: HTMLDivElement[] = []
  for (let i = 0; i < STAR_COUNT; i++) {
    const el = document.createElement('div')
    el.className = styles.sceneStar
    const size = starSize()
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.top = `${Math.random() * 55}%`
    el.style.left = `${Math.random() * 100}%`
    const duration = 1.8 + Math.random() * 2.4
    el.style.animationDuration = `${duration}s`
    el.style.animationDelay = `${Math.random() * 2}s`
    stars.push(el)
  }
  return stars
}

export type SceneBackgroundHandle = {
  setScroll: (scrollPx: number) => void
  getNightProgress: () => number
  runTransition: (towardDark: boolean) => void
}

type SceneBackgroundProps = {
  theme: 'light' | 'dark'
  active: boolean
}

export const SceneBackground = forwardRef<SceneBackgroundHandle, SceneBackgroundProps>(
  function SceneBackground({ theme, active }, ref) {
    const rootRef = useRef<HTMLDivElement>(null)
    const parallaxRef = useRef<HTMLDivElement>(null)
    const bgDarkRef = useRef<HTMLDivElement>(null)
    const twilightRef = useRef<HTMLDivElement>(null)
    const starsRef = useRef<HTMLDivElement>(null)
    const moonRef = useRef<HTMLDivElement>(null)
    const lavaGlowRef = useRef<HTMLDivElement>(null)

    const animating = useRef(false)
    const rafId = useRef<number | null>(null)
    const towardDarkRef = useRef(theme === 'dark')
    const snapshotRef = useRef<SceneFrameState | null>(null)
    const lastFrameRef = useRef<SceneFrameState | null>(null)
    const nightProgressRef = useRef(theme === 'dark' ? 1 : 0)
    const starElsRef = useRef<HTMLDivElement[]>([])
    const scrollRef = useRef(0)
    const tileWidthRef = useRef(0)

    const lavaPulseRef = useRef(theme === 'dark')
    const [lavaPulse, setLavaPulse] = useState(theme === 'dark')

    const writeFrame = useCallback((frame: SceneFrameState) => {
      lastFrameRef.current = frame
      nightProgressRef.current = frame.darkBgOpacity

      if (bgDarkRef.current) bgDarkRef.current.style.opacity = String(frame.darkBgOpacity)
      if (twilightRef.current) twilightRef.current.style.opacity = String(frame.twilightOpacity)
      if (moonRef.current) {
        moonRef.current.style.opacity = String(frame.moonOpacity)
        moonRef.current.style.transform = `translateY(${frame.moonTranslateY}px)`
      }
      if (lavaGlowRef.current) {
        lavaGlowRef.current.style.setProperty('--glow-base', String(frame.lavaGlowOpacity))
        if (lavaPulseRef.current) {
          lavaGlowRef.current.style.opacity = ''
        } else {
          lavaGlowRef.current.style.opacity = String(frame.lavaGlowOpacity)
        }
      }

      const stars = starElsRef.current
      const total = stars.length || STAR_COUNT
      stars.forEach((star, i) => {
        const visible = frame.starsProgress > i / total
        star.style.opacity = visible ? '' : '0'
      })
    }, [])

    const snapToTheme = useCallback(
      (towardDark: boolean) => {
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current)
          rafId.current = null
        }
        animating.current = false
        snapshotRef.current = null
        towardDarkRef.current = towardDark
        lavaPulseRef.current = towardDark
        setLavaPulse(towardDark)
        writeFrame(applyFrame(1, towardDark))
      },
      [writeFrame],
    )

    const finishTransition = useCallback(
      (towardDark: boolean) => {
        snapToTheme(towardDark)
      },
      [snapToTheme],
    )

    const runTransition = useCallback(
      (towardDark: boolean) => {
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current)
          snapshotRef.current = lastFrameRef.current
        } else {
          snapshotRef.current = null
        }

        towardDarkRef.current = towardDark
        animating.current = true
        lavaPulseRef.current = false
        setLavaPulse(false)
        const startTime = performance.now()
        const endFrame = applyFrame(1, towardDark)

        const tick = (now: number) => {
          const t = Math.min(1, (now - startTime) / SCENE_TRANSITION_MS)
          let frame = applyFrame(t, towardDark)

          if (snapshotRef.current) {
            frame = lerpFrame(snapshotRef.current, endFrame, t)
          }

          writeFrame(frame)

          if (t < 1) {
            rafId.current = requestAnimationFrame(tick)
            return
          }

          finishTransition(towardDark)
        }

        rafId.current = requestAnimationFrame(tick)
      },
      [finishTransition, writeFrame],
    )

    useImperativeHandle(
      ref,
      () => ({
        setScroll: (scrollPx: number) => {
          scrollRef.current = scrollPx
          if (!parallaxRef.current) return
          const w = tileWidthRef.current
          if (w <= 0) {
            parallaxRef.current.style.transform = `translateX(${-scrollPx}px)`
            return
          }
          const x = -((scrollPx % w) + w) % w
          parallaxRef.current.style.transform = `translateX(${x}px)`
        },
        getNightProgress: () => nightProgressRef.current,
        runTransition,
      }),
      [runTransition],
    )

    useLayoutEffect(() => {
      const starsContainer = starsRef.current
      if (!starsContainer || starElsRef.current.length > 0) return
      const stars = createStars()
      starElsRef.current = stars
      stars.forEach((s) => starsContainer.appendChild(s))
    }, [])

    useLayoutEffect(() => {
      const root = rootRef.current
      if (!root) return

      const measure = () => {
        const h = root.clientHeight
        if (h <= 0) return
        const img = new Image()
        img.src = lightBgUrl
        const apply = () => {
          if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return
          tileWidthRef.current = (img.naturalWidth / img.naturalHeight) * h
        }
        if (img.complete) apply()
        else img.onload = apply
      }

      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(root)
      return () => ro.disconnect()
    }, [])

    useEffect(() => {
      return () => {
        if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      }
    }, [])

    const prevThemeRef = useRef(theme)

    useLayoutEffect(() => {
      const towardDark = theme === 'dark'
      writeFrame(applyFrame(1, towardDark))
      lavaPulseRef.current = towardDark
      setLavaPulse(towardDark)
    }, [writeFrame])

    useEffect(() => {
      const towardDark = theme === 'dark'

      if (!active) {
        prevThemeRef.current = theme
        snapToTheme(towardDark)
        return
      }

      if (prevThemeRef.current === theme) return
      prevThemeRef.current = theme
      runTransition(towardDark)
    }, [theme, active, runTransition, snapToTheme])

    useEffect(() => {
      if (!active) return
      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        const towardDark = theme === 'dark'
        if (rafId.current !== null) cancelAnimationFrame(rafId.current)
        animating.current = false
        snapshotRef.current = null
        finishTransition(towardDark)
      }
    }, [theme, active, finishTransition])

    const initialNight = theme === 'dark'

    return (
      <div ref={rootRef} className={styles.sceneBg} aria-hidden>
        <div ref={parallaxRef} className={styles.sceneBgParallax}>
          <div
            className={styles.sceneBgLight}
            style={{ backgroundImage: `url(${lightBgUrl})` }}
          />
          <div
            ref={bgDarkRef}
            className={styles.sceneBgDark}
            style={{
              backgroundImage: `url(${darkBgVolcanoUrl})`,
              opacity: initialNight ? 1 : 0,
            }}
          />
          <div ref={twilightRef} className={styles.sceneTwilight} style={{ opacity: 0 }} />
          <div ref={starsRef} className={styles.sceneStars} />
          <div
            ref={moonRef}
            className={styles.sceneMoon}
            style={{
              opacity: initialNight ? 1 : 0,
              transform: initialNight ? 'translateY(0)' : 'translateY(-30px)',
            }}
          />
          <div
            ref={lavaGlowRef}
            className={`${styles.sceneLavaGlow} ${lavaPulse ? styles.sceneLavaGlowPulse : ''}`}
            style={{ opacity: initialNight ? 1 : 0, ['--glow-base' as string]: initialNight ? 1 : 0 }}
          />
        </div>
      </div>
    )
  },
)
