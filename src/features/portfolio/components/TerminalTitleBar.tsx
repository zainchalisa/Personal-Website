import { useEffect, useState } from 'react'
import styles from './TerminalTitleBar.module.css'

const PATH_CROSSFADE_MS = 150
const PROJECTS_LIST_PATH = '~/projects'

type TerminalTitleBarProps = {
  path: string
  showBreadcrumb?: boolean
  onRedClick: () => void
  onBackToList?: () => void
  closeLocked?: boolean
  redDotLabel?: string
}

export function TerminalTitleBar({
  path,
  showBreadcrumb = false,
  onRedClick,
  onBackToList,
  closeLocked = false,
  redDotLabel = 'Back to home',
}: TerminalTitleBarProps) {
  const [displayPath, setDisplayPath] = useState(path)
  const [pathVisible, setPathVisible] = useState(true)

  const pathSuffix =
    showBreadcrumb && displayPath.startsWith(`${PROJECTS_LIST_PATH}/`)
      ? displayPath.slice(PROJECTS_LIST_PATH.length)
      : ''

  useEffect(() => {
    if (path === displayPath) return
    setPathVisible(false)
    const timer = window.setTimeout(() => {
      setDisplayPath(path)
      setPathVisible(true)
    }, PATH_CROSSFADE_MS / 2)
    return () => window.clearTimeout(timer)
  }, [path, displayPath])

  const pathClass = `${styles.path} ${pathVisible ? styles.pathVisible : styles.pathHidden}`
  const closeLabel = showBreadcrumb ? 'Back to project list' : redDotLabel

  return (
    <header className={styles.titleBar}>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onRedClick}
        disabled={closeLocked}
        aria-label={closeLabel}
      >
        <span className={styles.closeIcon} aria-hidden>
          ×
        </span>
      </button>

      <div className={styles.pathWrap}>
        {showBreadcrumb && onBackToList ? (
          <button
            type="button"
            className={styles.pathBack}
            onClick={onBackToList}
            aria-label="Back to project list"
          >
            <span className={pathClass}>
              <span className={styles.crumb} aria-hidden>
                ‹{' '}
              </span>
              <span className={styles.pathRoot}>{PROJECTS_LIST_PATH}</span>
              {pathSuffix ? (
                <span className={styles.pathCurrent} aria-hidden>
                  {pathSuffix}
                </span>
              ) : null}
            </span>
          </button>
        ) : (
          <span className={pathClass}>{displayPath}</span>
        )}
      </div>

      <span className={styles.user} aria-hidden>
        zain@portfolio
      </span>
    </header>
  )
}
