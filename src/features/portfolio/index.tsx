import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { prefersMobileLayout, useMobileLayout } from '@/shared/hooks/useMobileLayout'
import desktopStyles from './Desktop.module.css'
import { DESKTOP_ITEMS } from './desktopItems'
import type { DesktopFolderId, DesktopWindowId } from './desktopTypes'
import { DesktopApp } from './components/DesktopApp'
import { DesktopMenuBar } from './components/DesktopChrome'
import { HomeWidgets } from './components/HomeWidgets'
import { ProjectsMobileApp } from '@/features/projects/components/ProjectsMobileApp'
import { ProjectsWindowApp } from '@/features/projects/components/ProjectsWindowApp'
import { AboutMobileApp } from './components/AboutMobileApp'
import { DesktopWindow } from './components/DesktopWindow'
import { PhotographyMobileApp } from './components/PhotographyMobileApp'
import { PhotographyWindowApp } from './components/PhotographyWindowApp'
import { PortfolioPhoneLayout } from './components/PortfolioPhoneLayout'
import { VideoEditorApp } from './components/VideoEditorApp'
import { useWindowDrag } from './useWindowDrag'
import { usePortfolioTheme } from './usePortfolioTheme'
import {
  readPortfolioSession,
  patchPortfolioSession,
  type PortfolioSessionV1,
} from './portfolioSessionState'

export type { DesktopFolderId, DesktopWindowId } from './desktopTypes'

const CLOSED_WINDOWS: Record<DesktopWindowId, boolean> = {
  about: false,
  projects: false,
  photography: false,
}

const DESKTOP_DEFAULT_WINDOWS: Record<DesktopWindowId, boolean> = {
  about: true,
  projects: false,
  photography: false,
}

function getInitialUiState(): Pick<
  PortfolioSessionV1,
  'openWindows' | 'focusedWindow' | 'selectedFolder' | 'zOrder'
> {
  const session = readPortfolioSession()
  if (session) {
    return {
      openWindows: session.openWindows,
      focusedWindow: session.focusedWindow,
      selectedFolder: session.selectedFolder,
      zOrder: session.zOrder,
    }
  }

  if (prefersMobileLayout()) {
    return {
      openWindows: CLOSED_WINDOWS,
      focusedWindow: null,
      selectedFolder: null,
      zOrder: [],
    }
  }

  return {
    openWindows: DESKTOP_DEFAULT_WINDOWS,
    focusedWindow: 'about',
    selectedFolder: 'about',
    zOrder: ['about'],
  }
}

