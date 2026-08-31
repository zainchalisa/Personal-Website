import { IconArrowsMove, IconScissors, IconZoomIn } from '@tabler/icons-react'
import { SITE_PROJECT_FILENAME } from '@/config/siteIdentity'
import styles from '../PortfolioPage.module.css'

type TopBarProps = {
  dateRange: string
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isMaximized?: boolean
  onDragStart?: (e: React.PointerEvent<HTMLElement>) => void
}

export function TopBar({
  dateRange,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  onDragStart,
}: TopBarProps) {
  return (
    <div
      className={styles.topbar}
      onPointerDown={onDragStart}
      data-window-drag-handle=""
    >
      <div className={styles.tbLeft}>
        <div className={styles.wdots}>
          <button
            type="button"
            className={styles.wd}
            style={{ background: '#FF5F57' }}
            onClick={onClose}
            aria-label="Close window"
          />
          <button
            type="button"
            className={styles.wd}
            style={{ background: '#FFBD2E' }}
            onClick={onMinimize}
            aria-label="Minimize window"
          />
          <button
            type="button"
            className={styles.wd}
            style={{ background: '#28CA41' }}
            onClick={onMaximize}
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          />
        </div>
        <span className={styles.tbTitle}>{SITE_PROJECT_FILENAME}</span>
      </div>
      <div className={styles.tbRight}>
        <div className={styles.tbIcons}>
          <IconScissors aria-hidden />
          <IconArrowsMove aria-hidden />
          <IconZoomIn aria-hidden />
        </div>
        <span className={styles.tbDate}>{dateRange}</span>
      </div>
    </div>
  )
}
