import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { DesktopWindowId, ResizeEdge } from './desktopTypes'
import { getWindowMinSize } from './windowConstraints'
import { patchPortfolioSession, readPortfolioSession } from './portfolioSessionState'

export type WindowPosition = { x: number; y: number }

type WindowSize = { width: number; height: number }

type WindowRestoreState = WindowPosition & WindowSize

type DragState = {
  id: DesktopWindowId
  startX: number
  startY: number
  origX: number
  origY: number
}

type ResizeState = {
  id: DesktopWindowId
  edge: ResizeEdge
  startX: number
  startY: number
  origX: number
  origY: number
  origW: number
  origH: number
}

const MIN_VISIBLE = 56

function getMinSize(id: DesktopWindowId): WindowSize {
  return getWindowMinSize(id)
}

function applyResize(
  edge: ResizeEdge,
  origX: number,
  origY: number,
  origW: number,
  origH: number,
  dx: number,
  dy: number,
  minW: number,
  minH: number,
  boundsW: number,
  boundsH: number,
): WindowRestoreState {
  let x = origX
  let y = origY
  let w = origW
  let h = origH

  if (edge.includes('e')) w = origW + dx
  if (edge.includes('w')) {
    w = origW - dx
    x = origX + dx
  }
  if (edge.includes('s')) h = origH + dy
  if (edge.includes('n')) {
    h = origH - dy
    y = origY + dy
  }

  if (w < minW) {
    if (edge.includes('w')) x -= minW - w
    w = minW
  }
  if (h < minH) {
    if (edge.includes('n')) y -= minH - h
    h = minH
  }

  if (edge.includes('w')) x = origX + origW - w
  if (edge.includes('n')) y = origY + origH - h

  if (x < 0) {
    w += x
    x = 0
  }
  if (y < 0) {
    h += y
    y = 0
  }
  if (x + w > boundsW) w = boundsW - x
  if (y + h > boundsH) h = boundsH - y

  w = Math.max(minW, w)
  h = Math.max(minH, h)

  if (x + w > boundsW) x = Math.max(0, boundsW - w)
  if (y + h > boundsH) y = Math.max(0, boundsH - h)

  return { x, y, width: w, height: h }
}

function clampPosition(
  x: number,
  y: number,
  windowW: number,
  _windowH: number,
  boundsW: number,
  boundsH: number,
): WindowPosition {
  return {
    x: Math.max(-windowW + MIN_VISIBLE, Math.min(boundsW - MIN_VISIBLE, x)),
    y: Math.max(0, Math.min(boundsH - MIN_VISIBLE, y)),
  }
}

function getDefaultPosition(
  id: DesktopWindowId,
  boundsW: number,
  boundsH: number,
  windowW: number,
  windowH: number,
): WindowPosition {
  switch (id) {
    case 'about':
      return clampPosition(
        (boundsW - windowW) / 2,
        (boundsH - windowH) / 2,
        windowW,
        windowH,
        boundsW,
        boundsH,
      )
    case 'projects':
      return clampPosition(
        boundsW * 0.08,
        boundsH * 0.12,
        windowW,
        windowH,
        boundsW,
        boundsH,
      )
    case 'photography':
      return clampPosition(
        boundsW * 0.92 - windowW,
        boundsH * 0.18,
        windowW,
        windowH,
        boundsW,
        boundsH,
      )
  }
}

function getBoundsSize(desktopRef: RefObject<HTMLDivElement | null>): WindowSize | null {
  const bounds = desktopRef.current
  if (!bounds) return null
  return { width: bounds.clientWidth, height: bounds.clientHeight }
}