export function PortfolioPage() {
  const isPhone = useMobileLayout()
  const initialUi = useMemo(() => getInitialUiState(), [])
  const [openWindows, setOpenWindows] = useState<Record<DesktopWindowId, boolean>>(
    initialUi.openWindows,
  )
  const [focusedWindow, setFocusedWindow] = useState<DesktopWindowId | null>(
    initialUi.focusedWindow,
  )
  const [selectedFolder, setSelectedFolder] = useState<DesktopFolderId | null>(
    initialUi.selectedFolder,
  )
  const [zOrder, setZOrder] = useState<DesktopWindowId[]>(initialUi.zOrder)
  const layoutModeRef = useRef<boolean | null>(null)
  const desktopRef = useRef<HTMLDivElement>(null)
  const windowEntrancePlayedRef = useRef(false)
  const windowOpenDelayRef = useRef<Partial<Record<DesktopWindowId, number>>>({})
  const windowEntranceDoneRef = useRef<Record<DesktopWindowId, boolean>>({
    about: false,
    projects: false,
    photography: false,
  })
  const [windowEntranceDone, setWindowEntranceDone] = useState<
    Record<DesktopWindowId, boolean>
  >({
    about: false,
    projects: false,
    photography: false,
  })
  const { theme, setTheme } = usePortfolioTheme()

  const {
    draggingId,
    resizingId,
    setWindowRef,
    beginDrag,
    beginResize,
    getWindowStyle,
    minimizeWindow,
    toggleMaximize,
    restoreWindow,
    resetWindowState,
    isMinimized,
    isMaximized,
  } = useWindowDrag(desktopRef, openWindows)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      windowEntrancePlayedRef.current = true
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    patchPortfolioSession({
      openWindows,
      focusedWindow,
      selectedFolder,
      zOrder,
    })
  }, [openWindows, focusedWindow, selectedFolder, zOrder])

  useEffect(() => {
    if (layoutModeRef.current === null) {
      layoutModeRef.current = isPhone
      return
    }
    if (layoutModeRef.current === isPhone) return
    layoutModeRef.current = isPhone

    if (isPhone) {
      setOpenWindows(CLOSED_WINDOWS)
      setFocusedWindow(null)
      setSelectedFolder(null)
      setZOrder([])
      return
    }

    setOpenWindows((prev) => ({ ...DESKTOP_DEFAULT_WINDOWS, ...prev, about: true }))
    setFocusedWindow('about')
    setSelectedFolder('about')
    setZOrder(['about'])
  }, [isPhone])

  const activePhoneApp = useMemo(() => {
    if (!isPhone) return null
    return (['about', 'projects', 'photography'] as const).find((id) => openWindows[id]) ?? null
  }, [isPhone, openWindows])

  const aboutMobileContent = useMemo(() => <AboutMobileApp theme={theme} />, [theme])
  const projectsMobileContent = useMemo(() => <ProjectsMobileApp theme={theme} />, [theme])
  const photographyMobileContent = useMemo(
    () => <PhotographyMobileApp theme={theme} />,
    [theme],
  )

  const getZIndex = useCallback(
    (id: DesktopWindowId) => {
      const idx = zOrder.indexOf(id)
      return 20 + (idx === -1 ? 0 : idx)
    },
    [zOrder],
  )

  const markWindowEntranceDone = useCallback((id: DesktopWindowId) => {
    if (windowEntranceDoneRef.current[id]) return
    windowEntranceDoneRef.current[id] = true
    setWindowEntranceDone((prev) => ({ ...prev, [id]: true }))
  }, [])

  const focusWindow = useCallback(
    (id: DesktopWindowId) => {
      if (windowOpenDelayRef.current[id] !== undefined) {
        markWindowEntranceDone(id)
      }
      setFocusedWindow(id)
      setSelectedFolder(id)
      setZOrder((prev) => [...prev.filter((w) => w !== id), id])
    },
    [markWindowEntranceDone],
  )

  const openWindow = useCallback(
    (id: DesktopWindowId) => {
      setOpenWindows((prev) => ({ ...prev, [id]: true }))
      restoreWindow(id)
      focusWindow(id)
    },
    [focusWindow, restoreWindow],
  )

  const openPhoneApp = useCallback(
    (id: DesktopFolderId) => {
      setOpenWindows({ ...CLOSED_WINDOWS, [id]: true })
      focusWindow(id)
    },
    [focusWindow],
  )

  const closeWindow = useCallback(
    (id: DesktopWindowId) => {
      setOpenWindows((prev) => ({ ...prev, [id]: false }))
      resetWindowState(id)
      setFocusedWindow((current) => (current === id ? null : current))
      setZOrder((prev) => prev.filter((w) => w !== id))
      windowEntranceDoneRef.current[id] = false
      delete windowOpenDelayRef.current[id]
      setWindowEntranceDone((prev) => ({ ...prev, [id]: false }))
    },
    [resetWindowState],
  )

  const getOpeningDelay = useCallback((id: DesktopWindowId) => {
    const cached = windowOpenDelayRef.current[id]
    if (cached !== undefined) return cached

    const delay = windowEntrancePlayedRef.current
      ? 0
      : 180 + Math.max(0, zOrder.indexOf(id)) * 90
    windowOpenDelayRef.current[id] = delay
    return delay
  }, [zOrder])

  const handleMinimize = useCallback(
    (id: DesktopWindowId) => {
      minimizeWindow(id)
      setFocusedWindow((current) => {
        if (current !== id) return current
        const visible = zOrder.filter((w) => w !== id && openWindows[w] && !isMinimized(w))
        return visible.at(-1) ?? null
      })
    },
    [minimizeWindow, openWindows, zOrder, isMinimized],
  )

  useEffect(() => {
    const onDesktopClick = (e: MouseEvent) => {
      if (desktopRef.current && e.target === desktopRef.current) {
        setSelectedFolder(null)
      }
    }
    const el = desktopRef.current
    el?.addEventListener('mousedown', onDesktopClick)
    return () => el?.removeEventListener('mousedown', onDesktopClick)
  }, [])

  const renderWindow = (
    id: DesktopWindowId,
    className: string,
    content: ReactNode,
  ) => {
    if (!openWindows[id] || isMinimized(id)) return null

    const opening = !windowEntranceDone[id]
    const openingDelayMs = opening ? getOpeningDelay(id) : 0

    return (
      <DesktopWindow
        id={id}
        focused={focusedWindow === id}
        dragging={draggingId === id}
        resizing={resizingId === id}
        maximized={isMaximized(id)}
        resizable={!isMaximized(id)}
        opening={opening}
        openingDelayMs={openingDelayMs}
        className={className}
        style={getWindowStyle(id, getZIndex(id))}
        windowRef={setWindowRef(id)}
        onFocus={() => focusWindow(id)}
        onOpeningComplete={() => markWindowEntranceDone(id)}
        onResizeStart={(edge, e) => {
          focusWindow(id)
          beginResize(id, edge, e)
        }}
      >
        {content}
      </DesktopWindow>
    )
  }

  return (
    <div
      className={desktopStyles.desktop}
      data-portfolio-theme={theme}
      data-layout={isPhone ? 'ios' : 'mac'}
    >
      <div className={desktopStyles.wallpaper} aria-hidden />
      {!isPhone && <DesktopMenuBar theme={theme} onThemeChange={setTheme} />}

      <div className={desktopStyles.desktopSurface} ref={desktopRef}>
        {isPhone ? (
          <PortfolioPhoneLayout
            theme={theme}
            onThemeChange={setTheme}
            activeApp={activePhoneApp}
            onOpenApp={openPhoneApp}
            onCloseApp={closeWindow}
            aboutContent={aboutMobileContent}
            projectsContent={projectsMobileContent}
            photographyContent={photographyMobileContent}
          />
        ) : (
          <>
            <div className={desktopStyles.desktopWidgets}>
              <HomeWidgets variant="desktop" />
            </div>
            <div className={desktopStyles.desktopItems}>
              {DESKTOP_ITEMS.map((item) => (
                <DesktopApp
                  key={item.id}
                  label={item.label}
                  variant={item.variant}
                  selected={selectedFolder === item.id}
                  onSelect={() => setSelectedFolder(item.id)}
                  onOpen={() => openWindow(item.id)}
                />
              ))}
            </div>

            <div className={desktopStyles.windowsLayer}>
              {renderWindow(
                'about',
                desktopStyles.editorWindow,
                <VideoEditorApp
                  onClose={() => closeWindow('about')}
                  onMinimize={() => handleMinimize('about')}
                  onMaximize={() => toggleMaximize('about')}
                  isMaximized={isMaximized('about')}
                  onDragStart={(e) => {
                    focusWindow('about')
                    beginDrag('about', e)
                  }}
                />,
              )}

              {renderWindow(
                'projects',
                desktopStyles.projectsWindow,
                <ProjectsWindowApp
                  theme={theme}
                  onClose={() => closeWindow('projects')}
                  onMinimize={() => handleMinimize('projects')}
                  onMaximize={() => toggleMaximize('projects')}
                  isMaximized={isMaximized('projects')}
                  onDragStart={(e) => {
                    focusWindow('projects')
                    beginDrag('projects', e)
                  }}
                />,
              )}

              {renderWindow(
                'photography',
                desktopStyles.photographyWindow,
                <PhotographyWindowApp
                  theme={theme}
                  active={openWindows.photography && !isMinimized('photography')}
                  onClose={() => closeWindow('photography')}
                  onMinimize={() => handleMinimize('photography')}
                  onMaximize={() => toggleMaximize('photography')}
                  isMaximized={isMaximized('photography')}
                  onDragStart={(e) => {
                    focusWindow('photography')
                    beginDrag('photography', e)
                  }}
                />,
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
