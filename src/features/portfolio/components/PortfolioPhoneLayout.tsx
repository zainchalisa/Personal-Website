import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from 'react'
import type { PortfolioTheme } from '../portfolioTheme'
import type { DesktopFolderId, DesktopWindowId } from '../desktopTypes'
import { IOS_APP_TITLES } from '../desktopItems'
import {
  IOS_APP_CLOSE_MS,
  IOS_APP_OPEN_MS,
  measureIconOrigin,
  type AppTransitionPhase,
  type IconOrigin,
} from '../iosAppTransition'
import iosStyles from '../IosLayout.module.css'
import { IosAppPush } from './IosAppPush'
import { IosAppShellContext } from './IosAppShellContext'
import { IosDock } from './IosDock'
import { IosHomeScreen } from './IosHomeScreen'
import { IosStatusBar } from './IosStatusBar'

type PortfolioPhoneLayoutProps = {
  theme: PortfolioTheme
  onThemeChange: (theme: PortfolioTheme) => void
  activeApp: DesktopWindowId | null
  onOpenApp: (id: DesktopFolderId) => void
  onCloseApp: (id: DesktopWindowId) => void
  aboutContent: ReactNode
  projectsContent: ReactNode
  photographyContent: ReactNode
}

export function PortfolioPhoneLayout({
  theme,
  onThemeChange,
  activeApp,
  onOpenApp,
  onCloseApp,
  aboutContent,
  projectsContent,
  photographyContent,
}: PortfolioPhoneLayoutProps) {
  const phoneRootRef = useRef<HTMLDivElement>(null)
  const openSourceRef = useRef<HTMLElement | null>(null)
  const iconRegistryRef = useRef<Map<DesktopFolderId, HTMLElement>>(new Map())
  const shellAppRef = useRef<DesktopWindowId | null>(null)
  const phaseRef = useRef<AppTransitionPhase>('idle')
  const contentReadyRef = useRef(false)
  const closeTimerRef = useRef<number | null>(null)
  const openFrameRef = useRef<number | null>(null)
  const openTimerRef = useRef<number | null>(null)
  const contentTimerRef = useRef<number | null>(null)
  const closingAppRef = useRef<DesktopWindowId | null>(null)
  const skipNextActiveSyncRef = useRef(false)
  const restoredOnMountRef = useRef(false)

  const [shellApp, setShellApp] = useState<DesktopWindowId | null>(null)
  const [parkedApp, setParkedApp] = useState<DesktopWindowId | null>(null)
  const [phase, setPhase] = useState<AppTransitionPhase>('idle')
  const [contentReady, setContentReady] = useState(false)
  const [animateContentReveal, setAnimateContentReveal] = useState(false)
  const [origin, setOrigin] = useState<IconOrigin>({ x: 195, y: 720, scale: 0.5 })

  shellAppRef.current = shellApp
  phaseRef.current = phase
  contentReadyRef.current = contentReady

  const clearOpenTimers = useCallback(() => {
    if (openFrameRef.current !== null) {
      cancelAnimationFrame(openFrameRef.current)
      openFrameRef.current = null
    }
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  const clearContentTimer = useCallback(() => {
    if (contentTimerRef.current !== null) {
      window.clearTimeout(contentTimerRef.current)
      contentTimerRef.current = null
    }
  }, [])

  const revealAppContent = useCallback(() => {
    if (contentReadyRef.current) return
    clearContentTimer()
    setContentReady(true)
  }, [clearContentTimer])

  const scheduleContentReveal = useCallback(() => {
    clearContentTimer()
    contentTimerRef.current = window.setTimeout(() => {
      contentTimerRef.current = null
      revealAppContent()
    }, IOS_APP_OPEN_MS + 48)
  }, [clearContentTimer, revealAppContent])

  const registerIcon = useCallback((id: DesktopFolderId, el: HTMLElement | null) => {
    if (el) {
      iconRegistryRef.current.set(id, el)
      return
    }
    iconRegistryRef.current.delete(id)
  }, [])

  const resolveIconElement = useCallback(
    (id: DesktopFolderId) =>
      openSourceRef.current ?? iconRegistryRef.current.get(id) ?? null,
    [],
  )

  const measureOrigin = useCallback((id: DesktopFolderId) => {
    const container = phoneRootRef.current
    const iconEl = resolveIconElement(id)
    return measureIconOrigin(iconEl, container)
  }, [resolveIconElement])

  const finishClose = useCallback(
    (closingApp: DesktopWindowId) => {
      if (closingAppRef.current !== closingApp) return
      closingAppRef.current = null

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      clearOpenTimers()
      clearContentTimer()
      onCloseApp(closingApp)
      setParkedApp(closingApp)
      setShellApp(null)
      setPhase('idle')
      openSourceRef.current = null
    },
    [clearContentTimer, clearOpenTimers, onCloseApp],
  )

  const beginOpening = useCallback(
    (id: DesktopFolderId) => {
      const isWarmReopen = parkedApp === id && contentReadyRef.current

      clearOpenTimers()
      clearContentTimer()
      if (!isWarmReopen) {
        setContentReady(false)
        setAnimateContentReveal(true)
        setParkedApp(null)
      } else {
        setAnimateContentReveal(false)
        setParkedApp(null)
      }
      setOrigin(measureOrigin(id))
      setShellApp(id)
      setPhase('opening')

      if (isWarmReopen) {
        setContentReady(true)
        openFrameRef.current = requestAnimationFrame(() => {
          openFrameRef.current = requestAnimationFrame(() => {
            openFrameRef.current = null
            if (phaseRef.current === 'opening') {
              setPhase('open')
            }
          })
        })

        openTimerRef.current = window.setTimeout(() => {
          openTimerRef.current = null
          if (phaseRef.current === 'opening') {
            setPhase('open')
          }
        }, IOS_APP_OPEN_MS + 32)
        return
      }

      openFrameRef.current = requestAnimationFrame(() => {
        openFrameRef.current = requestAnimationFrame(() => {
          openFrameRef.current = null
          if (phaseRef.current === 'opening') {
            setPhase('open')
            scheduleContentReveal()
          }
        })
      })

      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null
        if (phaseRef.current === 'opening') {
          setPhase('open')
          scheduleContentReveal()
        }
      }, IOS_APP_OPEN_MS + 32)
    },
    [clearContentTimer, clearOpenTimers, measureOrigin, parkedApp, scheduleContentReveal],
  )

  const openAppInstant = useCallback(
    (id: DesktopFolderId) => {
      clearOpenTimers()
      clearContentTimer()
      setAnimateContentReveal(false)
      setOrigin(measureOrigin(id))
      setShellApp(id)
      setPhase('open')
      setContentReady(true)
    },
    [clearContentTimer, clearOpenTimers, measureOrigin],
  )

  const handleOpenApp = useCallback(
    (id: DesktopFolderId, sourceEl?: HTMLElement | null) => {
      if (phaseRef.current === 'opening' || phaseRef.current === 'closing') return
      openSourceRef.current = sourceEl ?? iconRegistryRef.current.get(id) ?? null
      skipNextActiveSyncRef.current = true
      beginOpening(id)
      startTransition(() => onOpenApp(id))
    },
    [beginOpening, onOpenApp],
  )

  useEffect(() => {
    if (!restoredOnMountRef.current) {
      restoredOnMountRef.current = true
      if (activeApp) {
        openAppInstant(activeApp)
      }
      return
    }

    if (!activeApp) {
      if (phaseRef.current !== 'closing') {
        clearOpenTimers()
        clearContentTimer()
        setShellApp(null)
        setPhase('idle')
      }
      return
    }

    if (skipNextActiveSyncRef.current) {
      skipNextActiveSyncRef.current = false
      return
    }

    if (shellAppRef.current === activeApp && phaseRef.current !== 'idle') {
      return
    }

    openAppInstant(activeApp)
  }, [activeApp, clearContentTimer, clearOpenTimers, openAppInstant])

  const requestClose = useCallback(() => {
    const app = shellAppRef.current
    const currentPhase = phaseRef.current
    if (!app || currentPhase === 'closing' || currentPhase === 'opening') return

    closingAppRef.current = app
    setOrigin(measureOrigin(app))
    setPhase('closing')

    closeTimerRef.current = window.setTimeout(() => {
      finishClose(app)
    }, IOS_APP_CLOSE_MS + 32)
  }, [finishClose, measureOrigin])

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') return

      if (phaseRef.current === 'open' && event.propertyName === 'transform') {
        revealAppContent()
        return
      }

      if (phaseRef.current !== 'closing') return

      const app = shellAppRef.current
      if (app) finishClose(app)
    },
    [finishClose, revealAppContent],
  )

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
      clearOpenTimers()
      clearContentTimer()
    },
    [clearContentTimer, clearOpenTimers],
  )

  const hostApp = shellApp ?? parkedApp

  const appContent = useMemo(() => {
    if (!hostApp) return null
    if (hostApp === 'about') return aboutContent
    if (hostApp === 'projects') return projectsContent
    if (hostApp === 'photography') return photographyContent
    return null
  }, [aboutContent, hostApp, photographyContent, projectsContent])

  const isParked = shellApp === null && parkedApp !== null

  const homeState =
    phase === 'closing' ? 'revealing' : shellApp ? 'obscured' : 'idle'

  const closeLocked = phase === 'opening' || phase === 'closing'

  const shellContext = useMemo(
    () => ({ requestClose, closeLocked }),
    [closeLocked, requestClose],
  )

  const transitionStyle: CSSProperties = {
    '--tx-origin-x': `${origin.x}px`,
    '--tx-origin-y': `${origin.y}px`,
    '--tx-icon-scale': String(origin.scale),
  } as CSSProperties

  const contentShellClass = [
    iosStyles.appPushContentReady,
    !contentReady ? iosStyles.appPushContentHidden : '',
    contentReady && animateContentReveal ? iosStyles.appPushContentReveal : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <IosAppShellContext.Provider value={shellContext}>
      <div ref={phoneRootRef} className={iosStyles.phoneRoot}>
        <div
          className={`${iosStyles.homeLayer}${homeState !== 'idle' ? ` ${iosStyles.homeLayerObscured}` : ''}${homeState === 'revealing' ? ` ${iosStyles.homeLayerRevealing}` : ''}`}
          aria-hidden={shellApp !== null && phase === 'open'}
        >
          <IosStatusBar theme={theme} onThemeChange={onThemeChange} />
          <IosHomeScreen onOpenApp={handleOpenApp} registerIcon={registerIcon} />
          <IosDock onOpenApp={handleOpenApp} registerIcon={registerIcon} />
        </div>

        {hostApp ? (
          <div
            className={`${iosStyles.appShellOverlay}${isParked ? ` ${iosStyles.appShellOverlayParked}` : ''}`}
          >
            <div
              className={`${iosStyles.appTransitionLayer}${phase === 'opening' ? ` ${iosStyles.appTransitionOpening}` : ''}${phase === 'open' ? ` ${iosStyles.appTransitionOpen}` : ''}${phase === 'closing' ? ` ${iosStyles.appTransitionClosing}` : ''}`}
              style={transitionStyle}
              onTransitionEnd={handleTransitionEnd}
            >
              <IosAppPush
                title={hostApp === 'about' ? '' : IOS_APP_TITLES[hostApp]}
                hideNav={hostApp === 'about' || hostApp === 'photography' || hostApp === 'projects'}
                theme={theme}
                onThemeChange={onThemeChange}
                onClose={requestClose}
                closeDisabled={closeLocked}
              >
                {hostApp && appContent ? (
                  <div className={contentShellClass} aria-hidden={!contentReady}>
                    {appContent}
                  </div>
                ) : (
                  <div className={iosStyles.appPushPlaceholder} aria-hidden />
                )}
              </IosAppPush>
            </div>
          </div>
        ) : null}
      </div>
    </IosAppShellContext.Provider>
  )
}