export function useWindowDrag(
  desktopRef: RefObject<HTMLDivElement | null>,
  openWindows: Record<DesktopWindowId, boolean>,
) {
  const savedWindows = readPortfolioSession()?.windows
  const [positions, setPositions] = useState<Partial<Record<DesktopWindowId, WindowPosition>>>(
    () => savedWindows?.positions ?? {},
  )
  const [sizes, setSizes] = useState<Partial<Record<DesktopWindowId, WindowSize>>>(
    () => savedWindows?.sizes ?? {},
  )
  const [minimized, setMinimized] = useState<Partial<Record<DesktopWindowId, boolean>>>(
    () => savedWindows?.minimized ?? {},
  )
  const [maximized, setMaximized] = useState<Partial<Record<DesktopWindowId, boolean>>>(
    () => savedWindows?.maximized ?? {},
  )
  const [restoreState, setRestoreState] = useState<
    Partial<Record<DesktopWindowId, WindowRestoreState>>
  >({})
  const [draggingId, setDraggingId] = useState<DesktopWindowId | null>(null)
  const [resizingId, setResizingId] = useState<DesktopWindowId | null>(null)
  const windowRefs = useRef<Partial<Record<DesktopWindowId, HTMLDivElement>>>({})
  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)

  const setWindowRef = useCallback(
    (id: DesktopWindowId) => (el: HTMLDivElement | null) => {
      if (el) windowRefs.current[id] = el
      else delete windowRefs.current[id]
    },
    [],
  )

  const readWindowRect = useCallback(
    (id: DesktopWindowId): WindowRestoreState | null => {
      const win = windowRefs.current[id]
      const bounds = desktopRef.current
      if (!win || !bounds) return null

      const boundsRect = bounds.getBoundingClientRect()
      const winRect = win.getBoundingClientRect()
      return {
        x: winRect.left - boundsRect.left,
        y: winRect.top - boundsRect.top,
        width: win.offsetWidth,
        height: win.offsetHeight,
      }
    },
    [desktopRef],
  )

  const syncWindowRect = useCallback(
    (id: DesktopWindowId): WindowRestoreState | null => {
      const rect = readWindowRect(id)
      if (!rect) return null
      setPositions((prev) => ({ ...prev, [id]: { x: rect.x, y: rect.y } }))
      setSizes((prev) => ({ ...prev, [id]: { width: rect.width, height: rect.height } }))
      return rect
    },
    [readWindowRect],
  )

  const initPosition = useCallback(
    (id: DesktopWindowId) => {
      if (positions[id]) return

      const win = windowRefs.current[id]
      const bounds = desktopRef.current
      if (!win || !bounds) return

      const boundsRect = bounds.getBoundingClientRect()
      const pos = getDefaultPosition(
        id,
        boundsRect.width,
        boundsRect.height,
        win.offsetWidth,
        win.offsetHeight,
      )
      setPositions((prev) => ({ ...prev, [id]: pos }))
      setSizes((prev) => ({
        ...prev,
        [id]: { width: win.offsetWidth, height: win.offsetHeight },
      }))
    },
    [desktopRef, positions],
  )

  const readPosition = useCallback(
    (id: DesktopWindowId): WindowPosition | null => {
      if (positions[id]) return positions[id]!
      const rect = readWindowRect(id)
      return rect ? { x: rect.x, y: rect.y } : null
    },
    [positions, readWindowRect],
  )

  useLayoutEffect(() => {
    for (const id of Object.keys(openWindows) as DesktopWindowId[]) {
      if (openWindows[id] && !positions[id] && !maximized[id]) {
        initPosition(id)
      }
    }
  }, [openWindows, positions, maximized, initPosition])

  useEffect(() => {
    patchPortfolioSession({
      windows: { positions, sizes, minimized, maximized },
    })
  }, [positions, sizes, minimized, maximized])

  const resetWindowState = useCallback((id: DesktopWindowId) => {
    setMinimized((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setMaximized((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setRestoreState((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const minimizeWindow = useCallback((id: DesktopWindowId) => {
    setMinimized((prev) => ({ ...prev, [id]: true }))
    setMaximized((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const restoreWindow = useCallback((id: DesktopWindowId) => {
    setMinimized((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const toggleMaximize = useCallback(
    (id: DesktopWindowId) => {
      if (minimized[id]) {
        restoreWindow(id)
        return
      }

      if (maximized[id]) {
        const saved = restoreState[id]
        if (saved) {
          setPositions((prev) => ({ ...prev, [id]: { x: saved.x, y: saved.y } }))
          setSizes((prev) => ({ ...prev, [id]: { width: saved.width, height: saved.height } }))
        }
        setMaximized((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        return
      }

      const win = windowRefs.current[id]
      const boundsSize = getBoundsSize(desktopRef)
      if (!win || !boundsSize) return

      const pos = readPosition(id) ?? { x: 0, y: 0 }
      setRestoreState((prev) => ({
        ...prev,
        [id]: {
          x: pos.x,
          y: pos.y,
          width: win.offsetWidth,
          height: win.offsetHeight,
        },
      }))
      setPositions((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }))
      setSizes((prev) => ({
        ...prev,
        [id]: { width: boundsSize.width, height: boundsSize.height },
      }))
      setMaximized((prev) => ({ ...prev, [id]: true }))
    },
    [desktopRef, maximized, minimized, readPosition, restoreState, restoreWindow],
  )

  const beginResize = useCallback(
    (id: DesktopWindowId, edge: ResizeEdge, e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if (minimized[id] || maximized[id]) return

      const rect = syncWindowRect(id)
      if (!rect) return

      resizeRef.current = {
        id,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origX: rect.x,
        origY: rect.y,
        origW: rect.width,
        origH: rect.height,
      }
      setResizingId(id)
      e.currentTarget.setPointerCapture(e.pointerId)
      e.preventDefault()
      e.stopPropagation()
    },
    [maximized, minimized, syncWindowRect],
  )

  const beginDrag = useCallback(
    (id: DesktopWindowId, e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return
      if (minimized[id]) return
      if (maximized[id]) return

      const bounds = desktopRef.current
      const win = windowRefs.current[id]
      if (!bounds || !win) return

      const current = readPosition(id)
      if (!current) return

      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: current.x,
        origY: current.y,
      }
      setDraggingId(id)
      setPositions((prev) => ({ ...prev, [id]: current }))
      e.currentTarget.setPointerCapture(e.pointerId)
      e.preventDefault()
    },
    [desktopRef, maximized, minimized, readPosition],
  )

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (drag) {
        const bounds = desktopRef.current
        const win = windowRefs.current[drag.id]
        if (!bounds || !win) return

        const boundsRect = bounds.getBoundingClientRect()
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const next = clampPosition(
          drag.origX + dx,
          drag.origY + dy,
          win.offsetWidth,
          win.offsetHeight,
          boundsRect.width,
          boundsRect.height,
        )

        setPositions((prev) => ({ ...prev, [drag.id]: next }))
        return
      }

      const resize = resizeRef.current
      if (resize) {
        const bounds = desktopRef.current
        if (!bounds) return

        const boundsRect = bounds.getBoundingClientRect()
        const { width: minWidth, height: minHeight } = getMinSize(resize.id)
        const dx = e.clientX - resize.startX
        const dy = e.clientY - resize.startY
        const next = applyResize(
          resize.edge,
          resize.origX,
          resize.origY,
          resize.origW,
          resize.origH,
          dx,
          dy,
          minWidth,
          minHeight,
          boundsRect.width,
          boundsRect.height,
        )

        setPositions((prev) => ({ ...prev, [resize.id]: { x: next.x, y: next.y } }))
        setSizes((prev) => ({
          ...prev,
          [resize.id]: { width: next.width, height: next.height },
        }))
      }
    }

    const onPointerUp = () => {
      dragRef.current = null
      resizeRef.current = null
      setDraggingId(null)
      setResizingId(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [desktopRef])

  useEffect(() => {
    const bounds = desktopRef.current
    if (!bounds) return

    const syncMaximizedSize = () => {
      const boundsSize = getBoundsSize(desktopRef)
      if (!boundsSize) return
      setSizes((prev) => {
        let changed = false
        const next = { ...prev }
        for (const id of Object.keys(maximized) as DesktopWindowId[]) {
          if (maximized[id]) {
            next[id] = boundsSize
            changed = true
          }
        }
        return changed ? next : prev
      })
    }

    const observer = new ResizeObserver(syncMaximizedSize)
    observer.observe(bounds)
    return () => observer.disconnect()
  }, [desktopRef, maximized])

  const getWindowStyle = useCallback(
    (id: DesktopWindowId, zIndex: number): CSSProperties => {
      if (maximized[id]) {
        const boundsSize = getBoundsSize(desktopRef)
        return {
          left: 0,
          top: 0,
          transform: 'none',
          width: boundsSize?.width ?? sizes[id]?.width,
          height: boundsSize?.height ?? sizes[id]?.height,
          zIndex,
          maxWidth: 'none',
          maxHeight: 'none',
          minWidth: 0,
          minHeight: 0,
        }
      }

      const pos = positions[id]
      const size = sizes[id]
      const { width: minWidth, height: minHeight } = getMinSize(id)
      const style: CSSProperties = {
        zIndex,
        maxWidth: 'none',
        maxHeight: 'none',
        minWidth,
        minHeight,
      }

      if (pos) {
        style.left = pos.x
        style.top = pos.y
        style.transform = 'none'
      }
      if (size) {
        style.width = size.width
        style.height = size.height
      }

      return style
    },
    [desktopRef, maximized, positions, sizes],
  )

  const isMinimized = useCallback((id: DesktopWindowId) => Boolean(minimized[id]), [minimized])
  const isMaximized = useCallback((id: DesktopWindowId) => Boolean(maximized[id]), [maximized])

  return {
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
  }
}
