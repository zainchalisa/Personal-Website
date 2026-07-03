import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Theme } from '@/shared/hooks/themeTransition'
import PhotographyPinboard from '@/features/photography/components/PhotographyPinboard'
import '@/features/photography/photography.css'
import desktopStyles from '../Desktop.module.css'

type PhotographyWindowAppProps = {
  theme: Theme
  active: boolean
  chromeless?: boolean
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isMaximized?: boolean
  onDragStart?: (e: ReactPointerEvent<HTMLElement>) => void
}

export function PhotographyWindowApp({
  theme,
  active,
  chromeless = false,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  onDragStart,
}: PhotographyWindowAppProps) {
  return (
    <div className={desktopStyles.photographyApp}>
      {!chromeless && (
        <div
          className={desktopStyles.photographyTitleBar}
          onPointerDown={onDragStart}
          data-window-drag-handle=""
        >
          <div className={desktopStyles.finderTraffic}>
            <button
              type="button"
              className={`${desktopStyles.trafficBtn} ${desktopStyles.trafficClose}`}
              onClick={onClose}
              aria-label="Close window"
            />
            <button
              type="button"
              className={`${desktopStyles.trafficBtn} ${desktopStyles.trafficMin}`}
              onClick={onMinimize}
              aria-label="Minimize window"
            />
            <button
              type="button"
              className={`${desktopStyles.trafficBtn} ${desktopStyles.trafficMax}`}
              onClick={onMaximize}
              aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            />
          </div>
          <span className={desktopStyles.photographyTitle}>Photography</span>
        </div>
      )}
      <div className={desktopStyles.photographyBody}>
        <div className="photography-page" data-theme={theme}>
          <div className="photography-stage">
            <PhotographyPinboard active={active} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  )
}
