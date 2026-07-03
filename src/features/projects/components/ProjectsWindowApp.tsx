import type { PointerEvent as ReactPointerEvent } from 'react'
import type { PortfolioTheme } from '../../portfolio/portfolioTheme'
import desktopStyles from '../../portfolio/Desktop.module.css'
import { TerminalProjects } from './TerminalProjects'

type ProjectsWindowAppProps = {
  theme: PortfolioTheme
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isMaximized?: boolean
  onDragStart?: (e: ReactPointerEvent<HTMLElement>) => void
}

export function ProjectsWindowApp({
  theme,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  onDragStart,
}: ProjectsWindowAppProps) {
  return (
    <div className={desktopStyles.projectsApp}>
      <div
        className={desktopStyles.projectsTitleBar}
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
        <span className={desktopStyles.projectsTitle}>Terminal — zain@portfolio</span>
      </div>
      <div className={desktopStyles.projectsBody}>
        <TerminalProjects theme={theme} variant="desktop" />
      </div>
    </div>
  )
}
