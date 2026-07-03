import {
  useEffect,
  useLayoutEffect,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type AnimationEvent,
} from 'react'
import type { CSSProperties } from 'react'
import type { DesktopWindowId, ResizeEdge } from '../desktopTypes'
import desktopStyles from '../Desktop.module.css'

const RESIZE_HANDLES: { edge: ResizeEdge; className: string; label: string }[] = [
  { edge: 'n', className: desktopStyles.resizeN, label: 'Resize top edge' },
  { edge: 's', className: desktopStyles.resizeS, label: 'Resize bottom edge' },
  { edge: 'e', className: desktopStyles.resizeE, label: 'Resize right edge' },
  { edge: 'w', className: desktopStyles.resizeW, label: 'Resize left edge' },
  { edge: 'ne', className: desktopStyles.resizeNe, label: 'Resize top-right corner' },
  { edge: 'nw', className: desktopStyles.resizeNw, label: 'Resize top-left corner' },
  { edge: 'se', className: desktopStyles.resizeSe, label: 'Resize bottom-right corner' },
  { edge: 'sw', className: desktopStyles.resizeSw, label: 'Resize bottom-left corner' },
]

type DesktopWindowProps = {
  id: DesktopWindowId
  focused: boolean
  dragging: boolean
  resizing?: boolean
  maximized?: boolean
  resizable?: boolean
  opening?: boolean
  openingDelayMs?: number
  className?: string
  style?: CSSProperties
  windowRef: RefObject<HTMLDivElement | null> | ((el: HTMLDivElement | null) => void)
  onFocus: () => void
  onOpeningComplete?: () => void
  onResizeStart?: (edge: ResizeEdge, e: ReactPointerEvent<HTMLElement>) => void
  children: ReactNode
}

const WINDOW_OPEN_MS = 520
const WINDOW_OPEN_FADE_MS = 480

export function DesktopWindow({
  focused,
  dragging,
  resizing = false,
  maximized = false,
  resizable = true,
  opening = false,
  openingDelayMs = 0,
  className,
  style,
  windowRef,
  onFocus,
  onOpeningComplete,
  onResizeStart,
  children,
}: DesktopWindowProps) {
  const showHandles = resizable && !maximized

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.animationName !== 'windowOpen' && event.animationName !== 'windowOpenFade') return
    onOpeningComplete?.()
  }

  useLayoutEffect(() => {
    if (dragging && opening) {
      onOpeningComplete?.()
    }
  }, [dragging, opening, onOpeningComplete])

  useEffect(() => {
    if (!opening) return
    const duration = maximized ? WINDOW_OPEN_FADE_MS : WINDOW_OPEN_MS
    const timer = window.setTimeout(() => onOpeningComplete?.(), openingDelayMs + duration + 48)
    return () => window.clearTimeout(timer)
  }, [maximized, onOpeningComplete, opening, openingDelayMs])

  return (
    <div
      ref={windowRef}
      className={`${desktopStyles.window}${opening ? ` ${desktopStyles.windowOpening}` : ''} ${className ?? ''}${
        focused ? ` ${desktopStyles.windowFocused}` : ''
      }${dragging ? ` ${desktopStyles.windowDragging}` : ''}${
        resizing ? ` ${desktopStyles.windowResizing}` : ''
      }${maximized ? ` ${desktopStyles.windowMaximized}` : ''}`}
      style={{
        ...style,
        ['--window-open-delay' as string]: `${openingDelayMs}ms`,
      }}
      onMouseDown={onFocus}
      onAnimationEnd={handleAnimationEnd}
      role="dialog"
      aria-modal={false}
    >
      <div className={desktopStyles.windowContent}>{children}</div>
      {showHandles &&
        RESIZE_HANDLES.map(({ edge, className: handleClass, label }) => (
          <div
            key={edge}
            className={`${desktopStyles.resizeHandle} ${handleClass}`}
            onPointerDown={(e) => {
              e.stopPropagation()
              onResizeStart?.(edge, e)
            }}
            aria-label={label}
          />
        ))}
    </div>
  )
}
