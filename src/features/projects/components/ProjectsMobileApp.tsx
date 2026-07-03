import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import type { PortfolioTheme } from '../../portfolio/portfolioTheme'
import { useIosAppShell } from '../../portfolio/components/IosAppShellContext'
import { getProjectDetailPath } from '../terminalProjectMeta'
import type { TerminalProject } from '../terminalProjectTypes'
import { TERMINAL_PROJECTS } from '../terminalProjectsData'
import { TerminalProjects } from './TerminalProjects'
import { TerminalTitleBar } from '../../portfolio/components/TerminalTitleBar'
import { patchPortfolioSession, readPortfolioSession } from '../../portfolio/portfolioSessionState'
import '../terminal.css'
import styles from './ProjectsMobileApp.module.css'

const EDGE_SWIPE_ZONE_PX = 24
const EDGE_SWIPE_THRESHOLD_PX = 72

type ProjectsMobileAppProps = {
  theme: PortfolioTheme
}

export function ProjectsMobileApp({ theme }: ProjectsMobileAppProps) {
  const { requestClose, closeLocked } = useIosAppShell()
  const savedSlug = readPortfolioSession()?.projects?.selectedProjectSlug
  const [selectedProject, setSelectedProject] = useState<TerminalProject | null>(() => {
    if (!savedSlug) return null
    return TERMINAL_PROJECTS.find((project) => project.slug === savedSlug) ?? null
  })
  const detailCloseRef = useRef<(() => void) | null>(null)
  const edgeSwipeStartX = useRef<number | null>(null)

  const handleBackToList = useCallback(() => {
    detailCloseRef.current?.()
  }, [])

  const handleRedClick = useCallback(() => {
    if (selectedProject) {
      detailCloseRef.current?.()
      return
    }
    requestClose()
  }, [requestClose, selectedProject])

  const handleEdgeBack = useCallback(() => {
    if (selectedProject) {
      detailCloseRef.current?.()
      return
    }
    requestClose()
  }, [requestClose, selectedProject])

  const onEdgeTouchStart = useCallback((e: ReactTouchEvent) => {
    const x = e.touches[0]?.clientX
    if (x != null && x <= EDGE_SWIPE_ZONE_PX) {
      edgeSwipeStartX.current = x
    }
  }, [])

  const onEdgeTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      const startX = edgeSwipeStartX.current
      const endX = e.changedTouches[0]?.clientX
      if (startX != null && endX != null && endX - startX > EDGE_SWIPE_THRESHOLD_PX) {
        handleEdgeBack()
      }
      edgeSwipeStartX.current = null
    },
    [handleEdgeBack],
  )

  const path = selectedProject
    ? getProjectDetailPath(selectedProject.slug)
    : '~/projects'

  useEffect(() => {
    patchPortfolioSession({
      projects: { selectedProjectSlug: selectedProject?.slug ?? null },
    })
  }, [selectedProject])

  return (
    <div
      className={styles.root}
      data-portfolio-theme={theme}
      onTouchStart={onEdgeTouchStart}
      onTouchEnd={onEdgeTouchEnd}
    >
      <TerminalTitleBar
        path={path}
        showBreadcrumb={selectedProject != null}
        onRedClick={handleRedClick}
        onBackToList={selectedProject ? handleBackToList : undefined}
        closeLocked={closeLocked}
      />
      <div className={styles.body}>
        <TerminalProjects
          theme={theme}
          variant="mobile"
          onSelectedProjectChange={setSelectedProject}
          detailCloseRef={detailCloseRef}
        />
      </div>
    </div>
  )
}
